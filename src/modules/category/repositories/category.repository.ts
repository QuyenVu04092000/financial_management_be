import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CategoryCreateRequestDto, CategoryUpdateRequestDto } from '../../../common/dto';
import { Category } from '@prisma/client';

@Injectable()
export class CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getCategoriesByUserId(userId: string): Promise<any[]> {
    return await this.prisma.category.findMany({
      where: {
        OR: [
          { userId }, // User's own categories
          { isDefault: true }, // Default categories
        ],
      },
      include: {
        subCategories: {
          where: {
            OR: [
              { userId }, // User's own sub-categories
              { isDefault: true }, // Default sub-categories
            ],
          },
          orderBy: {
            name: 'asc',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async getCategoryById(id: string, userId: string): Promise<Category> {
    const category = await this.prisma.category.findFirst({
      where: {
        id,
        OR: [
          { userId }, // User's own categories
          { isDefault: true }, // Default categories
        ],
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with id: ${id} is not found.`);
    }

    return category;
  }

  async createCategory(prisma: any, data: CategoryCreateRequestDto & { userId: string }): Promise<Category> {
    if (!prisma) {
      prisma = this.prisma;
    }
    return await prisma.category.create({
      data: {
        name: data.name,
        userId: data.userId,
      },
    });
  }

  async updateCategory(prisma: any, id: string, userId: string, data: CategoryUpdateRequestDto): Promise<Category> {
    if (!prisma) {
      prisma = this.prisma;
    }
    await this.getCategoryById(id, userId); // Verify category exists and belongs to user
    return await prisma.category.update({
      where: { id },
      data,
    });
  }

  async deleteCategory(prisma: any, id: string, userId: string): Promise<void> {
    if (!prisma) {
      prisma = this.prisma;
    }
    await this.getCategoryById(id, userId); // Verify category exists and belongs to user
    await prisma.category.delete({
      where: { id },
    });
  }

  async getDefaultCategories(): Promise<Category[]> {
    return await this.prisma.category.findMany({
      where: {
        isDefault: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }
}
