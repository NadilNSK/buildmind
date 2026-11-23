import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserSummary } from '@buildmind/shared-types';

export interface AuthenticatedUser extends UserSummary {
  sessionId?: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;
    return data ? user?.[data] : user;
  },
);
