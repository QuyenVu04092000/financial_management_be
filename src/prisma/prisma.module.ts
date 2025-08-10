import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaUnitOfWorkService } from './prisma-uow.services';

@Module({
  providers: [PrismaService, PrismaUnitOfWorkService],
  exports: [PrismaService, PrismaUnitOfWorkService],
})
export class PrismaModule {}
