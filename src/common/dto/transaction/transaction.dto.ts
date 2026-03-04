import { IsNotEmpty, IsOptional, IsString, IsEnum, IsNumber, Min, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';

export enum TransactionType {
  IN = 'in',
  OUT = 'out',
}

export class TransactionCreateRequestDto {
  @IsNotEmpty()
  @IsEnum(TransactionType)
  type: TransactionType;

  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  @Transform(({ value }) => parseFloat(value))
  amount: number;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  subCategoryId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  note?: string;

  // New: optional createdAt (day/date) field, expect ISO or YYYY-MM-DD
  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined), { toClassOnly: true })
  createdAt?: Date;
}

export class TransactionUpdateRequestDto {
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Transform(({ value }) => (value ? parseFloat(value) : undefined))
  amount?: number;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  subCategoryId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class TransactionQueryDto {
  @IsNotEmpty()
  @Transform(({ value }) => (value ? new Date(value) : undefined), { toClassOnly: true })
  startDate?: Date; // Start date for filtering (ISO string or YYYY-MM-DD)

  @IsNotEmpty()
  @Transform(({ value }) => (value ? new Date(value) : undefined), { toClassOnly: true })
  endDate?: Date; // End date for filtering (ISO string or YYYY-MM-DD)

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(
    ({ value }) => {
      if (value == null) return undefined;
      if (Array.isArray(value)) return value.filter((v) => v != null && v !== '');
      if (typeof value === 'string')
        return value
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      return undefined;
    },
    { toClassOnly: true },
  )
  categoryIds?: string[]; // Optional: only transactions whose sub-category's categoryId is in this list
}

export class TransactionByCategoryQueryDto {
  @IsOptional()
  @IsString()
  categoryId?: string; // Optional: category ID to filter by

  @IsOptional()
  @IsString()
  subCategoryId?: string; // Optional: sub-category ID to filter by

  @IsOptional()
  @IsString()
  month?: string; // Format: MM/YYYY (e.g., "01/2025") - Optional: specific month

  @IsOptional()
  @IsString()
  week?: string; // Format: DD/MM/YYYY-DD/MM/YYYY (e.g., "10/12/2025-17/12/2025") - Optional: specific week

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  allMonths?: boolean; // Optional: if true, return all months grouped

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  allWeeks?: boolean; // Optional: if true, return all weeks grouped
}

export class TransactionResponseDto {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  status: string;
  type: string;
  amount: number;
  categoryId?: string;
  subCategoryId?: string;
  userId: string;
  note?: string;
  categoryName?: string;
  subCategoryName?: string;

  constructor(transaction: any) {
    this.id = transaction.id;
    this.createdAt = transaction.createdAt;
    this.updatedAt = transaction.updatedAt;
    this.status = transaction.status;
    this.type = transaction.type;
    this.amount = Number(transaction.amount);
    this.categoryId = transaction.categoryId;
    this.subCategoryId = transaction.subCategoryId;
    this.userId = transaction.userId;
    this.note = transaction.note;
    this.categoryName = transaction.subCategory?.category?.name || null;
    this.subCategoryName = transaction.subCategory?.name || null;
  }
}

export class TransactionByCategoryResponseDto {
  period: string; // Format: "1", "2", ..., "12" for month, or "6 - 12" or "27/10 - 2/11" for week
  amount: number; // Total amount of all transactions (0 if no transactions)
  transactions: TransactionResponseDto[];

  constructor(period: string, transactions: TransactionResponseDto[]) {
    this.period = period;
    // Calculate total amount from all transactions, or 0 if no transactions
    this.amount = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
    this.transactions = transactions;
  }
}

export class TransactionByCategoryGroupedResponseDto {
  periods: TransactionByCategoryResponseDto[]; // Array of periods with their transactions
  summary?: SubCategorySummaryDto[]; // Optional: per-sub-category totals across all periods
}

export class SubCategorySummaryDto {
  subCategoryId: string;
  name: string;
  icon?: string;
  totalIncome: number;
  totalExpense: number;

  constructor(
    subCategoryId: string,
    name: string,
    icon: string | null | undefined,
    totalIncome: number,
    totalExpense: number,
  ) {
    this.subCategoryId = subCategoryId;
    this.name = name;
    this.icon = icon || undefined;
    this.totalIncome = totalIncome;
    this.totalExpense = totalExpense;
  }
}
