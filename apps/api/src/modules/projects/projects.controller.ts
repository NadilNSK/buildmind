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
  UpdateProjectSettingsDto,
  AddProjectMemberDto,
  CreateSpatialNodeDto,
  UpdateSpatialNodeDto,
  CreateWorkPackageDto,
  UpdateWorkPackageDto,
} from './dto/project.dto';

@Controller('projects')
@UseInterceptors(TransformInterceptor)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // ==========================================
  // Project Core
  // ==========================================

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
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateProjectDto,
  ) {
    return this.projectsService.update(org.id, id, body, user.id);
  }

  @Delete(':id')
  @RequireTenant()
  @RequirePermissions('projects.delete')
  async deleteProject(
    @ActiveOrg() org: Organization,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectsService.delete(org.id, id, user.id);
  }

  // ==========================================
  // Project Overview & Settings
  // ==========================================

  @Get(':id/overview')
  @RequireTenant()
  @RequirePermissions('projects.view')
  async getProjectOverview(
    @ActiveOrg() org: Organization,
    @Param('id') id: string,
  ) {
    return this.projectsService.getOverview(org.id, id);
  }

  @Get(':id/settings')
  @RequireTenant()
  @RequirePermissions('projects.settings.view')
  async getProjectSettings(
    @ActiveOrg() org: Organization,
    @Param('id') id: string,
  ) {
    return this.projectsService.getSettings(org.id, id);
  }

  @Patch(':id/settings')
  @RequireTenant()
  @RequirePermissions('projects.settings.edit')
  async updateProjectSettings(
    @ActiveOrg() org: Organization,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateProjectSettingsDto,
  ) {
    return this.projectsService.updateSettings(org.id, id, user.id, body);
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
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: AddProjectMemberDto,
  ) {
    return this.projectsService.addMember(org.id, id, body, user.id);
  }

  @Delete(':id/members/:memberUserId')
  @RequireTenant()
  @RequirePermissions('projects.manage_access')
  async removeProjectMember(
    @ActiveOrg() org: Organization,
    @Param('id') id: string,
    @Param('memberUserId') memberUserId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectsService.removeMember(org.id, id, memberUserId, user.id);
  }

  // ==========================================
  // Spatial Breakdown Structure (SBS)
  // ==========================================

  @Get(':id/spatial-nodes')
  @RequireTenant()
  @RequirePermissions('projects.spatial.view')
  async listSpatialNodes(
    @ActiveOrg() org: Organization,
    @Param('id') id: string,
    @Query('status') status?: string,
  ) {
    return this.projectsService.listSpatialNodes(org.id, id, { status });
  }

  @Post(':id/spatial-nodes')
  @HttpCode(HttpStatus.CREATED)
  @RequireTenant()
  @RequirePermissions('projects.spatial.manage')
  async createSpatialNode(
    @ActiveOrg() org: Organization,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateSpatialNodeDto,
  ) {
    return this.projectsService.createSpatialNode(org.id, id, user.id, body);
  }

  @Get(':id/spatial-nodes/:nodeId')
  @RequireTenant()
  @RequirePermissions('projects.spatial.view')
  async getSpatialNode(
    @ActiveOrg() org: Organization,
    @Param('id') id: string,
    @Param('nodeId') nodeId: string,
  ) {
    return this.projectsService.getSpatialNode(org.id, id, nodeId);
  }

  @Patch(':id/spatial-nodes/:nodeId')
  @RequireTenant()
  @RequirePermissions('projects.spatial.manage')
  async updateSpatialNode(
    @ActiveOrg() org: Organization,
    @Param('id') id: string,
    @Param('nodeId') nodeId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateSpatialNodeDto,
  ) {
    return this.projectsService.updateSpatialNode(org.id, id, nodeId, user.id, body);
  }

  @Delete(':id/spatial-nodes/:nodeId')
  @RequireTenant()
  @RequirePermissions('projects.spatial.manage')
  async deleteSpatialNode(
    @ActiveOrg() org: Organization,
    @Param('id') id: string,
    @Param('nodeId') nodeId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectsService.deleteSpatialNode(org.id, id, nodeId, user.id);
  }

  // ==========================================
  // Work Breakdown Structure (WBS)
  // ==========================================

  @Get(':id/work-packages')
  @RequireTenant()
  @RequirePermissions('projects.wbs.view')
  async listWorkPackages(
    @ActiveOrg() org: Organization,
    @Param('id') id: string,
    @Query('status') status?: string,
  ) {
    return this.projectsService.listWorkPackages(org.id, id, { status });
  }

  @Post(':id/work-packages')
  @HttpCode(HttpStatus.CREATED)
  @RequireTenant()
  @RequirePermissions('projects.wbs.manage')
  async createWorkPackage(
    @ActiveOrg() org: Organization,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateWorkPackageDto,
  ) {
    return this.projectsService.createWorkPackage(org.id, id, user.id, body);
  }

  @Get(':id/work-packages/:packageId')
  @RequireTenant()
  @RequirePermissions('projects.wbs.view')
  async getWorkPackage(
    @ActiveOrg() org: Organization,
    @Param('id') id: string,
    @Param('packageId') packageId: string,
  ) {
    return this.projectsService.getWorkPackage(org.id, id, packageId);
  }

  @Patch(':id/work-packages/:packageId')
  @RequireTenant()
  @RequirePermissions('projects.wbs.manage')
  async updateWorkPackage(
    @ActiveOrg() org: Organization,
    @Param('id') id: string,
    @Param('packageId') packageId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateWorkPackageDto,
  ) {
    return this.projectsService.updateWorkPackage(org.id, id, packageId, user.id, body);
  }

  @Delete(':id/work-packages/:packageId')
  @RequireTenant()
  @RequirePermissions('projects.wbs.manage')
  async deleteWorkPackage(
    @ActiveOrg() org: Organization,
    @Param('id') id: string,
    @Param('packageId') packageId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectsService.deleteWorkPackage(org.id, id, packageId, user.id);
  }
}
