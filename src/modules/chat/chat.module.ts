import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatController } from './controllers';
import { ChatService } from './services';
import { ChatThrottlerGuard } from './guards';
import { TransactionModule } from '../transaction/transaction.module';
import { UserModule } from '../user/user.module';
import { CategoryModule } from '../category/category.module';

@Module({
  imports: [ConfigModule, TransactionModule, UserModule, CategoryModule],
  controllers: [ChatController],
  providers: [ChatService, ChatThrottlerGuard],
})
export class ChatModule {}
