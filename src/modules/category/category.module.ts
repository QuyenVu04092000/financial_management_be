import { Module, forwardRef } from '@nestjs/common';
import { CategoryController } from './controllers';
import { CategoryService } from './services';
import { CategoryRepository } from './repositories';
import { PrismaModule } from '../../prisma/prisma.module';
import { PrismaUnitOfWorkService } from '../../prisma/prisma-uow.services';
import { SubCategoryModule } from '../sub-category/sub-category.module';

@Module({
  imports: [PrismaModule, forwardRef(() => SubCategoryModule)],
  controllers: [CategoryController],
  providers: [CategoryService, CategoryRepository, PrismaUnitOfWorkService],
  exports: [CategoryRepository],
})
export class CategoryModule {}
