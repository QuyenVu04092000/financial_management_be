import { IsNotEmpty, IsOptional, IsString, IsNumber, Min, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class CategoryBudgetCreateRequestDto {
  @IsNotEmpty()
  @IsString()
  categoryId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  budget: number;

  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: 'Month must be in format YYYY-MM' })
  month: string; // Format: YYYY-MM
}

export class SubCategoryBudgetCreateRequestDto {
  @IsNotEmpty()
  @IsString()
  subCategoryId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  budget: number;

  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: 'Month must be in format YYYY-MM' })
  month: string; // Format: YYYY-MM
}

export class BudgetQueryDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: 'Month must be in format YYYY-MM' })
  month?: string; // Format: YYYY-MM
}

export class CategoryBudgetResponseDto {
  id: string;
  categoryId: string;
  budget: number;
  month: string;
  userId: string;
  totalExpense?: number;
  remainingBudget?: number;

  constructor(budget: any, totalExpense?: number) {
    this.id = budget.id;
    this.categoryId = budget.categoryId;
    this.budget = Number(budget.budget);
    this.month = budget.month;
    this.userId = budget.userId;
    if (totalExpense !== undefined) {
      this.totalExpense = totalExpense;
      this.remainingBudget = this.budget - totalExpense;
    }
  }
}

export class SubCategoryBudgetResponseDto {
  id: string;
  subCategoryId: string;
  budget: number;
  month: string;
  userId: string;
  totalExpense?: number;
  remainingBudget?: number;
  period?: {
    startDate: Date;
    endDate: Date;
    label: string; // e.g., "10/01/2025 - 09/02/2025"
  };

  constructor(budget: any, totalExpense?: number, period?: { startDate: Date; endDate: Date; label: string }) {
    this.id = budget.id;
    this.subCategoryId = budget.subCategoryId;
    this.budget = Number(budget.budget);
    this.month = budget.month;
    this.userId = budget.userId;
    if (totalExpense !== undefined) {
      this.totalExpense = totalExpense;
      this.remainingBudget = this.budget - totalExpense;
    }
    if (period) {
      this.period = period;
    }
  }
}

export class SubCategoryBudgetSummaryResponseDto {
  subCategoryId: string;
  budget: number;
  month: string;
  userId: string;
  totalExpense?: number;
  remainingBudget?: number;
}
