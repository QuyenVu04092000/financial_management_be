import { PaginationMetaDto } from './pagination-meta.dto';

export class PaginationResponseDto<T> {
  data: T[];

  meta: PaginationMetaDto;

  constructor(data: T[], meta: PaginationMetaDto) {
    this.data = data;
    this.meta = meta;
  }
}
