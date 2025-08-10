import { BadRequestException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { PrismaUnitOfWorkService } from '../../../prisma/prisma-uow.services';
import { UserRepository } from '../repositories';
import {
  UserCreateRequestDto,
  UserDetailGetResponseDto,
  UserUpdateRequestDto,
  CheckExistsUserRequestDto,
} from '../../../common/dto';
import { Generation } from '../../../common/utilities';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly prismaUnitOfWorkService: PrismaUnitOfWorkService,
  ) {}

  async getUserDetailById(id: string): Promise<UserDetailGetResponseDto> {
    const user = await this.userRepository.getUserDetailById(id);
    const result = new UserDetailGetResponseDto(user);
    return result;
  }

  async checkExistsUser(query: CheckExistsUserRequestDto): Promise<boolean> {
    const user = await this.userRepository.checkExistsUser(null, query);
    if (user) {
      return true;
    }
    return false;
  }

  async createUser(data: UserCreateRequestDto): Promise<any> {
    try {
      await this.prismaUnitOfWorkService.executeInTransaction(async (prisma) => {
        const existsUser = await this.userRepository.checkExistsUser(prisma, { phone: data.phone });
        if (existsUser) {
          throw new UnprocessableEntityException('User Phone is exists');
        }
        data.password = Generation.encodePassword(data.password);
        await this.userRepository.createUser(prisma, data);
        return true;
      });
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async updateUser(id: string, data: UserUpdateRequestDto): Promise<any> {
    try {
      await this.prismaUnitOfWorkService.executeInTransaction(async (prisma) => {
        const currentUser = await this.userRepository.getUserById(prisma, id);
        if (!currentUser) {
          throw new NotFoundException('User not found');
        }
        await this.userRepository.updateUser(prisma, id, data);
        return true;
      });
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}
