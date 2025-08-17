import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UserSignInRequestDto, UserChangePasswordRequestDto } from '../../../common/dto';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '../../user/repositories';
import { Generation } from '../../../common/utilities/generation';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
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

  async register(data: any): Promise<any> {
    try {
      const existsUser = await this.userRepository.checkExistsUser(null, { phone: data.phone });
      if (existsUser) {
        throw new BadRequestException('User Phone is exists');
      }
      data.password = Generation.encodePassword(data.password);
      await this.userRepository.createUser(null, data);
      return true;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async logout(user: any): Promise<any> {
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // For JWT-based authentication, logout is typically handled client-side
    // by removing the token from storage (localStorage, sessionStorage, etc.)
    // Server-side logout is not strictly necessary for stateless JWTs

    return {
      message: 'User logged out successfully',
      timestamp: new Date().toISOString(),
    };
  }
}
