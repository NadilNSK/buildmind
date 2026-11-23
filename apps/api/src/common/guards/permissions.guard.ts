import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { ORG_ROLES_KEY } from '../decorators/require-org-role.decorator';
import {
  OrganizationRole,
  PermissionKey,
  hasPermission,
} from '@buildmind/shared-types';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<
      PermissionKey[]
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    const requiredRoles = this.reflector.getAllAndOverride<OrganizationRole[]>(
      ORG_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (
      (!requiredPermissions || requiredPermissions.length === 0) &&
      (!requiredRoles || requiredRoles.length === 0)
    ) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const membership = (request as any).membership;
    const orgRole = (request as any).orgRole as OrganizationRole | undefined;

    if (!membership || !orgRole) {
      throw new ForbiddenException(
        'Access denied: Active organization membership required for this operation',
      );
    }

    // Check Organization Roles if specified
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.includes(orgRole);
      if (!hasRequiredRole) {
        throw new ForbiddenException(
          `Access denied: Required organization role [${requiredRoles.join(
            ', ',
          )}], current role is ${orgRole}`,
        );
      }
    }

    // Check Permissions if specified
    if (requiredPermissions && requiredPermissions.length > 0) {
      for (const permission of requiredPermissions) {
        if (!hasPermission(orgRole, permission)) {
          throw new ForbiddenException(
            `Access denied: Role ${orgRole} lacks required permission "${permission}"`,
          );
        }
      }
    }

    return true;
  }
}
