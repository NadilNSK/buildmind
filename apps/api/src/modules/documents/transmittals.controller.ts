import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { TransformInterceptor } from '../../common/interceptors/transform.interceptor';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ActiveOrg } from '../../common/decorators/active-tenant.decorator';
import { RequireTenant } from '../../common/decorators/require-tenant.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { Organization } from '@prisma/client';
import { CreateTransmittalDto, TransmittalQueryDto } from './dto';

@Controller('projects/:projectId/transmittals')
@UseInterceptors(TransformInterceptor)
export class TransmittalsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequireTenant()
  @RequirePermissions('transmittals.create')
  async createTransmittal(
    @ActiveOrg() org: Organization,
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateTransmittalDto,
  ) {
    return this.documentsService.createTransmittal(org.id, projectId, user.id, body);
  }

  @Get()
  @RequireTenant()
  @RequirePermissions('transmittals.view')
  async listTransmittals(
    @ActiveOrg() org: Organization,
    @Param('projectId') projectId: string,
    @Query() query: TransmittalQueryDto,
  ) {
    return this.documentsService.listTransmittals(org.id, projectId, query);
  }

  @Get(':transmittalId')
  @RequireTenant()
  @RequirePermissions('transmittals.view')
  async getTransmittal(
    @ActiveOrg() org: Organization,
    @Param('projectId') projectId: string,
    @Param('transmittalId') transmittalId: string,
  ) {
    return this.documentsService.getTransmittal(org.id, projectId, transmittalId);
  }

  @Post(':transmittalId/issue')
  @HttpCode(HttpStatus.OK)
  @RequireTenant()
  @RequirePermissions('transmittals.issue')
  async issueTransmittal(
    @ActiveOrg() org: Organization,
    @Param('projectId') projectId: string,
    @Param('transmittalId') transmittalId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentsService.issueTransmittal(org.id, projectId, transmittalId, user.id);
  }

  @Post(':transmittalId/cancel')
  @HttpCode(HttpStatus.OK)
  @RequireTenant()
  @RequirePermissions('transmittals.cancel')
  async cancelTransmittal(
    @ActiveOrg() org: Organization,
    @Param('projectId') projectId: string,
    @Param('transmittalId') transmittalId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentsService.cancelTransmittal(org.id, projectId, transmittalId, user.id);
  }
}
