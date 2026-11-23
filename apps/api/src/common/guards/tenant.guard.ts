import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { REQUIRE_TENANT_KEY } from '../decorators/require-tenant.decorator';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { ORG_ROLES_KEY } from '../decorators/require-org-role.decorator';
import { OrganizationRole } from '@buildmind/shared-types';

export const TENANT_COOKIE_NAME = 'buildmind_org_id';
export const TENANT_HEADER_NAME = 'x-organization-id';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as any).user;

    const requiresTenant = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_TENANT_KEY,
      [context.getHandler(), context.getClass()],
    );

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ORG_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const needsOrg =
      requiresTenant ||
      (requiredPermissions && requiredPermissions.length > 0) ||
      (requiredRoles && requiredRoles.length > 0);

    const orgId = this.resolveOrganizationId(request);

    if (user && orgId) {
      const membership = await this.prisma.membership.findUnique({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId: orgId,
          },
        },
        include: {
          organization: true,
        },
      });

      if (membership) {
        if (membership.status !== 'ACTIVE') {
          throw new ForbiddenException(
            'Your membership in this organization is suspended',
          );
        }
        if (membership.organization.status !== 'ACTIVE') {
          throw new ForbiddenException(
            'This organization is inactive or suspended',
          );
        }

        (request as any).activeOrganization = membership.organization;
        (request as any).membership = membership;
        (request as any).orgRole = membership.role as OrganizationRole;
      } else if (needsOrg) {
        throw new ForbiddenException(
          'Access denied: You are not an active member of this organization',
        );
      }
    } else if (needsOrg) {
      if (!orgId) {
        throw new BadRequestException(
          'Organization context required: please pass x-organization-id header or select an organization',
        );
      }
      if (!user) {
        throw new ForbiddenException('Authentication required');
      }
    }

    return true;
  }

  private resolveOrganizationId(request: Request): string | undefined {
    // 1. If route explicitly targets an organization via params, that is the target organization
    let paramOrgId: string | undefined;
    if (typeof request.params?.organizationId === 'string') {
      paramOrgId = request.params.organizationId;
    } else {
      const path = request.originalUrl || request.url || '';
      if (path.includes('/organizations/') && typeof request.params?.id === 'string') {
        paramOrgId = request.params.id;
      }
    }

    const headerOrgId =
      typeof request.headers[TENANT_HEADER_NAME] === 'string'
        ? (request.headers[TENANT_HEADER_NAME] as string).trim()
        : undefined;

    // Enforce consistency: if both param and header are present and conflict, reject mismatch
    if (paramOrgId && headerOrgId && paramOrgId !== headerOrgId) {
      throw new ForbiddenException(
        'Tenant context mismatch: header x-organization-id does not match the requested organization resource',
      );
    }

    if (paramOrgId) {
      return paramOrgId;
    }

    // 2. Check x-organization-id header
    if (headerOrgId) {
      return headerOrgId;
    }

    // 3. Check cookie
    const cookieOrgId = request.cookies?.[TENANT_COOKIE_NAME];
    if (typeof cookieOrgId === 'string' && cookieOrgId.trim()) {
      return cookieOrgId.trim();
    }

    // 4. Check query param
    if (typeof request.query?.organizationId === 'string') {
      return request.query.organizationId.trim();
    }

    return undefined;
  }
}
