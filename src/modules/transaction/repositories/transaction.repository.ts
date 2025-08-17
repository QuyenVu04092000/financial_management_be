import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { TransactionCreateRequestDto } from '../../../common/dto';
import { Transaction } from '@prisma/client';

@Injectable()
export class TransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getTransactionDetailById(id: string, userId: string): Promise<Transaction> {
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id,
        user_id: userId, // 🔒 Chỉ lấy transaction của user hiện tại
      },
      include: {
        category: true,
        subCategory: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            // Không trả về password
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with id: ${id} is not found or you don't have permission to access it.`);
    }

    return transaction;
  }

  async getTransactionById(prisma: any, id: string, userId: string): Promise<Transaction> {
    if (!prisma) {
      prisma = this.prisma;
    }

    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        user_id: userId, // 🔒 Chỉ lấy transaction của user hiện tại
      },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with id: ${id} is not found or you don't have permission to access it.`);
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

  async updateTransaction(id: string, userId: string, data: any): Promise<Transaction> {
    // 🔒 Kiểm tra transaction thuộc về user trước khi update
    await this.getTransactionById(null, id, userId);

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

  async deleteTransaction(id: string, userId: string): Promise<Transaction> {
    // 🔒 Kiểm tra transaction thuộc về user trước khi delete
    await this.getTransactionById(null, id, userId);

    return this.prisma.transaction.update({
      where: { id },
      data: {
        status: 'DELETED',
      },
    });
  }
}
