import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { SubCategoryCreateRequestDto, SubCategoryUpdateRequestDto } from '../../../common/dto';
import { SubCategory } from '@prisma/client';

@Injectable()
export class SubCategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getSubCategoriesByCategoryId(categoryId: string, userId: string): Promise<SubCategory[]> {
    return await this.prisma.subCategory.findMany({
      where: {
        categoryId,
        OR: [{ userId }, { isDefault: true }],
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async getSubCategoriesByUserId(userId: string): Promise<SubCategory[]> {
    return await this.prisma.subCategory.findMany({
      where: {
        OR: [{ userId }, { isDefault: true }],
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async getSubCategoryById(id: string, userId: string): Promise<SubCategory> {
    const subCategory = await this.prisma.subCategory.findFirst({
      where: {
        id,
        OR: [{ userId }, { isDefault: true }],
      },
    });

    if (!subCategory) {
      throw new NotFoundException(`Sub category with id: ${id} is not found.`);
    }

    return subCategory;
  }

  async createSubCategory(prisma: any, data: SubCategoryCreateRequestDto & { userId: string }): Promise<SubCategory> {
    if (!prisma) {
      prisma = this.prisma;
    }
    return await prisma.subCategory.create({
      data: {
        name: data.name,
        categoryId: data.categoryId,
        userId: data.userId,
        icon: data.icon,
        isDefault: data.isDefault || false,
      },
    });
  }

  async updateSubCategory(
    prisma: any,
    id: string,
    userId: string,
    data: SubCategoryUpdateRequestDto,
  ): Promise<SubCategory> {
    if (!prisma) {
      prisma = this.prisma;
    }
    const subCategory = await this.getSubCategoryById(id, userId); // Verify sub category exists and belongs to user

    // Prevent updating default sub-categories (they are read-only)
    if (subCategory.isDefault) {
      throw new NotFoundException('Cannot update default sub-category. Default sub-categories are read-only.');
    }

    return await prisma.subCategory.update({
      where: { id },
      data,
    });
  }

  async deleteSubCategory(prisma: any, id: string, userId: string): Promise<void> {
    if (!prisma) {
      prisma = this.prisma;
    }
    const subCategory = await this.getSubCategoryById(id, userId); // Verify sub category exists and belongs to user

    // Prevent deleting default sub-categories (they are read-only)
    if (subCategory.isDefault) {
      throw new NotFoundException('Cannot delete default sub-category. Default sub-categories are read-only.');
    }

    await prisma.subCategory.delete({
      where: { id },
    });
  }
}
