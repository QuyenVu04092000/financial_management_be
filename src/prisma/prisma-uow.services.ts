import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaUnitOfWorkService {
  constructor(private readonly prismaService: PrismaService) {}

  async executeInTransaction<T>(operation: (prisma: PrismaClient) => Promise<T>): Promise<T> {
    return await this.prismaService.$transaction(operation);
  }
}
