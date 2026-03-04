import { IsNotEmpty, IsOptional, IsString, MaxLength, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ChatMessageDto {
  @IsString()
  role: 'system' | 'user' | 'assistant';

  @IsString()
  content: string;
}

export class ChatRequestDto {
  @IsNotEmpty({ message: 'Message is required' })
  @IsString()
  @MaxLength(10000, { message: 'Message must not exceed 10000 characters' })
  message: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  history?: ChatMessageDto[];
}

export class ChatResponseDto {
  reply: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };

  constructor(reply: string, usage?: { promptTokens: number; completionTokens: number; totalTokens: number }) {
    this.reply = reply;
    this.usage = usage;
  }
}
