import { IsNotEmpty, IsOptional, IsNumber, IsString } from 'class-validator';

export class TransactionCreateRequestDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  type: string; // 'INCOME' hoặc 'EXPENSE'

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsNotEmpty()
  @IsString()
  category_id: string;

  @IsNotEmpty()
  @IsString()
  sub_category_id: string;

  @IsOptional()
  @IsString()
  user_id?: string; // Sẽ được lấy từ JWT token
}

export class TransactionCreateResponseDto {
  id: string;
  name: string;
  type: string;
  amount: number;
  category_id: string;
  sub_category_id: string;
  user_id: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(transaction: any) {
    this.id = transaction.id;
    this.name = transaction.name;
    this.type = transaction.type;
    this.amount = transaction.amount;
    this.category_id = transaction.category_id;
    this.sub_category_id = transaction.sub_category_id;
    this.user_id = transaction.user_id;
    this.status = transaction.status;
    this.createdAt = transaction.createdAt;
    this.updatedAt = transaction.updatedAt;
  }
}

export class TransactionDetailGetResponseDto {
  id: string;
  name: string;
  type: string;
  amount: number;
  category_id: string;
  sub_category_id: string;
  user_id: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  category?: any;
  subCategory?: any;

  constructor(transaction: any) {
    this.id = transaction.id;
    this.name = transaction.name;
    this.type = transaction.type;
    this.amount = transaction.amount;
    this.category_id = transaction.category_id;
    this.sub_category_id = transaction.sub_category_id;
    this.user_id = transaction.user_id;
    this.status = transaction.status;
    this.createdAt = transaction.createdAt;
    this.updatedAt = transaction.updatedAt;
    this.category = transaction.category;
    this.subCategory = transaction.subCategory;
  }
}

export class TransactionUpdateRequestDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  type?: string; // 'INCOME' hoặc 'EXPENSE'

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  category_id?: string;

  @IsOptional()
  @IsString()
  sub_category_id?: string;

  @IsOptional()
  @IsString()
  user_id?: string; // Sẽ được lấy từ JWT token
}
