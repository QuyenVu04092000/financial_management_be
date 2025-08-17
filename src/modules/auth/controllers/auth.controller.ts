import { Controller, Get, Post, Req, Put, Body, BadRequestException } from '@nestjs/common';
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

  @Post('logout')
  async logout(@Req() req: any) {
    // Lấy token từ Authorization header
    const token = this.extractTokenFromHeader(req);
    if (!token) {
      throw new BadRequestException('Authorization token is required');
    }
    return new NormalResponseDto(await this.authService.logout(req.user, token));
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
