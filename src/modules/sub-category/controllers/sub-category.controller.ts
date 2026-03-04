import { Controller, Get, Post, Put, Delete, Param, Body, Req, Query } from '@nestjs/common';
import { NormalResponseDto } from '../../../common/dto';
import { SubCategoryService } from '../services';
import { SubCategoryCreateRequestDto, SubCategoryUpdateRequestDto } from '../../../common/dto';

@Controller('sub-categories')
export class SubCategoryController {
  constructor(private readonly subCategoryService: SubCategoryService) {}

  @Get()
  async getSubCategories(@Req() req: any, @Query('categoryId') categoryId?: string) {
    const userId = req.user.id;
    if (categoryId) {
      return new NormalResponseDto(await this.subCategoryService.getSubCategoriesByCategory(categoryId, userId));
    }
    return new NormalResponseDto(await this.subCategoryService.getSubCategories(userId));
  }

  @Post()
  async createSubCategory(@Body() data: SubCategoryCreateRequestDto, @Req() req: any) {
    const userId = req.user.id;
    return new NormalResponseDto(await this.subCategoryService.createSubCategory(data, userId));
  }

  @Put(':id')
  async updateSubCategory(@Param('id') id: string, @Body() data: SubCategoryUpdateRequestDto, @Req() req: any) {
    const userId = req.user.id;
    return new NormalResponseDto(await this.subCategoryService.updateSubCategory(id, data, userId));
  }

  @Delete(':id')
  async deleteSubCategory(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id;
    await this.subCategoryService.deleteSubCategory(id, userId);
    return new NormalResponseDto({ success: true });
  }
}
