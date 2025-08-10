import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaUnitOfWorkService } from '../../../prisma/prisma-uow.services';
import { TransactionRepository } from '../repositories';
import {
  TransactionCreateRequestDto,
  TransactionCreateResponseDto,
  TransactionDetailGetResponseDto,
} from '../../../common/dto';

@Injectable()
export class TransactionService {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly prismaUnitOfWorkService: PrismaUnitOfWorkService,
  ) {}

  async getTransactionDetailById(id: string): Promise<TransactionDetailGetResponseDto> {
    const transaction = await this.transactionRepository.getTransactionDetailById(id);
    const result = new TransactionDetailGetResponseDto(transaction);
    return result;
  }

  async getTransactionsByUserId(userId: string): Promise<TransactionDetailGetResponseDto[]> {
    const transactions = await this.transactionRepository.getTransactionsByUserId(userId);
    return transactions.map((transaction) => new TransactionDetailGetResponseDto(transaction));
  }

  async createTransaction(data: TransactionCreateRequestDto, userId: string): Promise<TransactionCreateResponseDto> {
    try {
      let createdTransaction: any;

      await this.prismaUnitOfWorkService.executeInTransaction(async (prisma) => {
        // Gán user_id từ JWT token
        data.user_id = userId;

        // Tạo transaction mới
        createdTransaction = await this.transactionRepository.createTransaction(prisma, data);
        return true;
      });

      return new TransactionCreateResponseDto(createdTransaction);
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to create transaction');
    }
  }

  async updateTransaction(id: string, data: any): Promise<TransactionDetailGetResponseDto> {
    try {
      const updatedTransaction = await this.transactionRepository.updateTransaction(id, data);
      return new TransactionDetailGetResponseDto(updatedTransaction);
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to update transaction');
    }
  }
}
