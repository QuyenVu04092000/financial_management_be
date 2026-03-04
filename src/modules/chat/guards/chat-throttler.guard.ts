import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Rate limit by authenticated user id (so each user has their own limit).
 * Falls back to IP when not authenticated.
 */
export class ChatThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    const userId = (req as { user?: { id?: string } }).user?.id;
    if (userId) return `user:${userId}`;
    const ip =
      (req as { ip?: string }).ip ??
      (req as { connection?: { remoteAddress?: string } }).connection?.remoteAddress ??
      'unknown';
    return `ip:${ip}`;
  }
}
