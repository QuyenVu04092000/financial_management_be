import { Module } from '@nestjs/common';
import { TransactionController } from './controllers';
import { TransactionService } from './services';
import { TransactionRepository } from './repositories';
import { PrismaModule } from '../../prisma/prisma.module';
import { PrismaUnitOfWorkService } from '../../prisma/prisma-uow.services';
import { SubCategoryModule } from '../sub-category/sub-category.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [PrismaModule, SubCategoryModule, UserModule],
  controllers: [TransactionController],
  providers: [TransactionService, TransactionRepository, PrismaUnitOfWorkService],
  exports: [TransactionService, TransactionRepository],
})
export class TransactionModule {}
