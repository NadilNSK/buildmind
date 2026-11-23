import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { TransformInterceptor } from '../../common/interceptors/transform.interceptor';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ActiveOrg } from '../../common/decorators/active-tenant.decorator';
import { RequireTenant } from '../../common/decorators/require-tenant.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { Organization } from '@prisma/client';
import { ProjectStatus } from '@buildmind/shared-types';
import {
  CreateProjectDto,
  UpdateProjectDto,
  AddProjectMemberDto,
} from './dto/project.dto';

@Controller('projects')
@UseInterceptors(TransformInterceptor)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @RequireTenant()
  @RequirePermissions('projects.view')
  async listProjects(
    @ActiveOrg() org: Organization,
    @Query('search') search?: string,
    @Query('status') status?: ProjectStatus,
  ) {
    return this.projectsService.findAll(org.id, { search, status });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequireTenant()
  @RequirePermissions('projects.create')
  async createProject(
    @ActiveOrg() org: Organization,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateProjectDto,
  ) {
    return this.projectsService.create(org.id, user.id, body);
  }

  @Get(':id')
  @RequireTenant()
  @RequirePermissions('projects.view')
  async getProject(
    @ActiveOrg() org: Organization,
    @Param('id') id: string,
  ) {
    return this.projectsService.findOne(org.id, id);
  }

  @Patch(':id')
  @RequireTenant()
  @RequirePermissions('projects.update')
  async updateProject(
    @ActiveOrg() org: Organization,
    @Param('id') id: string,
    @Body() body: UpdateProjectDto,
  ) {
    return this.projectsService.update(org.id, id, body);
  }

  @Delete(':id')
  @RequireTenant()
  @RequirePermissions('projects.delete')
  async deleteProject(
    @ActiveOrg() org: Organization,
    @Param('id') id: string,
  ) {
    return this.projectsService.delete(org.id, id);
  }

  // ==========================================
  // Project Member Access Grants
  // ==========================================

  @Get(':id/members')
  @RequireTenant()
  @RequirePermissions('projects.view')
  async listProjectMembers(
    @ActiveOrg() org: Organization,
    @Param('id') id: string,
  ) {
    return this.projectsService.listMembers(org.id, id);
  }

  @Post(':id/members')
  @HttpCode(HttpStatus.CREATED)
  @RequireTenant()
  @RequirePermissions('projects.manage_access')
  async addProjectMember(
    @ActiveOrg() org: Organization,
    @Param('id') id: string,
    @Body() body: AddProjectMemberDto,
  ) {
    return this.projectsService.addMember(org.id, id, body);
  }

  @Delete(':id/members/:memberUserId')
  @RequireTenant()
  @RequirePermissions('projects.manage_access')
  async removeProjectMember(
    @ActiveOrg() org: Organization,
    @Param('id') id: string,
    @Param('memberUserId') memberUserId: string,
  ) {
    return this.projectsService.removeMember(org.id, id, memberUserId);
  }
}
