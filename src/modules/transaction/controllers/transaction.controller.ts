import { Controller, Param, Body, Post, Put, BadRequestException } from '@nestjs/common';
import { TransactionService } from '../services';
import { NormalResponseDto } from '../../../common/dto';
import { Public } from '../../auth/decorators/auth.decorator';
import { TransactionCreateRequestDto, TransactionUpdateRequestDto } from 'src/common/dto/transaction';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  //   @Get('check-exists')
  //   async checkExistsUser(@Query() query: CheckExistsUserRequestDto): Promise<any> {
  //     return new NormalResponseDto(await this.userService.checkExistsUser(query));
  //   }

  //   @Public()
  //   @Get(':id')
  //   async getUserDetailById(@Param('id') id: string): Promise<any> {
  //     return new NormalResponseDto(await this.userService.getUserDetailById(id));
  //   }
  @Public()
  @Post('')
  async createUser(@Body() data: TransactionCreateRequestDto): Promise<any> {
    if (!data.user_id) {
      throw new BadRequestException('user_id is required');
    }
    return new NormalResponseDto(await this.transactionService.createTransaction(data, data.user_id));
  }

  //   @Put('statuses')
  //   async updateUserStatuses(@Body() data: UserUpdateStatusRequestDto): Promise<any> {
  //     return new NormalResponseDto(await this.userService.updateUserStatusByIds(data));
  //   }

  @Put(':id')
  async updateTransaction(@Param('id') id: string, @Body() data: TransactionUpdateRequestDto): Promise<any> {
    return new NormalResponseDto(await this.transactionService.updateTransaction(id, data));
  }
}
