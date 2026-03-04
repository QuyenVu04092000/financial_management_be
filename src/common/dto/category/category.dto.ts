import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { SubCategoryResponseDto } from '../sub-category/sub-category.dto';

export class CategoryCreateRequestDto {
  @IsNotEmpty()
  @IsString()
  name: string;
}

export class CategoryUpdateRequestDto {
  @IsOptional()
  @IsString()
  name?: string;
}

export class CategoryResponseDto {
  id: string;
  name: string;
  userId: string;
  purpose?: string;
  formulaHint?: string;
  note?: string;
  isDefault?: boolean;
  icon?: string;
  subCategories?: SubCategoryResponseDto[];

  constructor(category: any) {
    this.id = category.id;
    this.name = category.name;
    this.userId = category.userId;
    this.purpose = category.purpose;
    this.formulaHint = category.formulaHint;
    this.note = category.note;
    this.isDefault = category.isDefault;
    this.icon = category.icon;
    if (category.subCategories) {
      this.subCategories = category.subCategories.map((subCategory: any) => new SubCategoryResponseDto(subCategory));
    }
  }
}
