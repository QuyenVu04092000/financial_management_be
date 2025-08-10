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
    console.log('--------------', data);
    const user = await this.userRepository.getUserForSignIn(data.phone);
    if (!user) {
      return null;
    }
    console.log('--------------', user);
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
}
