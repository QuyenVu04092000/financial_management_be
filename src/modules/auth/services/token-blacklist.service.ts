import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

/**
 * Service để quản lý blacklist tokens
 * Sử dụng in-memory cache (có thể thay bằng Redis trong production)
 */
@Injectable()
export class TokenBlacklistService {
  private blacklistedTokens: Set<string> = new Set();
  private tokenExpiries: Map<string, number> = new Map();

  constructor(private readonly jwtService: JwtService) {
    // Cleanup expired tokens every hour
    setInterval(() => this.cleanupExpiredTokens(), 60 * 60 * 1000);
  }

  /**
   * Thêm token vào blacklist
   */
  blacklistToken(token: string): void {
    try {
      // Decode token để lấy expiry time
      const decoded = this.jwtService.decode(token) as any;

      if (decoded && decoded.exp) {
        const expiryTime = decoded.exp * 1000; // Convert to milliseconds

        // Chỉ blacklist nếu token chưa hết hạn
        if (expiryTime > Date.now()) {
          this.blacklistedTokens.add(token);
          this.tokenExpiries.set(token, expiryTime);
        }
      }
    } catch (error) {
      // Nếu không decode được, vẫn blacklist để an toàn
      this.blacklistedTokens.add(token);
    }
  }

  /**
   * Kiểm tra token có bị blacklist không
   */
  isTokenBlacklisted(token: string): boolean {
    return this.blacklistedTokens.has(token);
  }

  /**
   * Xóa các token đã hết hạn khỏi blacklist
   */
  private cleanupExpiredTokens(): void {
    const now = Date.now();

    for (const [token, expiry] of this.tokenExpiries.entries()) {
      if (expiry <= now) {
        this.blacklistedTokens.delete(token);
        this.tokenExpiries.delete(token);
      }
    }
  }

  /**
   * Lấy số lượng token trong blacklist (để monitoring)
   */
  getBlacklistSize(): number {
    return this.blacklistedTokens.size;
  }

  /**
   * Clear toàn bộ blacklist (chỉ dùng cho testing)
   */
  clearBlacklist(): void {
    this.blacklistedTokens.clear();
    this.tokenExpiries.clear();
  }
}
