export class PaginationMetaDto {
  page: number;

  limit: number;

  totalRecords: number;

  constructor(page: number, limit: number, totalRecords: number) {
    this.page = page;
    this.limit = limit;
    this.totalRecords = totalRecords;
  }
}
