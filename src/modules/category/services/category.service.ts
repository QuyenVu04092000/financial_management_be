import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaUnitOfWorkService } from '../../../prisma/prisma-uow.services';
import { CategoryRepository } from '../repositories';
import { CategoryCreateRequestDto, CategoryUpdateRequestDto, CategoryResponseDto } from '../../../common/dto';

@Injectable()
export class CategoryService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly prismaUnitOfWorkService: PrismaUnitOfWorkService,
  ) {}

  async getCategories(userId: string): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryRepository.getCategoriesByUserId(userId);
    return categories.map((category) => new CategoryResponseDto(category));
  }

  async createCategory(data: CategoryCreateRequestDto, userId: string): Promise<CategoryResponseDto> {
    try {
      return await this.prismaUnitOfWorkService.executeInTransaction(async (prisma) => {
        const category = await this.categoryRepository.createCategory(prisma, {
          ...data,
          userId,
        });
        return new CategoryResponseDto(category);
      });
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to create category');
    }
  }

  async updateCategory(id: string, data: CategoryUpdateRequestDto, userId: string): Promise<CategoryResponseDto> {
    try {
      return await this.prismaUnitOfWorkService.executeInTransaction(async (prisma) => {
        const category = await this.categoryRepository.updateCategory(prisma, id, userId, data);
        return new CategoryResponseDto(category);
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Failed to update category');
    }
  }

  async deleteCategory(id: string, userId: string): Promise<void> {
    try {
      await this.prismaUnitOfWorkService.executeInTransaction(async (prisma) => {
        await this.categoryRepository.deleteCategory(prisma, id, userId);
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Failed to delete category');
    }
  }

  async getDefaultCategories(): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryRepository.getDefaultCategories();
    return categories.map((category) => new CategoryResponseDto(category));
  }
}
