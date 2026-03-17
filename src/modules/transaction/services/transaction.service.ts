import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaUnitOfWorkService } from '../../../prisma/prisma-uow.services';
import { TransactionRepository } from '../repositories';
import {
  TransactionCreateRequestDto,
  TransactionUpdateRequestDto,
  TransactionResponseDto,
  TransactionQueryDto,
  TransactionByCategoryQueryDto,
  TransactionByCategoryResponseDto,
  TransactionByCategoryGroupedResponseDto,
  TransactionType,
  ReportQueryDto,
  ReportResponseDto,
  ReportPeriod,
  CategoryReportItemDto,
  SubCategorySummaryDto,
} from '../../../common/dto';
import { SubCategoryRepository } from '../../sub-category/repositories';
import { UserRepository } from '../../user/repositories';

@Injectable()
export class TransactionService {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly subCategoryRepository: SubCategoryRepository,
    private readonly userRepository: UserRepository,
    private readonly prismaUnitOfWorkService: PrismaUnitOfWorkService,
  ) {}

  async getTransactions(userId: string, query?: TransactionQueryDto): Promise<TransactionResponseDto[]> {
    const transactions = await this.transactionRepository.getTransactions(userId, query);
    return transactions.map((transaction) => new TransactionResponseDto(transaction));
  }

  async getTransactionsByCategory(
    userId: string,
    query: TransactionByCategoryQueryDto,
  ): Promise<TransactionByCategoryResponseDto | TransactionByCategoryGroupedResponseDto> {
    // Validate: at least one of categoryId or subCategoryId must be provided
    const hasCategoryId = !!query.categoryId;
    const hasSubCategoryId = !!query.subCategoryId;

    if (!hasCategoryId && !hasSubCategoryId) {
      throw new BadRequestException('Either categoryId or subCategoryId parameter is required');
    }

    const hasMonth = !!query.month;
    const hasWeek = !!query.week;
    const allMonths = query.allMonths === true;
    const allWeeks = query.allWeeks === true;

    // Validate: cannot use specific month/week with allMonths/allWeeks
    if ((hasMonth || hasWeek) && (allMonths || allWeeks)) {
      throw new BadRequestException('Cannot use specific month/week with allMonths/allWeeks parameters');
    }

    if (hasMonth && hasWeek) {
      throw new BadRequestException('Cannot provide both month and week parameters. Please provide only one.');
    }

    if (allMonths && allWeeks) {
      throw new BadRequestException('Cannot provide both allMonths and allWeeks parameters. Please provide only one.');
    }

    // If allMonths or allWeeks, return grouped data
    if (allMonths) {
      return await this.getTransactionsGroupedByAllMonths(userId, query);
    }

    if (allWeeks) {
      return await this.getTransactionsGroupedByAllWeeks(userId, query);
    }

    // If no month/week/allMonths/allWeeks provided, return all transactions without grouping
    if (!hasMonth && !hasWeek) {
      return await this.getTransactionsWithoutPeriod(userId, query);
    }

    let startDate: Date;
    let endDate: Date;
    let periodLabel: string;

    if (query.month) {
      // Parse MM/YYYY format (e.g., "01/2025")
      const monthMatch = query.month.match(/^(\d{2})\/(\d{4})$/);
      if (!monthMatch) {
        throw new BadRequestException('Invalid month format. Expected format: MM/YYYY (e.g., "01/2025")');
      }

      const month = parseInt(monthMatch[1], 10);
      const year = parseInt(monthMatch[2], 10);

      if (month < 1 || month > 12) {
        throw new BadRequestException('Invalid month. Month must be between 01 and 12');
      }

      startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
      endDate = new Date(year, month, 0, 23, 59, 59, 999); // Last day of the month

      // Period label: just the month number (1-12)
      periodLabel = month.toString();
    } else {
      // Parse DD/MM/YYYY-DD/MM/YYYY format (e.g., "10/12/2025-17/12/2025")
      const weekMatch = query.week?.match(/^(\d{2})\/(\d{2})\/(\d{4})-(\d{2})\/(\d{2})\/(\d{4})$/);
      if (!weekMatch) {
        throw new BadRequestException(
          'Invalid week format. Expected format: DD/MM/YYYY-DD/MM/YYYY (e.g., "10/12/2025-17/12/2025")',
        );
      }

      const startDay = parseInt(weekMatch[1], 10);
      const startMonth = parseInt(weekMatch[2], 10);
      const startYear = parseInt(weekMatch[3], 10);

      const endDay = parseInt(weekMatch[4], 10);
      const endMonth = parseInt(weekMatch[5], 10);
      const endYear = parseInt(weekMatch[6], 10);

      if (startMonth < 1 || startMonth > 12 || endMonth < 1 || endMonth > 12) {
        throw new BadRequestException('Invalid month. Month must be between 01 and 12');
      }

      startDate = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
      endDate = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);

      if (startDate > endDate) {
        throw new BadRequestException('Start date must be before or equal to end date');
      }

      // Period label: format based on whether week spans two months
      if (startMonth === endMonth && startYear === endYear) {
        // Same month: "6 - 12" (just day numbers)
        periodLabel = `${startDay} - ${endDay}`;
      } else {
        // Different months: "27/10 - 2/11" (day/month format)
        periodLabel = `${startDay}/${startMonth} - ${endDay}/${endMonth}`;
      }
    }

    const transactions = await this.transactionRepository.getTransactionsByCategory(
      userId,
      query.categoryId,
      query.subCategoryId,
      startDate,
      endDate,
    );

    const transactionDtos = transactions.map((transaction) => new TransactionResponseDto(transaction));

    // If a parent category is specified, return grouped shape with a single period and summary
    if (query.categoryId) {
      const summary = this.buildSubCategorySummary(transactions as any[]);
      return {
        periods: [new TransactionByCategoryResponseDto(periodLabel, transactionDtos)],
        summary,
      };
    }

    // Backwards-compatible shape when no categoryId is provided
    return new TransactionByCategoryResponseDto(periodLabel, transactionDtos);
  }

  /**
   * Build per-sub-category income/expense summary from a list of transactions.
   * Requires that transactions include the `subCategory` relation.
   */
  private buildSubCategorySummary(transactions: any[]): SubCategorySummaryDto[] {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        icon?: string;
        totalIncome: number;
        totalExpense: number;
      }
    >();

    for (const tx of transactions) {
      if (!tx.subCategoryId || !tx.subCategory) continue;

      const id = tx.subCategoryId as string;
      let entry = map.get(id);

      if (!entry) {
        entry = {
          id,
          name: tx.subCategory.name,
          icon: tx.subCategory.icon || undefined,
          totalIncome: 0,
          totalExpense: 0,
        };
        map.set(id, entry);
      }

      const amount = Number(tx.amount);
      if (tx.type === TransactionType.IN) {
        entry.totalIncome += amount;
      } else {
        entry.totalExpense += amount;
      }
    }

    return Array.from(map.values()).map(
      (item) => new SubCategorySummaryDto(item.id, item.name, item.icon, item.totalIncome, item.totalExpense),
    );
  }

  private async getTransactionsGroupedByAllMonths(
    userId: string,
    query: TransactionByCategoryQueryDto,
  ): Promise<TransactionByCategoryGroupedResponseDto> {
    // Calculate the last 12 months from current month
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11

    // Calculate start date: 12 months ago from current month
    let startYear = currentYear;
    let startMonth = currentMonth - 11; // Go back 11 months (current month + 11 previous = 12 total)
    if (startMonth < 0) {
      startMonth += 12;
      startYear -= 1;
    }

    const startDate = new Date(startYear, startMonth, 1, 0, 0, 0, 0);
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999); // End of today

    // Get transactions from the last 12 months
    const transactions = await this.transactionRepository.getTransactionsByCategory(
      userId,
      query.categoryId,
      query.subCategoryId,
      startDate,
      endDate,
    );

    // Generate list of last 12 months (MM/YYYY format)
    const last12Months: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(currentYear, currentMonth - i, 1);
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth() + 1;
      const monthKey = `${month}/${year}`;
      last12Months.push(monthKey);
    }

    // Group transactions by month-year (MM/YYYY format)
    const monthMap = new Map<string, TransactionResponseDto[]>();

    transactions.forEach((transaction) => {
      const date = new Date(transaction.createdAt);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const monthKey = `${month}/${year}`;

      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, []);
      }
      monthMap.get(monthKey)!.push(new TransactionResponseDto(transaction));
    });

    // Create response for each of the last 12 months, including months with no data
    const periods: TransactionByCategoryResponseDto[] = last12Months.map((monthKey) => {
      const monthTransactions = monthMap.get(monthKey) || [];
      return new TransactionByCategoryResponseDto(monthKey, monthTransactions);
    });

    const summary = query.categoryId ? this.buildSubCategorySummary(transactions as any[]) : [];

    return { periods, summary };
  }

  private async getTransactionsGroupedByAllWeeks(
    userId: string,
    query: TransactionByCategoryQueryDto,
  ): Promise<TransactionByCategoryGroupedResponseDto> {
    // Calculate the last 12 weeks from current date
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    // Generate list of last 12 weeks
    const last12Weeks: string[] = [];
    const currentWeekStart = this.getWeekStart(today); // Get Sunday of current week

    // Calculate the earliest week start (11 weeks before current week)
    const earliestWeekStart = new Date(currentWeekStart);
    earliestWeekStart.setDate(currentWeekStart.getDate() - 11 * 7); // Go back 11 weeks
    earliestWeekStart.setHours(0, 0, 0, 0);

    // Use earliest week start as the start date for query
    const startDate = earliestWeekStart;

    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(currentWeekStart);
      weekStart.setDate(currentWeekStart.getDate() - i * 7); // Go back i weeks
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // Saturday
      weekEnd.setHours(23, 59, 59, 999);

      const weekKey = this.getWeekKeyFromDates(weekStart, weekEnd);
      last12Weeks.push(weekKey);
    }

    // Get all transactions from the last 12 weeks
    const transactions = await this.transactionRepository.getTransactionsByCategory(
      userId,
      query.categoryId,
      query.subCategoryId,
      startDate,
      today,
    );

    // Initialize all weeks with empty arrays
    const weekMap = new Map<string, TransactionResponseDto[]>();
    last12Weeks.forEach((weekKey) => {
      weekMap.set(weekKey, []);
    });

    // Group transactions by week
    transactions.forEach((transaction) => {
      const date = new Date(transaction.createdAt);
      if (date >= startDate && date <= today) {
        const weekKey = this.getWeekKey(date);
        // Only include if it's one of the last 12 weeks
        if (weekMap.has(weekKey)) {
          weekMap.get(weekKey)!.push(new TransactionResponseDto(transaction));
        }
      }
    });

    // Convert week map to response array
    const periods: TransactionByCategoryResponseDto[] = last12Weeks.map((weekKey) => {
      const weekTransactions = weekMap.get(weekKey) || [];
      return new TransactionByCategoryResponseDto(weekKey, weekTransactions);
    });

    const summary = query.categoryId ? this.buildSubCategorySummary(transactions as any[]) : [];

    return { periods, summary };
  }

  private getWeekStart(date: Date): Date {
    // Get Sunday of the week
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const sunday = new Date(date);
    sunday.setDate(date.getDate() - dayOfWeek);
    sunday.setHours(0, 0, 0, 0);
    return sunday;
  }

  private generateAllWeeksFromYearStartToToday(year: number, today: Date): string[] {
    const weeks: string[] = [];
    const yearStart = new Date(year, 0, 1); // January 1st
    yearStart.setHours(0, 0, 0, 0);

    // Find the first Sunday (start of first week)
    // If Jan 1 is not Sunday, go back to the previous Sunday
    const firstDayOfYear = yearStart.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const firstSunday = new Date(yearStart);
    if (firstDayOfYear !== 0) {
      // If Jan 1 is not Sunday, go back to the previous Sunday
      firstSunday.setDate(yearStart.getDate() - firstDayOfYear);
    }
    firstSunday.setHours(0, 0, 0, 0);

    // Generate all weeks from first Sunday to today
    let currentWeekStart = new Date(firstSunday);

    while (currentWeekStart <= today) {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(currentWeekStart.getDate() + 6); // Saturday
      weekEnd.setHours(23, 59, 59, 999);

      // Only include weeks that overlap with the year start to today
      if (weekEnd >= yearStart && currentWeekStart <= today) {
        const weekKey = this.getWeekKeyFromDates(currentWeekStart, weekEnd);
        weeks.push(weekKey);
      }

      // Move to next week (next Sunday) - add 7 days
      currentWeekStart = new Date(currentWeekStart);
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
      currentWeekStart.setHours(0, 0, 0, 0);
    }

    return weeks;
  }

  private getWeekKeyFromDates(startDate: Date, endDate: Date): string {
    const startDay = startDate.getDate();
    const startMonth = startDate.getMonth() + 1;
    const endDay = endDate.getDate();
    const endMonth = endDate.getMonth() + 1;

    // Always include month to make week keys unique
    // Format: "21/9 - 27/9" if same month, "27/10 - 2/11" if different months
    if (startMonth === endMonth) {
      return `${startDay}/${startMonth} - ${endDay}/${endMonth}`;
    } else {
      return `${startDay}/${startMonth} - ${endDay}/${endMonth}`;
    }
  }

  private getWeekKey(date: Date): string {
    // Get Sunday of the week
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const sunday = new Date(date);
    sunday.setDate(date.getDate() - dayOfWeek);
    sunday.setHours(0, 0, 0, 0);

    // Get Saturday of the week
    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);
    saturday.setHours(23, 59, 59, 999);

    // Use the same method to ensure consistency
    return this.getWeekKeyFromDates(sunday, saturday);
  }

  private async getTransactionsWithoutPeriod(
    userId: string,
    query: TransactionByCategoryQueryDto,
  ): Promise<TransactionByCategoryResponseDto> {
    // Get all transactions without date filter
    const transactions = await this.transactionRepository.getTransactionsByCategory(
      userId,
      query.categoryId,
      query.subCategoryId,
      new Date(0), // Start from epoch
      new Date(), // End at now
    );

    const transactionDtos = transactions.map((transaction) => new TransactionResponseDto(transaction));

    return new TransactionByCategoryResponseDto('all', transactionDtos);
  }

  async createTransaction(data: TransactionCreateRequestDto, userId: string): Promise<TransactionResponseDto> {
    try {
      // Validate subCategoryId if provided
      if (data.subCategoryId) {
        const subCategory = await this.subCategoryRepository.getSubCategoryById(data.subCategoryId, userId);
        // If categoryId is not explicitly provided, derive it from the sub-category
        if (!data.categoryId) {
          (data as any).categoryId = subCategory.categoryId;
        }
      }

      return await this.prismaUnitOfWorkService.executeInTransaction(async (prisma) => {
        const transaction = await this.transactionRepository.createTransaction(prisma, {
          ...data,
          userId,
        });

        // Update user balance based on transaction type
        const delta = data.type === TransactionType.IN ? data.amount : -data.amount;
        await prisma.user.update({
          where: { id: userId },
          data: {
            balance: {
              increment: delta,
            },
          },
        });

        return new TransactionResponseDto(transaction);
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Failed to create transaction');
    }
  }

  async updateTransaction(
    id: string,
    data: TransactionUpdateRequestDto,
    userId: string,
  ): Promise<TransactionResponseDto> {
    try {
      // Validate subCategoryId if provided
      if (data.subCategoryId) {
        await this.subCategoryRepository.getSubCategoryById(data.subCategoryId, userId);
      }

      return await this.prismaUnitOfWorkService.executeInTransaction(async (prisma) => {
        const transaction = await this.transactionRepository.updateTransaction(prisma, id, userId, data);
        return new TransactionResponseDto(transaction);
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Failed to update transaction');
    }
  }

  async deleteTransaction(id: string, userId: string): Promise<void> {
    try {
      await this.prismaUnitOfWorkService.executeInTransaction(async (prisma) => {
        await this.transactionRepository.deleteTransaction(prisma, id, userId);
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Failed to delete transaction');
    }
  }

  async getTotalExpenseByCategory(categoryId: string, userId: string, month?: string): Promise<number> {
    return await this.transactionRepository.getTotalExpenseByCategory(categoryId, userId, month);
  }

  async getTotalExpenseBySubCategory(subCategoryId: string, userId: string, month?: string): Promise<number> {
    return await this.transactionRepository.getTotalExpenseBySubCategory(subCategoryId, userId, month);
  }

  async getTodaySpent(userId: string): Promise<number> {
    return await this.transactionRepository.getTodaySpent(userId);
  }

  private getWeekDateRange(): { startDate: Date; endDate: Date } {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek); // Go to Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Go to Saturday
    endOfWeek.setHours(23, 59, 59, 999);

    return { startDate: startOfWeek, endDate: endOfWeek };
  }

  private getPreviousWeekDateRange(): { startDate: Date; endDate: Date } {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const startOfCurrentWeek = new Date(now);
    startOfCurrentWeek.setDate(now.getDate() - dayOfWeek); // Go to Sunday
    startOfCurrentWeek.setHours(0, 0, 0, 0);

    // Previous week: 7 days before current week
    const startOfPreviousWeek = new Date(startOfCurrentWeek);
    startOfPreviousWeek.setDate(startOfCurrentWeek.getDate() - 7);

    const endOfPreviousWeek = new Date(startOfPreviousWeek);
    endOfPreviousWeek.setDate(startOfPreviousWeek.getDate() + 6); // Go to Saturday
    endOfPreviousWeek.setHours(23, 59, 59, 999);

    return { startDate: startOfPreviousWeek, endDate: endOfPreviousWeek };
  }

  private getMonthDateRange(startDayMonth: number): { startDate: Date; endDate: Date } {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();

    let startDate: Date;
    let endDate: Date;

    if (currentDay >= startDayMonth) {
      // Current month period (from startDayMonth of current month to startDayMonth-1 of next month)
      startDate = new Date(currentYear, currentMonth, startDayMonth, 0, 0, 0, 0);
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      endDate = new Date(nextYear, nextMonth, startDayMonth - 1, 23, 59, 59, 999);
    } else {
      // Previous month period (from startDayMonth of previous month to startDayMonth-1 of current month)
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      startDate = new Date(prevYear, prevMonth, startDayMonth, 0, 0, 0, 0);
      endDate = new Date(currentYear, currentMonth, startDayMonth - 1, 23, 59, 59, 999);
    }

    return { startDate, endDate };
  }

  private getPreviousMonthDateRange(startDayMonth: number): { startDate: Date; endDate: Date } {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();

    let startDate: Date;
    let endDate: Date;

    if (currentDay >= startDayMonth) {
      // Current period is from startDayMonth of current month to startDayMonth-1 of next month
      // Previous period is from startDayMonth of previous month to startDayMonth-1 of current month
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      startDate = new Date(prevYear, prevMonth, startDayMonth, 0, 0, 0, 0);
      endDate = new Date(currentYear, currentMonth, startDayMonth - 1, 23, 59, 59, 999);
    } else {
      // Current period is from startDayMonth of previous month to startDayMonth-1 of current month
      // Previous period is from startDayMonth of month before previous to startDayMonth-1 of previous month
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const prevPrevMonth = prevMonth === 0 ? 11 : prevMonth - 1;
      const prevPrevYear = prevMonth === 0 ? prevYear - 1 : prevYear;
      startDate = new Date(prevPrevYear, prevPrevMonth, startDayMonth, 0, 0, 0, 0);
      endDate = new Date(prevYear, prevMonth, startDayMonth - 1, 23, 59, 59, 999);
    }

    return { startDate, endDate };
  }

  async getReport(userId: string, query: ReportQueryDto): Promise<ReportResponseDto> {
    const user = await this.userRepository.getUserById(null, userId);
    const startDayMonth = user.startDayMonth || 1;

    let startDate: Date;
    let endDate: Date;
    let periodLabel: string;

    if (query.period === ReportPeriod.WEEK) {
      const range = this.getWeekDateRange();
      startDate = range.startDate;
      endDate = range.endDate;
      periodLabel = 'This Week';
    } else if (query.period === ReportPeriod.MONTH) {
      const range = this.getMonthDateRange(startDayMonth);
      startDate = range.startDate;
      endDate = range.endDate;
      periodLabel = 'This Month';
    } else if (query.period === ReportPeriod.CUSTOM) {
      if (!query.startDate || !query.endDate) {
        throw new BadRequestException('startDate and endDate are required for custom period');
      }
      startDate = new Date(query.startDate);
      endDate = new Date(query.endDate);
      endDate.setHours(23, 59, 59, 999);
      periodLabel = 'Custom Period';
    } else {
      // Default to current month
      const range = this.getMonthDateRange(startDayMonth);
      startDate = range.startDate;
      endDate = range.endDate;
      periodLabel = 'This Month';
    }

    const [categories, totals] = await Promise.all([
      this.transactionRepository.getReportByCategory(
        userId,
        startDate,
        endDate,
        query.type,
        query.categoryId,
        query.subCategoryId,
      ),
      this.transactionRepository.getReportTotals(userId, startDate, endDate, query.type),
    ]);

    // Calculate previous period comparison for week and month periods
    let previousPeriod: ReportResponseDto['previousPeriod'] | undefined;

    if (query.period === ReportPeriod.WEEK || query.period === ReportPeriod.MONTH || !query.period) {
      let previousStartDate: Date;
      let previousEndDate: Date;

      if (query.period === ReportPeriod.WEEK) {
        const previousWeekRange = this.getPreviousWeekDateRange();
        previousStartDate = previousWeekRange.startDate;
        previousEndDate = previousWeekRange.endDate;
      } else {
        // Month or default (month)
        const previousMonthRange = this.getPreviousMonthDateRange(startDayMonth);
        previousStartDate = previousMonthRange.startDate;
        previousEndDate = previousMonthRange.endDate;
      }

      // Fetch previous period totals
      const previousTotals = await this.transactionRepository.getReportTotals(
        userId,
        previousStartDate,
        previousEndDate,
        query.type,
      );

      // Calculate changes
      const incomeChange = totals.totalIncome - previousTotals.totalIncome;
      const expenseChange = totals.totalExpense - previousTotals.totalExpense;

      // Calculate percentage changes
      const incomeChangePercent =
        previousTotals.totalIncome > 0
          ? (incomeChange / previousTotals.totalIncome) * 100
          : totals.totalIncome > 0
            ? 100
            : 0;

      const expenseChangePercent =
        previousTotals.totalExpense > 0
          ? (expenseChange / previousTotals.totalExpense) * 100
          : totals.totalExpense > 0
            ? 100
            : 0;

      previousPeriod = {
        totalIncome: previousTotals.totalIncome,
        totalExpense: previousTotals.totalExpense,
        incomeChange,
        expenseChange,
        incomeChangePercent: Math.round(incomeChangePercent * 100) / 100, // Round to 2 decimal places
        expenseChangePercent: Math.round(expenseChangePercent * 100) / 100, // Round to 2 decimal places
      };
    }

    return {
      period: periodLabel,
      startDate,
      endDate,
      totalIncome: totals.totalIncome,
      totalExpense: totals.totalExpense,
      categories: categories as CategoryReportItemDto[],
      previousPeriod,
    };
  }
}
