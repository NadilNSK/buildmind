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
import { OrganizationsService } from './organizations.service';
import { TransformInterceptor } from '../../common/interceptors/transform.interceptor';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { RequireTenant } from '../../common/decorators/require-tenant.decorator';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  InviteMemberDto,
  UpdateMemberRoleDto,
  UpdateMemberStatusDto,
  TransferOwnershipDto,
  AcceptInvitationDto,
} from './dto/organization.dto';

@Controller('organizations')
@UseInterceptors(TransformInterceptor)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  // ==========================================
  // Invitations Acceptance & Public Verification
  // (Declared before :id routes to avoid route shadowing)
  // ==========================================

  @Public()
  @Get('invitations/verify')
  async verifyInvitation(@Query('token') token: string) {
    return this.organizationsService.verifyInvitation(token);
  }

  @Post('invitations/accept')
  @HttpCode(HttpStatus.OK)
  async acceptInvitation(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: AcceptInvitationDto,
  ) {
    return this.organizationsService.acceptInvitation(body.token, user);
  }

  // ==========================================
  // Organization Lifecycle
  // ==========================================

  @Get()
  async listUserOrganizations(@CurrentUser() user: AuthenticatedUser) {
    return this.organizationsService.findAllForUser(user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createOrganization(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateOrganizationDto,
  ) {
    return this.organizationsService.create(user.id, body);
  }

  @Get(':id')
  @RequireTenant()
  @RequirePermissions('organization.view')
  async getOrganization(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.organizationsService.findOne(id, user.id);
  }

  @Patch(':id')
  @RequireTenant()
  @RequirePermissions('organization.update')
  async updateOrganization(
    @Param('id') id: string,
    @Body() body: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(id, body);
  }

  @Delete(':id')
  @RequireTenant()
  @RequirePermissions('organization.delete')
  async deleteOrganization(@Param('id') id: string) {
    return this.organizationsService.delete(id);
  }

  @Post(':id/transfer-ownership')
  @HttpCode(HttpStatus.OK)
  @RequireTenant()
  @RequirePermissions('organization.transfer_ownership')
  async transferOwnership(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: TransferOwnershipDto,
  ) {
    return this.organizationsService.transferOwnership(id, user.id, body);
  }

  // ==========================================
  // Member Management
  // ==========================================

  @Get(':id/members')
  @RequireTenant()
  @RequirePermissions('organization.view')
  async listMembers(@Param('id') id: string) {
    return this.organizationsService.listMembers(id);
  }

  @Patch(':id/members/:memberId/role')
  @RequireTenant()
  @RequirePermissions('organization.manage_members')
  async updateMemberRole(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() body: UpdateMemberRoleDto,
  ) {
    return this.organizationsService.updateMemberRole(id, memberId, body);
  }

  @Patch(':id/members/:memberId/status')
  @RequireTenant()
  @RequirePermissions('organization.manage_members')
  async updateMemberStatus(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() body: UpdateMemberStatusDto,
  ) {
    return this.organizationsService.updateMemberStatus(id, memberId, body);
  }

  @Delete(':id/members/:memberId')
  @RequireTenant()
  @RequirePermissions('organization.manage_members')
  async removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    return this.organizationsService.removeMember(id, memberId);
  }

  // ==========================================
  // Organization Invitations
  // ==========================================

  @Get(':id/invitations')
  @RequireTenant()
  @RequirePermissions('organization.manage_members')
  async listInvitations(@Param('id') id: string) {
    return this.organizationsService.listInvitations(id);
  }

  @Post(':id/invitations')
  @HttpCode(HttpStatus.CREATED)
  @RequireTenant()
  @RequirePermissions('organization.manage_members')
  async createInvitation(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: InviteMemberDto,
  ) {
    return this.organizationsService.createInvitation(id, user, body);
  }

  @Delete(':id/invitations/:invitationId')
  @RequireTenant()
  @RequirePermissions('organization.manage_members')
  async revokeInvitation(
    @Param('id') id: string,
    @Param('invitationId') invitationId: string,
  ) {
    return this.organizationsService.revokeInvitation(id, invitationId);
  }

  @Post(':id/invitations/:invitationId/resend')
  @HttpCode(HttpStatus.OK)
  @RequireTenant()
  @RequirePermissions('organization.manage_members')
  async resendInvitation(
    @Param('id') id: string,
    @Param('invitationId') invitationId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.organizationsService.resendInvitation(id, invitationId, user);
  }
}
