import { Module } from '@nestjs/common';
import { AuthController } from './controllers';
import { AuthService } from './services';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy, JwtStrategy } from './strategies';
import { UserRepository } from '../user/repositories';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [
    PassportModule,
    PrismaModule,
    // JwtModule và TokenBlacklistService đã được provide bởi SharedModule
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, UserRepository, JwtStrategy],
})
export class AuthModule {}
