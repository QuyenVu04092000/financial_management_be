import { Controller, Get, Post, Put, Delete, Param, Body, Req, Query, BadRequestException } from '@nestjs/common';
import { NormalResponseDto } from '../../../common/dto';
import { TransactionService } from '../services';
import {
  TransactionCreateRequestDto,
  TransactionUpdateRequestDto,
  TransactionQueryDto,
  TransactionByCategoryQueryDto,
  ReportQueryDto,
} from '../../../common/dto';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get()
  async getTransactions(@Query() rawQuery: any, @Req() req: any) {
    const userId = req.user.id;

    if (!rawQuery.startDate || !rawQuery.endDate) {
      throw new BadRequestException('startDate and endDate are required');
    }

    // Normalize query params explicitly to ensure date filter is always applied
    const query: TransactionQueryDto = {
      startDate: new Date(rawQuery.startDate),
      endDate: new Date(rawQuery.endDate),
    };

    if (rawQuery.categoryIds !== undefined) {
      const raw = rawQuery.categoryIds;
      query.categoryIds = Array.isArray(raw)
        ? raw.filter((v: unknown) => v != null && String(v).trim() !== '')
        : String(raw)
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
    }

    return new NormalResponseDto(await this.transactionService.getTransactions(userId, query));
  }

  @Get('category')
  async getTransactionsByCategory(@Query() query: TransactionByCategoryQueryDto, @Req() req: any) {
    const userId = req.user.id;
    return new NormalResponseDto(await this.transactionService.getTransactionsByCategory(userId, query));
  }

  @Post()
  async createTransaction(@Body() data: TransactionCreateRequestDto, @Req() req: any) {
    const userId = req.user.id;
    return new NormalResponseDto(await this.transactionService.createTransaction(data, userId));
  }

  @Put(':id')
  async updateTransaction(@Param('id') id: string, @Body() data: TransactionUpdateRequestDto, @Req() req: any) {
    const userId = req.user.id;
    return new NormalResponseDto(await this.transactionService.updateTransaction(id, data, userId));
  }

  @Delete(':id')
  async deleteTransaction(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id;
    await this.transactionService.deleteTransaction(id, userId);
    return new NormalResponseDto({ success: true });
  }

  @Get('today/spent')
  async getTodaySpent(@Req() req: any) {
    const userId = req.user.id;
    const amount = await this.transactionService.getTodaySpent(userId);
    return new NormalResponseDto({ amount });
  }

  @Get('report')
  async getReport(@Query() query: ReportQueryDto, @Req() req: any) {
    const userId = req.user.id;
    return new NormalResponseDto(await this.transactionService.getReport(userId, query));
  }
}
