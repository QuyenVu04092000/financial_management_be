import { Controller, Get, Post, Req, Put, Body } from '@nestjs/common';
import { NormalResponseDto, UserChangePasswordRequestDto } from '../../../common/dto';
import { AuthService } from '../services';
import { Public } from '../decorators/auth.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async signIn(@Req() req: any) {
    return new NormalResponseDto(await this.authService.validateUser(req.body));
  }

  @Get('profile')
  async getStatus(@Req() req: any) {
    return new NormalResponseDto(await this.authService.getProfile(req.user));
  }

  @Put('change-password')
  async changePassword(@Body() data: UserChangePasswordRequestDto, @Req() req: any) {
    return new NormalResponseDto(await this.authService.changePassword(data, req.user));
  }

  @Public()
  @Post('register')
  async register(@Body() data: any) {
    return new NormalResponseDto(await this.authService.register(data));
  }

  // Uncomment if you want to implement a logout endpoint
  @Post('logout')
  async logout(@Req() req: any) {
    return new NormalResponseDto(await this.authService.logout(req.user));
  }
}
