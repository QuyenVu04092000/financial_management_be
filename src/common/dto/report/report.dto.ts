import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';
import { TransactionType } from '../transaction/transaction.dto';

export enum ReportPeriod {
  WEEK = 'week',
  MONTH = 'month',
  CUSTOM = 'custom',
}

export class ReportQueryDto {
  @IsOptional()
  @IsEnum(ReportPeriod)
  period?: ReportPeriod; // week, month, or custom

  @IsOptional()
  @IsDateString()
  startDate?: string; // Required if period is 'custom', format: YYYY-MM-DD or ISO

  @IsOptional()
  @IsDateString()
  endDate?: string; // Required if period is 'custom', format: YYYY-MM-DD or ISO

  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType; // Optional: 'in' for income report, 'out' for expense/spent report

  @IsOptional()
  @IsString()
  categoryId?: string; // Optional: filter by specific category

  @IsOptional()
  @IsString()
  subCategoryId?: string; // Optional: filter by specific sub-category
}

export class CategoryReportItemDto {
  categoryId: string;
  categoryName: string;
  totalIncome: number;
  totalExpense: number;
  subCategories: SubCategoryReportItemDto[];
}

export class SubCategoryReportItemDto {
  subCategoryId: string;
  subCategoryName: string;
  totalIncome: number;
  totalExpense: number;
}

export class ReportResponseDto {
  period: string;
  startDate: Date;
  endDate: Date;
  totalIncome: number;
  totalExpense: number;
  categories: CategoryReportItemDto[];
  // Previous period comparison (only for week and month periods)
  previousPeriod?: {
    totalIncome: number;
    totalExpense: number;
    incomeChange: number; // Current - Previous (positive = increase, negative = decrease)
    expenseChange: number; // Current - Previous (positive = increase, negative = decrease)
    incomeChangePercent?: number; // Percentage change
    expenseChangePercent?: number; // Percentage change
  };
}

