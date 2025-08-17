import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator để lấy user hiện tại từ request
 * Sử dụng: @CurrentUser() user: any
 */
export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});

/**
 * Decorator để lấy user ID hiện tại
 * Sử dụng: @CurrentUserId() userId: string
 */
export const CurrentUserId = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user?.id;
});
