import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../services';
import { UserSignInRequestDto } from '../../../common/dto';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      passReqToCallback: true,
    });
  }

  async validate(req: { body: UserSignInRequestDto }): Promise<any> {
    try {
      console.log('----------------------------start');
      const { phone, password } = req.body;
      const user = await this.authService.validateUser({ phone, password });

      if (!user) {
        throw new UnauthorizedException('Invalid phone or password');
      }
      return user;
    } catch (error) {
      throw error;
    }
  }
}
