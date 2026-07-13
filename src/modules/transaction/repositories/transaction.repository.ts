import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { TransactionCreateRequestDto, TransactionUpdateRequestDto, TransactionQueryDto } from '../../../common/dto';
import { Transaction } from '@prisma/client';
import { Prisma } from '@prisma/client';

@Injectable()
export class TransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getTransactions(userId: string, query?: TransactionQueryDto): Promise<Transaction[]> {
    const where: Prisma.TransactionWhereInput = {
      userId,
    };

    let startDate: Date | undefined;
    let endDate: Date | undefined;

    const queryStartDate = query?.startDate;
    const queryEndDate = query?.endDate;

    if (queryStartDate) {
      // `startDate` received as Date (from DTO transform) based on "YYYY-MM-DD"
      startDate = new Date(queryStartDate);
      startDate.setHours(0, 0, 0, 0); // normalize to start of day
    }

    if (queryEndDate) {
      // `endDate` received as Date (from DTO transform) based on "YYYY-MM-DD"
      endDate = new Date(queryEndDate);
      endDate.setHours(23, 59, 59, 999); // normalize to end of day
    }

    if (startDate || endDate) {
      where.createdAt = {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate }),
      };
    }
    // Optional: only transactions whose category (direct or via sub-category) is in categoryIds
    const categoryIds = query?.categoryIds;
    if (categoryIds?.length) {
      where.subCategoryId = { in: categoryIds };
    }

    return await this.prisma.transaction.findMany({
      where,
      include: {
        subCategory: {
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getTransactionsByCategory(
    userId: string,
    categoryId: string | undefined,
    subCategoryId: string | undefined,
    startDate: Date,
    endDate: Date,
  ): Promise<Transaction[]> {
    const where: Prisma.TransactionWhereInput = {
      userId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (subCategoryId) {
      where.subCategoryId = subCategoryId;
    }

    return await this.prisma.transaction.findMany({
      where,
      include: {
        subCategory: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getTransactionById(id: string, userId: string): Promise<Transaction> {
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with id: ${id} is not found.`);
    }

    return transaction;
  }

  async createTransaction(prisma: any, data: TransactionCreateRequestDto & { userId: string }): Promise<Transaction> {
    if (!prisma) {
      prisma = this.prisma;
    }
    return await prisma.transaction.create({
      data: {
        type: data.type,
        amount: data.amount,
        categoryId: data.categoryId,
        subCategoryId: data.subCategoryId,
        userId: data.userId,
        status: data.status || 'ACTIVE',
        createdAt: data.createdAt ?? new Date(), // explicit UTC now if not provided
        note: data.note,
      },
    });
  }

  async updateTransaction(
    prisma: any,
    id: string,
    userId: string,
    data: TransactionUpdateRequestDto,
  ): Promise<Transaction> {
    if (!prisma) {
      prisma = this.prisma;
    }
    return await prisma.transaction.update({
      where: { id },
      data: {
        ...(data.type && { type: data.type }),
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        ...(data.subCategoryId !== undefined && { subCategoryId: data.subCategoryId }),
        ...(data.status !== undefined && { status: data.status }),
      },
    });
  }

  async deleteTransaction(prisma: any, id: string, userId: string): Promise<void> {
    if (!prisma) {
      prisma = this.prisma;
    }
    await prisma.transaction.delete({
      where: { id },
    });
  }

  async getTotalExpenseByCategory(categoryId: string, userId: string, month?: string): Promise<number> {
    const where: Prisma.TransactionWhereInput = {
      userId,
      type: 'out',
      categoryId,
    };

    if (month) {
      const [year, monthNum] = month.split('-');
      const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(monthNum), 0, 23, 59, 59, 999);

      where.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    const result = await this.prisma.transaction.aggregate({
      where,
      _sum: {
        amount: true,
      },
    });

    return Number(result._sum.amount || 0);
  }

  async getTotalExpenseBySubCategory(subCategoryId: string, userId: string, month?: string): Promise<number> {
    const where: Prisma.TransactionWhereInput = {
      userId,
      type: 'out',
      subCategoryId,
    };

    if (month) {
      const [year, monthNum] = month.split('-');
      const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(monthNum), 0, 23, 59, 59, 999);

      where.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    const result = await this.prisma.transaction.aggregate({
      where,
      _sum: {
        amount: true,
      },
    });

    return Number(result._sum.amount || 0);
  }

  async getExpenseAggregateByCategoryIds(
    userId: string,
    filters: Array<{ categoryId: string; startDate: Date; endDate: Date }>,
  ): Promise<Map<string, number>> {
    const result = new Map<string, number>();
    if (!filters.length) return result;

    await Promise.all(
      filters.map(async ({ categoryId, startDate, endDate }) => {
        const agg = await this.prisma.transaction.aggregate({
          where: { userId, categoryId, type: 'out', createdAt: { gte: startDate, lte: endDate } },
          _sum: { amount: true },
        });
        result.set(categoryId, Number(agg._sum.amount || 0));
      }),
    );
    return result;
  }

  async getExpenseAggregateBySubCategoryIds(
    userId: string,
    filters: Array<{ subCategoryId: string; startDate: Date; endDate: Date }>,
  ): Promise<Map<string, number>> {
    const result = new Map<string, number>();
    if (!filters.length) return result;

    await Promise.all(
      filters.map(async ({ subCategoryId, startDate, endDate }) => {
        const agg = await this.prisma.transaction.aggregate({
          where: { userId, subCategoryId, type: 'out', createdAt: { gte: startDate, lte: endDate } },
          _sum: { amount: true },
        });
        result.set(subCategoryId, Number(agg._sum.amount || 0));
      }),
    );
    return result;
  }

  async getTodaySpent(userId: string): Promise<number> {
    // Get current date in UTC+7 timezone
    const now = new Date();
    // Convert to UTC+7: add 7 hours to UTC time
    const utc7Time = new Date(now.getTime() + 7 * 60 * 60 * 1000);

    // Get date components in UTC+7
    const year = utc7Time.getUTCFullYear();
    const month = utc7Time.getUTCMonth();
    const date = utc7Time.getUTCDate();

    // Create start of day in UTC+7 (00:00:00+07:00)
    // This equals (year-month-date 00:00:00 UTC) - 7 hours = previous day 17:00:00 UTC
    const startOfDayUTC7 = new Date(Date.UTC(year, month, date, 0, 0, 0, 0));
    const startOfDay = new Date(startOfDayUTC7.getTime() - 7 * 60 * 60 * 1000);

    // Create end of day in UTC+7 (23:59:59.999+07:00)
    // This equals (year-month-date 23:59:59.999 UTC) - 7 hours = same day 16:59:59.999 UTC
    const endOfDayUTC7 = new Date(Date.UTC(year, month, date, 23, 59, 59, 999));
    const endOfDay = new Date(endOfDayUTC7.getTime() - 7 * 60 * 60 * 1000);

    const result = await this.prisma.transaction.aggregate({
      where: {
        userId,
        type: 'out',
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      _sum: {
        amount: true,
      },
    });

    return Number(result._sum.amount || 0);
  }

  async getReportByCategory(
    userId: string,
    startDate: Date,
    endDate: Date,
    type?: string,
    categoryId?: string,
    subCategoryId?: string,
  ): Promise<any[]> {
    const where: Prisma.TransactionWhereInput = {
      userId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (type) {
      where.type = type;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (subCategoryId) {
      where.subCategoryId = subCategoryId;
    }

    // Group by category and sub-category, sum income and expense
    const transactions = await this.prisma.transaction.findMany({
      where,
      include: {
        subCategory: {
          include: {
            category: true,
          },
        },
      },
    });

    // Collect all unique categoryIds and subCategoryIds to look up
    const categoryIds = new Set<string>();
    const subCategoryIds = new Set<string>();

    for (const transaction of transactions) {
      // Get categoryId: either from subCategory.category.id or transaction.categoryId
      if (transaction.subCategory?.category?.id) {
        categoryIds.add(transaction.subCategory.category.id);
      } else if (transaction.categoryId) {
        categoryIds.add(transaction.categoryId);
      }

      if (transaction.subCategoryId) {
        subCategoryIds.add(transaction.subCategoryId);
      }
    }

    // Look up all categories and sub-categories from their tables
    const [categories, subCategories] = await Promise.all([
      categoryIds.size > 0
        ? this.prisma.category.findMany({
            where: {
              id: { in: Array.from(categoryIds) },
            },
            select: {
              id: true,
              name: true,
            },
          })
        : [],
      subCategoryIds.size > 0
        ? this.prisma.subCategory.findMany({
            where: {
              id: { in: Array.from(subCategoryIds) },
            },
            select: {
              id: true,
              name: true,
              categoryId: true,
            },
          })
        : [],
    ]);

    // Create lookup maps for quick access
    const categoryMapById = new Map(categories.map((cat) => [cat.id, cat]));
    const subCategoryMapById = new Map(subCategories.map((sub) => [sub.id, sub]));

    // Group and aggregate
    const categoryMap = new Map<string, any>();

    for (const transaction of transactions) {
      // Determine categoryId and categoryName from database lookup
      let catId: string;
      let catName: string;

      if (transaction.subCategory?.category?.id) {
        // Category from subCategory relation
        catId = transaction.subCategory.category.id;
        const categoryFromDb = categoryMapById.get(catId);
        catName = categoryFromDb?.name || transaction.subCategory.category.name || 'Uncategorized';
      } else if (transaction.categoryId) {
        // Direct categoryId
        catId = transaction.categoryId;
        const categoryFromDb = categoryMapById.get(catId);
        catName = categoryFromDb?.name || 'Uncategorized';
      } else {
        // No category
        catId = 'uncategorized';
        catName = 'Uncategorized';
      }

      // Determine subCategoryId and subCategoryName from database lookup
      let subCatId: string;
      let subCatName: string;

      if (transaction.subCategoryId) {
        subCatId = transaction.subCategoryId;
        const subCategoryFromDb = subCategoryMapById.get(subCatId);
        subCatName = subCategoryFromDb?.name || transaction.subCategory?.name || 'None';
      } else {
        subCatId = 'none';
        subCatName = 'None';
      }

      if (!categoryMap.has(catId)) {
        categoryMap.set(catId, {
          categoryId: catId,
          categoryName: catName,
          totalIncome: 0,
          totalExpense: 0,
          subCategories: new Map<string, any>(),
        });
      }

      const category = categoryMap.get(catId);

      if (transaction.type === 'in') {
        category.totalIncome += Number(transaction.amount);
      } else {
        category.totalExpense += Number(transaction.amount);
      }

      // Handle sub-categories
      if (!category.subCategories.has(subCatId)) {
        category.subCategories.set(subCatId, {
          subCategoryId: subCatId,
          subCategoryName: subCatName,
          totalIncome: 0,
          totalExpense: 0,
        });
      }

      const subCategory = category.subCategories.get(subCatId);
      if (transaction.type === 'in') {
        subCategory.totalIncome += Number(transaction.amount);
      } else {
        subCategory.totalExpense += Number(transaction.amount);
      }
    }

    // Convert maps to arrays
    const result = Array.from(categoryMap.values()).map((cat) => ({
      categoryId: cat.categoryId,
      categoryName: cat.categoryName,
      totalIncome: cat.totalIncome,
      totalExpense: cat.totalExpense,
      subCategories: Array.from(cat.subCategories.values()),
    }));

    return result;
  }

  async getReportTotals(
    userId: string,
    startDate: Date,
    endDate: Date,
    type?: string,
  ): Promise<{ totalIncome: number; totalExpense: number }> {
    const where: Prisma.TransactionWhereInput = {
      userId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (type) {
      where.type = type;
    }

    const [incomeResult, expenseResult] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: {
          ...where,
          type: 'in',
        },
        _sum: {
          amount: true,
        },
      }),
      this.prisma.transaction.aggregate({
        where: {
          ...where,
          type: 'out',
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    return {
      totalIncome: Number(incomeResult._sum.amount || 0),
      totalExpense: Number(expenseResult._sum.amount || 0),
    };
  }
}
