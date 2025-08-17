import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TokenBlacklistService } from '../modules/auth/services/token-blacklist.service';

@Global() // Làm cho module này global
@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: `${process.env.JWT_SECRET}`,
      signOptions: { expiresIn: '100d' },
    }),
  ],
  providers: [TokenBlacklistService],
  exports: [TokenBlacklistService, JwtModule],
})
export class SharedModule {}
