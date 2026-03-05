import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { CategoryModule } from './modules/category/category.module';
import { SubCategoryModule } from './modules/sub-category/sub-category.module';
import { TransactionModule } from './modules/transaction/transaction.module';
import { BudgetModule } from './modules/budget/budget.module';
import { ChatModule } from './modules/chat/chat.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './modules/auth/guards';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000,   // 1 minute
        limit: 100,   // global default: 100 req/min per tracker
      },
    ]),
    UserModule,
    AuthModule,
    CategoryModule,
    SubCategoryModule,
    TransactionModule,
    BudgetModule,
    ChatModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
