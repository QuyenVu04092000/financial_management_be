import { Controller, Get, Post, Body, Req, Query, Param } from '@nestjs/common';
import { NormalResponseDto } from '../../../common/dto';
import { BudgetService } from '../services';
import { CategoryBudgetCreateRequestDto, SubCategoryBudgetCreateRequestDto, BudgetQueryDto } from '../../../common/dto';

@Controller('budgets')
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Get('categories')
  async getCategoryBudgets(@Query() query: BudgetQueryDto, @Req() req: any) {
    const userId = req.user.id;
    return new NormalResponseDto(await this.budgetService.getCategoryBudgets(userId, query));
  }

  @Post('categories')
  async createCategoryBudget(@Body() data: CategoryBudgetCreateRequestDto, @Req() req: any) {
    const userId = req.user.id;
    return new NormalResponseDto(await this.budgetService.createCategoryBudget(data, userId));
  }

  @Get('sub-categories')
  async getSubCategoryBudgets(@Query() query: BudgetQueryDto, @Req() req: any) {
    const userId = req.user.id;
    return new NormalResponseDto(await this.budgetService.getSubCategoryBudgets(userId, query));
  }

  @Post('sub-categories')
  async createSubCategoryBudget(@Body() data: SubCategoryBudgetCreateRequestDto, @Req() req: any) {
    const userId = req.user.id;
    return new NormalResponseDto(await this.budgetService.createSubCategoryBudget(data, userId));
  }

  @Get('sub-categories/:id')
  async getSubCategoryBudgetBySubCategoryId(
    @Param('id') subCategoryId: string,
    @Query() query: BudgetQueryDto,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    return new NormalResponseDto(
      await this.budgetService.getSubCategoryBudgetBySubCategoryId(subCategoryId, userId, query.month),
    );
  }
}
