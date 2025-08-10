import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserCreateRequestDto, UserUpdateRequestDto, CheckExistsUserRequestDto } from '../../../common/dto';
import { User } from '@prisma/client';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getUserDetailById(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with id: ${id} is not found.`);
    }

    return user;
  }

  async getUserById(prisma: any, id: string): Promise<User> {
    if (!prisma) {
      prisma = this.prisma;
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with id: ${id} is not found.`);
    }

    return user;
  }

  async checkExistsUser(prisma: any, checkExistsUserDto: CheckExistsUserRequestDto): Promise<User | null> {
    if (!prisma) {
      prisma = this.prisma;
    }

    const user = await prisma.user.findFirst({
      where: {
        phone: checkExistsUserDto.phone,
      },
    });

    return user;
  }

  async createUser(prisma: any, data: UserCreateRequestDto): Promise<any> {
    if (!prisma) {
      prisma = this.prisma;
    }
    return await prisma.user.create({
      data: {
        name: data.name,
        phone: data.phone,
        password: data.password,
        email: data.email || '',
      },
    });
  }

  async updateUser(prisma: any, id: string, data: UserUpdateRequestDto): Promise<any> {
    if (!prisma) {
      prisma = this.prisma;
    }
    return await prisma.user.update({ where: { id }, data: data });
  }

  async getUserForSignIn(phone: string): Promise<any> {
    if (!phone) {
      return null;
    }
    const user = await this.prisma.user.findFirst({
      where: {
        phone,
      },
    });
    return user;
  }
}
