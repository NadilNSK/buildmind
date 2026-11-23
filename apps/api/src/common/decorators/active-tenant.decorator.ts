import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { OrganizationRole } from '@buildmind/shared-types';
import { Organization, Membership } from '@prisma/client';

export const ActiveOrg = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Organization | null => {
    const request = ctx.switchToHttp().getRequest();
    return request.activeOrganization || null;
  },
);

export const ActiveMembership = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Membership | null => {
    const request = ctx.switchToHttp().getRequest();
    return request.membership || null;
  },
);

export const ActiveOrgRole = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): OrganizationRole | null => {
    const request = ctx.switchToHttp().getRequest();
    return request.orgRole || null;
  },
);
