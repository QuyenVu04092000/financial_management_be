import { IsNotEmpty, IsOptional } from 'class-validator';

export class CategoryCreateRequestDto {
  @IsNotEmpty()
  name: string;

  @IsOptional()
  description?: string;

  @IsOptional()
  icon?: string;

  @IsOptional()
  color?: string;

  @IsOptional()
  user_id?: string;
}
