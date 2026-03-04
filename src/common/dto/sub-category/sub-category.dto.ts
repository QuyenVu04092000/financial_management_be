import { IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';

export class SubCategoryCreateRequestDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  categoryId: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class SubCategoryUpdateRequestDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class SubCategoryResponseDto {
  id: string;
  name: string;
  categoryId: string;
  userId: string;
  icon?: string;
  isDefault?: boolean;

  constructor(subCategory: any) {
    this.id = subCategory.id;
    this.name = subCategory.name;
    this.categoryId = subCategory.categoryId;
    this.userId = subCategory.userId;
    this.icon = subCategory.icon;
    this.isDefault = subCategory.isDefault;
  }
}
