import { Controller, Get, Post, Req, Put, Body } from '@nestjs/common';
import {
  NormalResponseDto,
  UserChangePasswordRequestDto,
  UserRegisterRequestDto,
  UserLoginRequestDto,
} from '../../../common/dto';
import { AuthService } from '../services';
import { Public } from '../decorators/auth.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() data: UserRegisterRequestDto) {
    return new NormalResponseDto(await this.authService.register(data));
  }

  @Public()
  @Post('login')
  async login(@Body() data: UserLoginRequestDto) {
    return new NormalResponseDto(await this.authService.login(data));
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
