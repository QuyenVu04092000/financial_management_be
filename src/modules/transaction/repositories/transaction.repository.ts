import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { TransactionCreateRequestDto } from '../../../common/dto';
import { Transaction } from '@prisma/client';

@Injectable()
export class TransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getTransactionDetailById(id: string): Promise<Transaction> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        category: true,
        subCategory: true,
        user: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with id: ${id} is not found.`);
    }

    return transaction;
  }

  async getTransactionById(prisma: any, id: string): Promise<Transaction> {
    if (!prisma) {
      prisma = this.prisma;
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with id: ${id} is not found.`);
    }

    return transaction;
  }

  async createTransaction(prisma: any, data: TransactionCreateRequestDto): Promise<any> {
    if (!prisma) {
      prisma = this.prisma;
    }
    return await prisma.transaction.create({
      data: {
        name: data.name,
        type: data.type,
        amount: data.amount,
        category_id: data.category_id,
        sub_category_id: data.sub_category_id,
        user_id: data.user_id,
      },
      include: {
        category: true,
        subCategory: true,
      },
    });
  }

  async getTransactionsByUserId(userId: string): Promise<Transaction[]> {
    return await this.prisma.transaction.findMany({
      where: {
        user_id: userId,
        status: 'ACTIVE',
      },
      include: {
        category: true,
        subCategory: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateTransaction(id: string, data: any): Promise<Transaction> {
    return this.prisma.transaction.update({
      where: { id },
      data: {
        name: data.name,
        type: data.type,
        amount: data.amount,
        category_id: data.category_id,
        sub_category_id: data.sub_category_id,
      },
      include: {
        category: true,
        subCategory: true,
      },
    });
  }
}
