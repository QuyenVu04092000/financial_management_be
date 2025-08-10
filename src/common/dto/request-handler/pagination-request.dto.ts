import { IsOptional } from 'class-validator';

export class PaginationRequestDto {
  @IsOptional()
  page: number;

  @IsOptional()
  limit: number;

  @IsOptional()
  skip?: number;

  constructor(page: any = 0, limit: any = 0) {
    this.page = parseInt(page) < 0 ? 0 : parseInt(page);
    this.limit = parseInt(limit) < 0 ? 0 : parseInt(limit);
    this.skip = (parseInt(page) - 1) * parseInt(limit);
  }
}
