import { Controller, Param, Body, Get, Query, Put } from '@nestjs/common';
import { UserService } from '../services';
import { UserUpdateStatusRequestDto, UserUpdateRequestDto, CheckExistsUserRequestDto } from '../../../common/dto';
import { NormalResponseDto } from '../../../common/dto';
import { Public } from '../../auth/decorators/auth.decorator';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('check-exists')
  async checkExistsUser(@Query() query: CheckExistsUserRequestDto): Promise<any> {
    return new NormalResponseDto(await this.userService.checkExistsUser(query));
  }

  @Public()
  @Get(':id')
  async getUserDetailById(@Param('id') id: string): Promise<any> {
    return new NormalResponseDto(await this.userService.getUserDetailById(id));
  }

  @Put('statuses')
  async updateUserStatuses(@Body() data: UserUpdateStatusRequestDto): Promise<any> {
    return new NormalResponseDto(await this.userService.updateUserStatusByIds(data));
  }

  @Put(':id')
  async updateUser(@Param('id') id: string, @Body() data: UserUpdateRequestDto): Promise<any> {
    return new NormalResponseDto(await this.userService.updateUser(id, data));
  }
}
