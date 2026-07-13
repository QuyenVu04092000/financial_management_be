import { Module } from '@nestjs/common';
import { BudgetController } from './controllers';
import { BudgetService } from './services';
import { BudgetRepository } from './repositories';
import { PrismaModule } from '../../prisma/prisma.module';
import { PrismaUnitOfWorkService } from '../../prisma/prisma-uow.services';
import { CategoryModule } from '../category/category.module';
import { SubCategoryModule } from '../sub-category/sub-category.module';
import { TransactionModule } from '../transaction/transaction.module';
import { TransactionRepository } from '../transaction/repositories';
import { UserModule } from '../user/user.module';

@Module({
  imports: [PrismaModule, CategoryModule, SubCategoryModule, TransactionModule, UserModule],
  controllers: [BudgetController],
  providers: [BudgetService, BudgetRepository, TransactionRepository, PrismaUnitOfWorkService],
})
export class BudgetModule {}
