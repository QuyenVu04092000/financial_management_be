import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaUnitOfWorkService } from '../../../prisma/prisma-uow.services';
import { SubCategoryRepository } from '../repositories';
import { SubCategoryCreateRequestDto, SubCategoryUpdateRequestDto, SubCategoryResponseDto } from '../../../common/dto';
import { CategoryRepository } from '../../category/repositories';

@Injectable()
export class SubCategoryService {
  constructor(
    private readonly subCategoryRepository: SubCategoryRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly prismaUnitOfWorkService: PrismaUnitOfWorkService,
  ) {}

  async getSubCategoriesByCategory(categoryId: string, userId: string): Promise<SubCategoryResponseDto[]> {
    // Verify category belongs to user
    await this.categoryRepository.getCategoryById(categoryId, userId);
    const subCategories = await this.subCategoryRepository.getSubCategoriesByCategoryId(categoryId, userId);
    return subCategories.map((subCategory) => new SubCategoryResponseDto(subCategory));
  }

  async getSubCategories(userId: string): Promise<SubCategoryResponseDto[]> {
    const subCategories = await this.subCategoryRepository.getSubCategoriesByUserId(userId);
    return subCategories.map((subCategory) => new SubCategoryResponseDto(subCategory));
  }

  async createSubCategory(data: SubCategoryCreateRequestDto, userId: string): Promise<SubCategoryResponseDto> {
    try {
      return await this.prismaUnitOfWorkService.executeInTransaction(async (prisma) => {
        // Verify category belongs to user
        await this.categoryRepository.getCategoryById(data.categoryId, userId);
        const subCategory = await this.subCategoryRepository.createSubCategory(prisma, {
          ...data,
          userId,
        });
        return new SubCategoryResponseDto(subCategory);
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Failed to create sub category');
    }
  }

  async updateSubCategory(
    id: string,
    data: SubCategoryUpdateRequestDto,
    userId: string,
  ): Promise<SubCategoryResponseDto> {
    try {
      return await this.prismaUnitOfWorkService.executeInTransaction(async (prisma) => {
        // If categoryId is being updated, verify it belongs to user
        if (data.categoryId) {
          await this.categoryRepository.getCategoryById(data.categoryId, userId);
        }
        const subCategory = await this.subCategoryRepository.updateSubCategory(prisma, id, userId, data);
        return new SubCategoryResponseDto(subCategory);
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Failed to update sub category');
    }
  }

  async deleteSubCategory(id: string, userId: string): Promise<void> {
    try {
      await this.prismaUnitOfWorkService.executeInTransaction(async (prisma) => {
        await this.subCategoryRepository.deleteSubCategory(prisma, id, userId);
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Failed to delete sub category');
    }
  }
}
