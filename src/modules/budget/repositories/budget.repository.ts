import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { BudgetQueryDto, CategoryBudgetCreateRequestDto, SubCategoryBudgetCreateRequestDto } from '../../../common/dto';
import { BudCategory, SubBudCategory } from '@prisma/client';
import { Prisma } from '@prisma/client';

@Injectable()
export class BudgetRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getCategoryBudgets(userId: string, query?: BudgetQueryDto): Promise<BudCategory[]> {
    const where: Prisma.BudCategoryWhereInput = { userId };
    if (query?.month) where.month = query.month;

    return await this.prisma.budCategory.findMany({
      where,
      orderBy: { month: 'desc' },
      take: query?.limit ?? 12,
    });
  }

  async getSubCategoryBudgets(userId: string, query?: BudgetQueryDto): Promise<SubBudCategory[]> {
    const where: Prisma.SubBudCategoryWhereInput = { userId };
    if (query?.month) where.month = query.month;

    return await this.prisma.subBudCategory.findMany({
      where,
      orderBy: { month: 'desc' },
      take: query?.limit ?? 12,
    });
  }

  async getCategoryBudgetByCategoryAndMonth(
    categoryId: string,
    month: string,
    userId: string,
  ): Promise<BudCategory | null> {
    return await this.prisma.budCategory.findUnique({
      where: {
        userId_categoryId_month: {
          userId,
          categoryId,
          month,
        },
      },
    });
  }

  async getSubCategoryBudgetBySubCategoryAndMonth(
    subCategoryId: string,
    month: string,
    userId: string,
  ): Promise<SubBudCategory | null> {
    return await this.prisma.subBudCategory.findUnique({
      where: {
        userId_subCategoryId_month: {
          userId,
          subCategoryId,
          month,
        },
      },
    });
  }

  async getSubCategoryBudgetById(id: string, userId: string): Promise<SubBudCategory> {
    const budget = await this.prisma.subBudCategory.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!budget) {
      throw new NotFoundException(`Sub-category budget with id: ${id} is not found.`);
    }

    return budget;
  }

  async upsertCategoryBudget(
    prisma: any,
    data: CategoryBudgetCreateRequestDto & { userId: string },
  ): Promise<BudCategory> {
    if (!prisma) {
      prisma = this.prisma;
    }
    return await prisma.budCategory.upsert({
      where: {
        userId_categoryId_month: {
          userId: data.userId,
          categoryId: data.categoryId,
          month: data.month,
        },
      },
      update: {
        budget: data.budget,
      },
      create: {
        categoryId: data.categoryId,
        budget: data.budget,
        month: data.month,
        userId: data.userId,
      },
    });
  }

  async upsertSubCategoryBudget(
    prisma: any,
    data: SubCategoryBudgetCreateRequestDto & { userId: string },
  ): Promise<SubBudCategory> {
    if (!prisma) {
      prisma = this.prisma;
    }
    const subCategory = await prisma.subCategory.findUnique({
      where: { id: data.subCategoryId },
      select: { categoryId: true },
    });
    if (!subCategory) {
      throw new NotFoundException(`Sub-category with id: ${data.subCategoryId} is not found.`);
    }
    const categoryId = subCategory.categoryId;
    return await prisma.subBudCategory.upsert({
      where: {
        userId_subCategoryId_month: {
          userId: data.userId,
          subCategoryId: data.subCategoryId,
          month: data.month,
        },
      },
      update: {
        budget: data.budget,
        categoryId,
      },
      create: {
        categoryId,
        subCategoryId: data.subCategoryId,
        budget: data.budget,
        month: data.month,
        userId: data.userId,
      },
    });
  }
}
