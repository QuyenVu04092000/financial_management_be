import { BadRequestException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import {
  UserSignInRequestDto,
  UserChangePasswordRequestDto,
  UserRegisterRequestDto,
  UserLoginRequestDto,
} from '../../../common/dto';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '../../user/repositories';
import { Generation } from '../../../common/utilities/generation';
import { PrismaUnitOfWorkService } from '../../../prisma/prisma-uow.services';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly prismaUnitOfWorkService: PrismaUnitOfWorkService,
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
      balance: user.balance?.toString() ?? '0',
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
    };
  }

  async getProfile(user: any): Promise<any> {
    // Always fetch the latest user data (including updated balance) from DB
    const dbUser = await this.userRepository.getUserById(null, user.id);

    return {
      id: dbUser.id,
      createdAt: dbUser.createdAt,
      updatedAt: dbUser.updatedAt,
      name: dbUser.name,
      status: dbUser.status,
      email: dbUser.email,
      phone: dbUser.phone,
      balance: dbUser.balance?.toString() ?? '0',
      startDayMonth: dbUser.startDayMonth,
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

  async register(data: UserRegisterRequestDto): Promise<any> {
    try {
      return await this.prismaUnitOfWorkService.executeInTransaction(async (prisma) => {
        // Check if user already exists
        const existsUser = await this.userRepository.checkExistsUserByPhone(prisma, data.phone);
        if (existsUser) {
          throw new UnprocessableEntityException('Phone number already exists');
        }

        const hashedPassword = Generation.encodePassword(data.password);
        const user = await this.userRepository.createUser(prisma, {
          phone: data.phone,
          password: hashedPassword,
          name: data.name,
          email: data.email,
        });

        // Generate JWT token
        const payload = {
          id: user.id,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          name: user.name,
          status: user.status,
          email: user.email,
          balance: user.balance?.toString() ?? '0',
        };

        return {
          accessToken: await this.jwtService.signAsync(payload),
        };
      });
    } catch (error) {
      if (error instanceof UnprocessableEntityException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Registration failed');
    }
  }

  async login(data: UserLoginRequestDto): Promise<any> {
    const user = await this.userRepository.getUserByPhone(data.phone);
    if (!user) {
      throw new NotFoundException('Invalid phone or password');
    }

    if (!Generation.comparePassword(data.password, user.password)) {
      throw new NotFoundException('Invalid phone or password');
    }

    const payload = {
      id: user.id,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      name: user.name,
      status: user.status,
      email: user.email,
      balance: user.balance?.toString() ?? '0',
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
    };
  }
}
