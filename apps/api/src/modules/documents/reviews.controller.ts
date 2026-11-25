import {
  Controller,
  Get,
  Param,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { TransformInterceptor } from '../../common/interceptors/transform.interceptor';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ActiveOrg } from '../../common/decorators/active-tenant.decorator';
import { RequireTenant } from '../../common/decorators/require-tenant.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { Organization } from '@prisma/client';
import { ReviewStatus } from '@buildmind/shared-types';

@Controller('projects/:projectId/document-reviews')
@UseInterceptors(TransformInterceptor)
export class ReviewsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  @RequireTenant()
  @RequirePermissions('documents.versions.view')
  async listReviews(
    @ActiveOrg() org: Organization,
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: ReviewStatus,
  ) {
    return this.documentsService.listReviews(org.id, projectId, user.id, status);
  }
}
