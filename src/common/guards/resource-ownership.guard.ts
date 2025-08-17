import { Injectable, CanActivate, ExecutionContext, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Decorator để đánh dấu resource type cần kiểm tra ownership
 * Sử dụng: @ResourceOwnership('transaction')
 */
export const ResourceOwnership = (resourceType: string) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('resourceType', resourceType, descriptor.value);
  };
};

/**
 * Guard để kiểm tra user chỉ có thể truy cập resource của mình
 */
@Injectable()
export class ResourceOwnershipGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();

    // Lấy resource type từ metadata
    const resourceType = this.reflector.get<string>('resourceType', handler);

    if (!resourceType) {
      return true; // Nếu không có resource type thì bỏ qua kiểm tra
    }

    const user = request.user;
    if (!user || !user.id) {
      throw new ForbiddenException('User not authenticated');
    }

    // Lấy resource ID từ params
    const resourceId = request.params.id;
    if (!resourceId) {
      throw new BadRequestException('Resource ID is required');
    }

    // Kiểm tra ownership dựa trên resource type
    const hasAccess = await this.checkOwnership(resourceType, resourceId, user.id);

    if (!hasAccess) {
      throw new ForbiddenException('You do not have permission to access this resource');
    }

    return true;
  }

  private async checkOwnership(resourceType: string, resourceId: string, userId: string): Promise<boolean> {
    try {
      switch (resourceType) {
        case 'transaction':
          const transaction = await this.prisma.transaction.findFirst({
            where: { id: resourceId, user_id: userId },
          });
          return !!transaction;

        case 'category':
          const category = await this.prisma.category.findFirst({
            where: { id: resourceId, user_id: userId },
          });
          return !!category;

        case 'subCategory':
          const subCategory = await this.prisma.subCategory.findFirst({
            where: { id: resourceId, user_id: userId },
          });
          return !!subCategory;

        case 'budgetCategory':
          const budgetCategory = await this.prisma.budgetCategory.findFirst({
            where: { id: resourceId, user_id: userId },
          });
          return !!budgetCategory;

        case 'subBudgetCategory':
          const subBudgetCategory = await this.prisma.subBudgetCategory.findFirst({
            where: { id: resourceId, user_id: userId },
          });
          return !!subBudgetCategory;

        default:
          return false;
      }
    } catch (error) {
      return false;
    }
  }
}
