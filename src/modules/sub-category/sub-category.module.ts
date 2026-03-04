import { Module, forwardRef } from '@nestjs/common';
import { SubCategoryController } from './controllers';
import { SubCategoryService } from './services';
import { SubCategoryRepository } from './repositories';
import { PrismaModule } from '../../prisma/prisma.module';
import { PrismaUnitOfWorkService } from '../../prisma/prisma-uow.services';
import { CategoryModule } from '../category/category.module';

@Module({
  imports: [PrismaModule, forwardRef(() => CategoryModule)],
  controllers: [SubCategoryController],
  providers: [SubCategoryService, SubCategoryRepository, PrismaUnitOfWorkService],
  exports: [SubCategoryRepository, SubCategoryService],
})
export class SubCategoryModule {}
