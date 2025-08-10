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
}
