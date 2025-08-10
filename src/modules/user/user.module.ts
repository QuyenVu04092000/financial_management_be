import { Module } from '@nestjs/common';
import { UserController } from './controllers';
import { UserService } from './services';
import { UserRepository } from './repositories';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PrismaUnitOfWorkService } from '../../prisma/prisma-uow.services';

@Module({
  imports: [PrismaModule],
  controllers: [UserController],
  providers: [PrismaUnitOfWorkService, UserService, UserRepository],
})
export class UserModule {}
