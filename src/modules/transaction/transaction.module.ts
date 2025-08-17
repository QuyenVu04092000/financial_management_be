import { Module } from '@nestjs/common';
import { TransactionController } from './controllers/transaction.controller';
import { TransactionService } from './services/transaction.service';
import { TransactionRepository } from './repositories/transaction.repository';
import { PrismaModule } from '../../prisma/prisma.module';
import { ResourceOwnershipGuard } from '../../common/guards/resource-ownership.guard';

@Module({
  imports: [PrismaModule],
  controllers: [TransactionController],
  providers: [
    TransactionService,
    TransactionRepository,
    ResourceOwnershipGuard, // 🔒 Đăng ký guard để kiểm tra ownership
  ],
  exports: [TransactionService, TransactionRepository],
})
export class TransactionModule {}
