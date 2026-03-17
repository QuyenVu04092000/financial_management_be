import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { ChatRequestDto, ChatResponseDto } from '../../../common/dto';
import { TransactionService } from '../../transaction/services';
import { UserRepository } from '../../user/repositories';
import { CategoryRepository } from '../../category/repositories';
import { TransactionType } from '../../../common/dto';

const DEFAULT_MODEL = 'gemini-2.5-flash';

const SYSTEM_INSTRUCTION_BASE = `
You are a friendly financial assistant for a personal finance app. You MUST support both Vietnamese and English.

When the user records spending or income in natural language, you MUST respond with a JSON object ONLY, no other text before or after.

========================
OUTPUT FORMAT (STRICT)
========================
{
  "action": "ADD_EXPENSE" | "ADD_INCOME" | "NONE",
  "amount": number,
  "note": string,
  "reply": string,
  "subCategoryName": string,
  "date": string (YYYY-MM-DD or empty "")
}

========================
CORE RULES
========================
- ALWAYS return valid JSON only. No explanation.
- "amount" MUST be in VND (number only, no string, no symbol).
- If no amount → amount = 0.
- "note" = short description (Vietnamese if user uses Vietnamese).
- "reply" = friendly message in user's language.
- "subCategoryName" MUST match EXACT name from the provided list or "".
- "date" MUST be YYYY-MM-DD or "".

========================
AMOUNT EXTRACTION RULES
========================
Understand Vietnamese money formats:

- 50k, 50K → 50000
- 50 nghìn → 50000
- 20tr, 20 triệu → 20000000
- 1.5tr, 1,5 triệu → 1500000
- 100k → 100000

Default rules:
- If user says small number like "70", assume 70000 if context = ăn, cafe, xăng...
- If unclear → keep raw number

IMPORTANT:
- ALWAYS multiply correctly
- NEVER return raw shorthand (e.g. "20tr" → 20000000)

========================
ACTION DETECTION
========================
ADD_EXPENSE if:
ăn, uống, mua, chi, cafe, siêu thị, đổ xăng, đi chơi, shopping...

ADD_INCOME if:
nhận, lương, thưởng, được cho, chuyển khoản đến...

NONE if:
question or unclear

========================
DATE EXTRACTION RULES
========================
Today is: {TODAY_DATE}

Understand Vietnamese natural dates:

- hôm nay → {TODAY_DATE}
- hôm qua → today - 1 day
- hôm kia → today - 2 days
- hôm kìa → today - 3 days
- ngày mai → today + 1 day
- ngày mốt → today + 2 days

Relative:
- tuần trước → today - 7 days
- tháng trước → same day last month

Numeric formats:
- 2/3 → YYYY-03-02 (current year)
- 02/03 → YYYY-03-02
- 2/3/2025 → 2025-03-02
- 2025-03-02 → 그대로

If no date → return ""

========================
SMART NOTE
========================
- cf, cafe → "cà phê"
- ăn → "ăn uống"
- ăn phở → "ăn phở"
- đổ xăng → "đổ xăng"
- siêu thị → "mua siêu thị"
- đi chơi → "giải trí"
- đá bóng, đá banh, chơi bóng đá → "đá bóng"
- gym, tập gym, chạy bộ, tập thể dục → "thể thao"

Keep it SHORT.

========================
SMART CATEGORY
========================
- ăn, uống → Food
- cafe → Coffee
- siêu thị → Supermarket
- đổ xăng → Transport
- đi chơi → Entertainment
- đá bóng, đá banh, chơi bóng đá, đá bóng với bạn bè → Thể thao
- gym, tập gym, chạy bộ, tập thể dục → Thể thao

VERY IMPORTANT:
- You MUST prefer names that exist in the user's sub-category list below.
- ONLY output "subCategoryName" using an exact name from the list.
- If there is no good match in the list, set "subCategoryName" = "".

========================
USER SUB-CATEGORY LIST
========================
The user currently has these categories and sub-categories:
{SUB_CATEGORIES_LIST}

========================
MISSING DATA
========================
If missing amount:
- action = ADD_EXPENSE
- amount = 0
- ask user

If unclear:
- action = NONE

========================
REPLY STYLE
========================
Overall:
- Always be warm, encouraging, and a bit playful, but keep replies short (1–3 sentences).
- When appropriate, add a very short follow‑up question to help the user track money better.

Vietnamese:
- Examples of tone:
- "Đã ghi nhận rồi nha. 💸" (without emoji if the platform doesn't support it)
- "Bạn đã chi {amount} cho {note}."
- "Bạn muốn ghi thêm gì nữa hôm nay không?"

English:
- Examples of tone:
- "Got it, I’ve recorded this for you."
- "You just spent {amount} on {note}."
- "Anything else you’d like to track right now?"

========================
EXAMPLES
========================

Input: "ăn phở 50k hôm qua"
Output:
{
 "action":"ADD_EXPENSE",
 "amount":50000,
 "note":"ăn phở",
 "reply":"Đã ghi nhận ăn phở 50.000đ hôm qua.",
 "subCategoryName":"Food",
 "date":"<yesterday>"
}

Input: "2/3 đi chơi 300k"
Output:
{
 "action":"ADD_EXPENSE",
 "amount":300000,
 "note":"đi chơi",
 "reply":"Đã ghi nhận chi tiêu 300.000đ ngày 2/3.",
 "subCategoryName":"Entertainment",
 "date":"YYYY-03-02"
}

Input: "hôm kia cafe"
Output:
{
 "action":"ADD_EXPENSE",
 "amount":0,
 "note":"cà phê",
 "reply":"Bạn uống cà phê hôm kia, bao nhiêu tiền?",
 "subCategoryName":"Coffee",
 "date":"<2 days ago>"
}
`;

interface GeminiAction {
  action: 'ADD_EXPENSE' | 'ADD_INCOME' | 'NONE';
  amount: number;
  note: string;
  reply: string;
  subCategoryName?: string;
  // Optional ISO date string (YYYY-MM-DD) for when the transaction happened
  date?: string;
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
    const today = new Date().toISOString().slice(0, 10);
    const systemInstruction = ` ${SYSTEM_INSTRUCTION_BASE.replace('{TODAY_DATE}', today)} Available sub-categories (use EXACT name for subCategoryName): ${subCategoriesList} `;

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
          // Use UTC timestamps for storage. If the model gives a date (YYYY-MM-DD),
          // we create a UTC midnight for that day; otherwise we use current UTC time.
          const createdAt = this.resolveCreatedAt(parsed.date) ?? new Date();
          await this.transactionService.createTransaction(
            {
              type: parsed.action === 'ADD_INCOME' ? TransactionType.IN : TransactionType.OUT,
              amount: parsed.amount,
              note: parsed.note || payload.message.slice(0, 200),
              ...(subCategoryId && { subCategoryId }),
              ...(createdAt && { createdAt }),
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
      const date = typeof (obj as any).date === 'string' ? (obj as any).date.trim() : '';
      return { action, amount, note, reply, subCategoryName, date };
    } catch {
      return { action: 'NONE', amount: 0, note: '', reply: text, subCategoryName: '', date: '' };
    }
  }

  // Convert a YYYY-MM-DD string (from the model) into a Date.
  // We construct a Date at UTC midnight so all stored timestamps are in UTC.
  private resolveCreatedAt(dateStr: string | undefined): Date | null {
    if (!dateStr) return null;
    const trimmed = dateStr.trim();
    if (!trimmed) return null;
    const parts = trimmed.split('-');
    if (parts.length !== 3) return null;
    const [yearStr, monthStr, dayStr] = parts;
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);
    if (!year || !month || !day) return null;
    // Use Date.UTC so the stored value is midnight UTC for that calendar day
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  }

  private getErrorMessage(error: unknown): string | null {
    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as { message: unknown }).message);
    }
    if (typeof error === 'string') return error;
    return null;
  }
}
