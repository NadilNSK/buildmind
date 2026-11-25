import {
  Controller,
  Get,
  Post,
  Patch,
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
import { CreateDrawingDto, UpdateDrawingDto, DrawingQueryDto } from './dto';

@Controller('projects/:projectId/drawings')
@UseInterceptors(TransformInterceptor)
export class DrawingsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  @RequireTenant()
  @RequirePermissions('drawings.view')
  async listDrawings(
    @ActiveOrg() org: Organization,
    @Param('projectId') projectId: string,
    @Query() query: DrawingQueryDto,
  ) {
    return this.documentsService.listDrawings(org.id, projectId, query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequireTenant()
  @RequirePermissions('drawings.create')
  async createDrawing(
    @ActiveOrg() org: Organization,
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateDrawingDto,
  ) {
    return this.documentsService.createDrawing(org.id, projectId, user.id, body);
  }

  @Get(':drawingId')
  @RequireTenant()
  @RequirePermissions('drawings.view')
  async getDrawing(
    @ActiveOrg() org: Organization,
    @Param('projectId') projectId: string,
    @Param('drawingId') drawingId: string,
  ) {
    return this.documentsService.getDrawing(org.id, projectId, drawingId);
  }

  @Patch(':drawingId')
  @RequireTenant()
  @RequirePermissions('drawings.update')
  async updateDrawing(
    @ActiveOrg() org: Organization,
    @Param('projectId') projectId: string,
    @Param('drawingId') drawingId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateDrawingDto,
  ) {
    return this.documentsService.updateDrawing(org.id, projectId, drawingId, body, user.id);
  }
}
