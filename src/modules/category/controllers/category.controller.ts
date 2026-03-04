import { Controller, Get, Post, Put, Delete, Param, Body, Req } from '@nestjs/common';
import { NormalResponseDto } from '../../../common/dto';
import { CategoryService } from '../services';
import { CategoryCreateRequestDto, CategoryUpdateRequestDto } from '../../../common/dto';
import { SubCategoryService } from '../../sub-category/services';
import { Public } from '../../auth/decorators/auth.decorator';

@Controller('categories')
export class CategoryController {
  constructor(
    private readonly categoryService: CategoryService,
    private readonly subCategoryService: SubCategoryService,
  ) {}

  @Get()
  async getCategories(@Req() req: any) {
    const userId = req.user.id;
    return new NormalResponseDto(await this.categoryService.getCategories(userId));
  }

  @Post()
  async createCategory(@Body() data: CategoryCreateRequestDto, @Req() req: any) {
    const userId = req.user.id;
    return new NormalResponseDto(await this.categoryService.createCategory(data, userId));
  }

  @Put(':id')
  async updateCategory(@Param('id') id: string, @Body() data: CategoryUpdateRequestDto, @Req() req: any) {
    const userId = req.user.id;
    return new NormalResponseDto(await this.categoryService.updateCategory(id, data, userId));
  }

  @Delete(':id')
  async deleteCategory(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id;
    await this.categoryService.deleteCategory(id, userId);
    return new NormalResponseDto({ success: true });
  }

  @Get(':id/sub-categories')
  async getSubCategoriesByCategory(@Param('id') categoryId: string, @Req() req: any) {
    const userId = req.user.id;
    return new NormalResponseDto(await this.subCategoryService.getSubCategoriesByCategory(categoryId, userId));
  }

  @Public()
  @Get('default')
  async getDefaultCategories() {
    return new NormalResponseDto(await this.categoryService.getDefaultCategories());
  }
}
