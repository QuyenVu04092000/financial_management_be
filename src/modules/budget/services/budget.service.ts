import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaUnitOfWorkService } from '../../../prisma/prisma-uow.services';
import { BudgetRepository } from '../repositories';
import {
  CategoryBudgetCreateRequestDto,
  SubCategoryBudgetCreateRequestDto,
  BudgetQueryDto,
  CategoryBudgetResponseDto,
  SubCategoryBudgetResponseDto,
} from '../../../common/dto';
import { CategoryRepository } from '../../category/repositories';
import { SubCategoryRepository } from '../../sub-category/repositories';
import { TransactionService } from '../../transaction/services';
import { TransactionRepository } from '../../transaction/repositories';
import { UserRepository } from '../../user/repositories';

@Injectable()
export class BudgetService {
  constructor(
    private readonly budgetRepository: BudgetRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly subCategoryRepository: SubCategoryRepository,
    private readonly transactionService: TransactionService,
    private readonly transactionRepository: TransactionRepository,
    private readonly prismaUnitOfWorkService: PrismaUnitOfWorkService,
    private readonly userRepository: UserRepository,
  ) {}

  async getCategoryBudgets(userId: string, query?: BudgetQueryDto): Promise<CategoryBudgetResponseDto[]> {
    const user = await this.userRepository.getUserById(null, userId);
    const startDayMonth = user.startDayMonth || 1;
    const budgets = await this.budgetRepository.getCategoryBudgets(userId, query);
    if (!budgets.length) return [];

    const filters = budgets.map((budget) => {
      const period = this.calculatePeriodForMonth(budget.month, startDayMonth);
      return { categoryId: budget.categoryId, startDate: period.startDate, endDate: period.endDate };
    });

    const expenseMap = await this.transactionRepository.getExpenseAggregateByCategoryIds(userId, filters);
    return budgets.map((budget) => new CategoryBudgetResponseDto(budget, expenseMap.get(budget.categoryId) ?? 0));
  }

  async getSubCategoryBudgets(userId: string, query?: BudgetQueryDto): Promise<SubCategoryBudgetResponseDto[]> {
    const user = await this.userRepository.getUserById(null, userId);
    const startDayMonth = user.startDayMonth || 1;
    const budgets = await this.budgetRepository.getSubCategoryBudgets(userId, query);
    if (!budgets.length) return [];

    const filters = budgets.map((budget) => {
      const period = this.calculatePeriodForMonth(budget.month, startDayMonth);
      return { subCategoryId: budget.subCategoryId, startDate: period.startDate, endDate: period.endDate };
    });

    const expenseMap = await this.transactionRepository.getExpenseAggregateBySubCategoryIds(userId, filters);
    return budgets.map((budget) => {
      const period = this.calculatePeriodForMonth(budget.month, startDayMonth);
      return new SubCategoryBudgetResponseDto(budget, expenseMap.get(budget.subCategoryId) ?? 0, period);
    });
  }

  async createCategoryBudget(data: CategoryBudgetCreateRequestDto, userId: string): Promise<CategoryBudgetResponseDto> {
    try {
      // Verify category belongs to user
      await this.categoryRepository.getCategoryById(data.categoryId, userId);

      return await this.prismaUnitOfWorkService.executeInTransaction(async (prisma) => {
        const budget = await this.budgetRepository.upsertCategoryBudget(prisma, {
          ...data,
          userId,
        });
        const totalExpense = await this.transactionService.getTotalExpenseByCategory(
          budget.categoryId,
          userId,
          budget.month,
        );
        return new CategoryBudgetResponseDto(budget, totalExpense);
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Failed to create/update category budget');
    }
  }

  async createSubCategoryBudget(
    data: SubCategoryBudgetCreateRequestDto,
    userId: string,
  ): Promise<SubCategoryBudgetResponseDto> {
    try {
      // Verify sub category belongs to user
      await this.subCategoryRepository.getSubCategoryById(data.subCategoryId, userId);

      // Get user to get startDayMonth
      const user = await this.userRepository.getUserById(null, userId);
      const startDayMonth = user.startDayMonth || 1;

      return await this.prismaUnitOfWorkService.executeInTransaction(async (prisma) => {
        const budget = await this.budgetRepository.upsertSubCategoryBudget(prisma, {
          ...data,
          userId,
        });
        const totalExpense = await this.transactionService.getTotalExpenseBySubCategory(
          budget.subCategoryId,
          userId,
          budget.month,
        );
        const period = this.calculatePeriodForMonth(budget.month, startDayMonth);
        return new SubCategoryBudgetResponseDto(budget, totalExpense, period);
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Failed to create/update sub category budget');
    }
  }

  async getSubCategoryBudgetBySubCategoryId(
    subCategoryId: string,
    userId: string,
    month?: string,
  ): Promise<SubCategoryBudgetResponseDto> {
    try {
      // If month not provided, use current month based on user's startDayMonth
      let budgetMonth = month;
      if (!budgetMonth) {
        const user = await this.userRepository.getUserById(null, userId);
        const startDayMonth = user.startDayMonth || 1;
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const currentDay = now.getDate();

        // Determine which month period we're in
        if (currentDay >= startDayMonth) {
          // Current month period
          budgetMonth = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
        } else {
          // Previous month period
          const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          budgetMonth = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}`;
        }
      }

      // Get user to get startDayMonth for period calculation
      const user = await this.userRepository.getUserById(null, userId);
      const startDayMonth = user.startDayMonth || 1;

      // Get budget by subCategoryId and month
      const budget = await this.budgetRepository.getSubCategoryBudgetBySubCategoryAndMonth(
        subCategoryId,
        budgetMonth,
        userId,
      );

      if (!budget) {
        throw new NotFoundException(
          `Sub-category budget for subCategoryId: ${subCategoryId} and month: ${budgetMonth} is not found.`,
        );
      }

      const totalExpense = await this.transactionService.getTotalExpenseBySubCategory(
        budget.subCategoryId,
        userId,
        budget.month,
      );
      const period = this.calculatePeriodForMonth(budget.month, startDayMonth);
      return new SubCategoryBudgetResponseDto(budget, totalExpense, period);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Failed to get sub category budget');
    }
  }

  /**
   * Calculate period (startDate to endDate) based on month (YYYY-MM) and user's startDayMonth
   * Period: from startDayMonth of the month to (startDayMonth - 1) of next month
   */
  private calculatePeriodForMonth(
    month: string,
    startDayMonth: number,
  ): { startDate: Date; endDate: Date; label: string } {
    // Parse month (YYYY-MM)
    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr, 10);
    const monthNum = parseInt(monthStr, 10) - 1; // JavaScript months are 0-indexed

    // Start date: startDayMonth of the given month
    const startDate = new Date(year, monthNum, startDayMonth, 0, 0, 0, 0);

    // End date: (startDayMonth - 1) of next month, clamped to last day of that month
    let nextMonth = monthNum + 1;
    let nextYear = year;
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear = year + 1;
    }
    const lastDayOfNextMonth = new Date(nextYear, nextMonth + 1, 0).getDate();
    const rawEndDay = startDayMonth - 1 === 0 ? lastDayOfNextMonth : startDayMonth - 1;
    const endDay = Math.min(rawEndDay, lastDayOfNextMonth);
    const endDate = new Date(nextYear, nextMonth, endDay, 23, 59, 59, 999);

    // Format label: "DD/MM/YYYY - DD/MM/YYYY"
    const startDay = startDate.getDate();
    const startMonth = startDate.getMonth() + 1;
    const startYear = startDate.getFullYear();
    const endDayNum = endDate.getDate();
    const endMonth = endDate.getMonth() + 1;
    const endYear = endDate.getFullYear();

    const label = `${startDay}/${startMonth}/${startYear} - ${endDayNum}/${endMonth}/${endYear}`;

    return { startDate, endDate, label };
  }
}
