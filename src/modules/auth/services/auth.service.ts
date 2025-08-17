import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UserSignInRequestDto, UserChangePasswordRequestDto } from '../../../common/dto';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '../../user/repositories';
import { Generation } from '../../../common/utilities/generation';
import { TokenBlacklistService } from './token-blacklist.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {}

  async validateUser(data: UserSignInRequestDto): Promise<any> {
    const user = await this.userRepository.getUserForSignIn(data.phone);
    if (!user) {
      return null;
    }
    if (!Generation.comparePassword(data.password, user.password)) {
      return null;
    }

    const payload = {
      id: user.id,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      name: user.name,
      status: user.status,
      email: user.email,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
    };
  }

  async getProfile(user: any): Promise<any> {
    return {
      ...user,
    };
  }

  async changePassword(data: UserChangePasswordRequestDto, user: any): Promise<any> {
    let phone = user.phone;
    if (data.phone) {
      phone = data.phone;
    }
    const userInfo = await this.userRepository.getUserForSignIn(phone);
    if (!userInfo) {
      return new NotFoundException('User not found');
    }

    if (!Generation.comparePassword(data.oldPassword, userInfo.password)) {
      return new BadRequestException('Old password is incorrect');
    } else {
      if (data.newPassword === data.confirmPassword) {
        const newHashPassword = Generation.encodePassword(data.newPassword);
        await this.userRepository.updateUser(null, userInfo.id, { password: newHashPassword });
      } else {
        return new BadRequestException('New password and confirm password is not match');
      }
    }

    return true;
  }

  async logout(user: any, token: string): Promise<any> {
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!token) {
      throw new BadRequestException('Token is required for logout');
    }

    // 🔒 Thêm token vào blacklist để vô hiệu hóa
    this.tokenBlacklistService.blacklistToken(token);

    return {
      message: 'User logged out successfully. Token has been invalidated.',
      timestamp: new Date().toISOString(),
    };
  }
}
