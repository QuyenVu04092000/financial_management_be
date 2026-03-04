import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { ChatRequestDto, ChatResponseDto } from '../../../common/dto';
import { TransactionService } from '../../transaction/services';
import { UserRepository } from '../../user/repositories';
import { CategoryRepository } from '../../category/repositories';
import { TransactionType } from '../../../common/dto';

const DEFAULT_MODEL = 'gemini-2.5-flash';

const SYSTEM_INSTRUCTION_BASE = `You are a friendly financial assistant for a personal finance app. You MUST support both Vietnamese and English.

When the user records spending or income in natural language, you MUST respond with a JSON object ONLY, no other text before or after.

JSON format:
{"action":"ADD_EXPENSE" or "ADD_INCOME" or "NONE", "amount": number in VND (0 if NONE), "note": "short description", "reply": "friendly message in the same language as the user", "subCategoryName": "exact name from the list below or empty string"}

Rules:
- Extract amount from phrases and ALWAYS output a number in VND. Examples: 50.000 or 50k or 50000 → 50000; 20tr or 20 triệu or 20 million → 20000000; 1.5tr or 1,5 triệu → 1500000; 100k → 100000; 50 nghìn → 50000. "tr" and "triệu" mean 1,000,000 (multiply by 1,000,000). "k" and "nghìn" mean 1,000 (multiply by 1,000). Never output the raw number before multiplying (e.g. "20tr" must be 20000000, not 20).
- action: ADD_EXPENSE when user mentions spending, paying, buying, eating, chi, mua, ăn, tiền, supermarket, food... ADD_INCOME when receiving, thu, nhận, lương... NONE for questions or unclear.
- note: brief reason (e.g. "ăn", "mua cafe", "siêu thị").
- subCategoryName: MUST be one of the exact sub-category names from the list below that best matches what the user spent on (e.g. eating/food → pick Food sub-category; supermarket/shopping → pick Supermarket/Siêu thị; transport → Transport sub-category). Use the EXACT name as shown in the list. If no good match, use empty string "".
- reply: a short friendly confirmation in the user's language. If NONE, reply is your normal answer.
- Output ONLY valid JSON, no markdown and no extra text.`;

interface GeminiAction {
  action: 'ADD_EXPENSE' | 'ADD_INCOME' | 'NONE';
  amount: number;
  note: string;
  reply: string;
  subCategoryName?: string;
}

interface SubCategoryOption {
  id: string;
  name: string;
  categoryName: string;
}

type CategoryWithSubs = { name: string; subCategories: Array<{ id: string; name: string }> };

@Injectable()
export class ChatService {
  private readonly genai: GoogleGenAI | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly transactionService: TransactionService,
    private readonly userRepository: UserRepository,
    private readonly categoryRepository: CategoryRepository,
  ) {
    const apiKey =
      this.configService.get<string>('GEMINI_API_KEY') ?? this.configService.get<string>('GOOGLE_GEMINI_API_KEY');
    if (apiKey) {
      this.genai = new GoogleGenAI({ apiKey });
    }
  }

  async sendMessage(payload: ChatRequestDto, userId: string): Promise<ChatResponseDto> {
    if (!this.genai) {
      throw new BadRequestException(
        'Chat is not configured. Set GEMINI_API_KEY or GOOGLE_GEMINI_API_KEY in the environment.',
      );
    }

    const model = this.configService.get<string>('GEMINI_CHAT_MODEL') ?? DEFAULT_MODEL;

    const categories = await this.categoryRepository.getCategoriesByUserId(userId);
    const subCategoriesList = this.buildSubCategoriesList(categories);
    const systemInstruction = `${SYSTEM_INSTRUCTION_BASE}\n\nAvailable sub-categories (use EXACT name for subCategoryName):\n${subCategoriesList}`;

    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    if (payload.history?.length) {
      for (const m of payload.history) {
        if (!m.content) continue;
        const role = m.role === 'assistant' ? 'model' : m.role;
        if (role === 'user' || role === 'model') {
          contents.push({ role, parts: [{ text: m.content }] });
        }
      }
    }

    contents.push({ role: 'user', parts: [{ text: payload.message }] });

    try {
      const response = await this.genai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction,
          temperature: 0.3,
          maxOutputTokens: 1024,
        },
      });

      const text = response.text?.trim();
      if (!text) {
        throw new ServiceUnavailableException('No response from the AI service.');
      }

      const parsed = this.parseAction(text);
      let finalReply = parsed.reply || text;

      if ((parsed.action === 'ADD_EXPENSE' || parsed.action === 'ADD_INCOME') && parsed.amount > 0) {
        try {
          const subCategoryId = this.resolveSubCategoryId(categories, parsed.subCategoryName);
          await this.transactionService.createTransaction(
            {
              type: parsed.action === 'ADD_INCOME' ? TransactionType.IN : TransactionType.OUT,
              amount: parsed.amount,
              note: parsed.note || payload.message.slice(0, 200),
              ...(subCategoryId && { subCategoryId }),
            },
            userId,
          );
          const user = await this.userRepository.getUserById(null, userId);
          const balanceStr = user.balance != null ? String(user.balance) : '0';
          const amountStr = parsed.amount.toLocaleString('vi-VN');
          finalReply += `\n\nĐã ghi nhận ${parsed.action === 'ADD_INCOME' ? '+' : '-'}${amountStr} VND. Số dư hiện tại: ${balanceStr} VND.`;
        } catch (txError: unknown) {
          const errMsg =
            txError && typeof (txError as { message?: string }).message === 'string'
              ? (txError as { message: string }).message
              : 'Không thể ghi giao dịch.';
          finalReply += `\n\n(Lỗi: ${errMsg})`;
        }
      }

      const usage = response.usageMetadata
        ? {
            promptTokens: response.usageMetadata.promptTokenCount ?? 0,
            completionTokens: response.usageMetadata.candidatesTokenCount ?? 0,
            totalTokens: response.usageMetadata.totalTokenCount ?? 0,
          }
        : undefined;

      return new ChatResponseDto(finalReply, usage);
    } catch (error: unknown) {
      if (error instanceof BadRequestException || error instanceof ServiceUnavailableException) {
        throw error;
      }
      const message = this.getErrorMessage(error);
      throw new ServiceUnavailableException(
        message || 'The AI service is temporarily unavailable. Please try again later.',
      );
    }
  }

  private buildSubCategoriesList(categories: CategoryWithSubs[]): string {
    const lines: string[] = [];
    for (const cat of categories) {
      const names = (cat.subCategories || []).map((s) => s.name).join(', ');
      if (names) lines.push(`${cat.name}: ${names}`);
    }
    return lines.length ? lines.join('\n') : '(No sub-categories yet; use empty string for subCategoryName)';
  }

  private flattenSubCategories(categories: CategoryWithSubs[]): SubCategoryOption[] {
    const out: SubCategoryOption[] = [];
    for (const cat of categories) {
      for (const sub of cat.subCategories || []) {
        out.push({ id: sub.id, name: sub.name, categoryName: cat.name });
      }
    }
    return out;
  }

  private resolveSubCategoryId(categories: CategoryWithSubs[], subCategoryName: string | undefined): string | null {
    if (!subCategoryName || !subCategoryName.trim()) return null;
    const flat = this.flattenSubCategories(categories);
    const normalized = subCategoryName.trim().toLowerCase();
    const exact = flat.find((s) => s.name.trim().toLowerCase() === normalized);
    if (exact) return exact.id;
    const contains = flat.find(
      (s) => s.name.trim().toLowerCase().includes(normalized) || normalized.includes(s.name.trim().toLowerCase()),
    );
    return contains ? contains.id : null;
  }

  private parseAction(text: string): GeminiAction {
    let raw = text.trim();
    const codeMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeMatch) {
      raw = codeMatch[1].trim();
    }
    try {
      const obj = JSON.parse(raw) as Partial<GeminiAction>;
      const action = obj.action === 'ADD_EXPENSE' || obj.action === 'ADD_INCOME' ? obj.action : 'NONE';
      const amount = typeof obj.amount === 'number' && obj.amount >= 0 ? obj.amount : 0;
      const note = typeof obj.note === 'string' ? obj.note : '';
      const reply = typeof obj.reply === 'string' ? obj.reply : text;
      const subCategoryName = typeof obj.subCategoryName === 'string' ? obj.subCategoryName.trim() : '';
      return { action, amount, note, reply, subCategoryName };
    } catch {
      return { action: 'NONE', amount: 0, note: '', reply: text, subCategoryName: '' };
    }
  }

  private getErrorMessage(error: unknown): string | null {
    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as { message: unknown }).message);
    }
    if (typeof error === 'string') return error;
    return null;
  }
}
