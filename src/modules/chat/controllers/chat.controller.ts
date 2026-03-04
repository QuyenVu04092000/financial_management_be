import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { NormalResponseDto } from '../../../common/dto';
import { ChatService } from '../services';
import { ChatRequestDto } from '../../../common/dto';
import { ChatThrottlerGuard } from '../guards';
import { Throttle } from '@nestjs/throttler';

@Controller({ path: 'chat', version: '1' })
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @UseGuards(ChatThrottlerGuard)
  @Throttle({ short: { limit: 10, ttl: 60000 } }) // 10 requests per minute per user (Gemini free tier friendly)
  @Post()
  async chat(@Body() body: ChatRequestDto, @Req() req: { user?: { id: string } }) {
    const userId = req.user?.id ?? '';
    const result = await this.chatService.sendMessage(body, userId);
    return new NormalResponseDto(result);
  }
}
