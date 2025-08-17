import { Controller, Param, Body, Post, Put, Get, Delete, UseGuards } from '@nestjs/common';
import { TransactionService } from '../services';
import { NormalResponseDto } from '../../../common/dto';
import { TransactionCreateRequestDto, TransactionUpdateRequestDto } from 'src/common/dto/transaction';
import { JwtAuthGuard } from '../../auth/guards/auth-jwt.guard';
import { CurrentUserId } from '../../../common/decorators/current-user.decorator';
import { ResourceOwnership, ResourceOwnershipGuard } from '../../../common/guards/resource-ownership.guard';

@Controller('transactions')
@UseGuards(JwtAuthGuard) // 🔒 Tất cả endpoints đều yêu cầu authentication
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get('')
  async getTransactions(@CurrentUserId() userId: string): Promise<any> {
    return new NormalResponseDto(await this.transactionService.getTransactionsByUserId(userId));
  }

  @Get(':id')
  @UseGuards(ResourceOwnershipGuard)
  @ResourceOwnership('transaction')
  async getTransactionById(@Param('id') id: string, @CurrentUserId() userId: string): Promise<any> {
    return new NormalResponseDto(await this.transactionService.getTransactionDetailById(id, userId));
  }

  @Post('')
  async createTransaction(@Body() data: TransactionCreateRequestDto, @CurrentUserId() userId: string): Promise<any> {
    // 🔒 Tự động set user_id từ token, không tin tưởng từ client
    data.user_id = userId;
    return new NormalResponseDto(await this.transactionService.createTransaction(data, userId));
  }

  @Put(':id')
  @UseGuards(ResourceOwnershipGuard)
  @ResourceOwnership('transaction')
  async updateTransaction(
    @Param('id') id: string,
    @Body() data: TransactionUpdateRequestDto,
    @CurrentUserId() userId: string,
  ): Promise<any> {
    return new NormalResponseDto(await this.transactionService.updateTransaction(id, userId, data));
  }

  @Delete(':id')
  @UseGuards(ResourceOwnershipGuard)
  @ResourceOwnership('transaction')
  async deleteTransaction(@Param('id') id: string, @CurrentUserId() userId: string): Promise<any> {
    return new NormalResponseDto(await this.transactionService.deleteTransaction(id, userId));
  }
}
