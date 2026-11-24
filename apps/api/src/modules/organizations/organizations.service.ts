import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { AuditService } from '../auth/services/audit.service';
import {
  OrganizationRole,
  MembershipStatus,
  InvitationStatus,
  OrganizationStatus,
  CurrencyCode,
  ROLE_PERMISSIONS,
} from '@buildmind/shared-types';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  InviteMemberDto,
  UpdateMemberRoleDto,
  UpdateMemberStatusDto,
  TransferOwnershipDto,
} from './dto/organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly auditService: AuditService,
  ) {}

  // ==========================================
  // Organization Lifecycle
  // ==========================================

  async create(userId: string, input: CreateOrganizationDto) {
    const existing = await this.prisma.organization.findUnique({
      where: { slug: input.slug },
    });

    if (existing) {
      throw new ConflictException(`Organization with slug "${input.slug}" already exists`);
    }

    const organization = await this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: input.name,
          slug: input.slug,
          country: input.country || 'LK',
          currency: input.defaultCurrency || CurrencyCode.LKR,
          status: OrganizationStatus.ACTIVE,
        },
      });

      await tx.membership.create({
        data: {
          userId,
          organizationId: org.id,
          role: OrganizationRole.ORGANIZATION_OWNER,
          status: MembershipStatus.ACTIVE,
        },
      });

      return org;
    });

    await this.auditService.logEvent(userId, 'ORGANIZATION_CREATED', undefined, {
      organizationId: organization.id,
      name: organization.name,
      slug: organization.slug,
    });

    return this.mapOrganization(organization, OrganizationRole.ORGANIZATION_OWNER, 1, 0);
  }

  async findAllForUser(userId: string) {
    const memberships = await this.prisma.membership.findMany({
      where: {
        userId,
        status: MembershipStatus.ACTIVE,
        organization: { status: OrganizationStatus.ACTIVE },
      },
      include: {
        organization: {
          include: {
            _count: {
              select: {
                memberships: true,
                projects: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return memberships.map((m) =>
      this.mapOrganization(
        m.organization,
        m.role as OrganizationRole,
        m.organization._count.memberships,
        m.organization._count.projects,
      ),
    );
  }

  async findOne(organizationId: string, userId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
      include: {
        organization: {
          include: {
            _count: {
              select: {
                memberships: true,
                projects: true,
              },
            },
          },
        },
      },
    });

    if (!membership || membership.status !== MembershipStatus.ACTIVE) {
      throw new ForbiddenException('Access denied: You are not an active member of this organization');
    }

    const org = membership.organization;
    const role = membership.role as OrganizationRole;
    const permissions = ROLE_PERMISSIONS[role] || [];

    return {
      ...this.mapOrganization(org, role, org._count.memberships, org._count.projects),
      permissions,
    };
  }

  async update(organizationId: string, input: UpdateOrganizationDto) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    if (input.slug && input.slug !== org.slug) {
      const existing = await this.prisma.organization.findUnique({
        where: { slug: input.slug },
      });
      if (existing) {
        throw new ConflictException(`Organization with slug "${input.slug}" already exists`);
      }
    }

    const updated = await this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        name: input.name ?? org.name,
        slug: input.slug ?? org.slug,
        country: input.country ?? org.country,
        currency: input.defaultCurrency ?? org.currency,
        status: input.status ?? org.status,
        settings: input.settings ? JSON.parse(JSON.stringify(input.settings)) : org.settings,
      },
      include: {
        _count: {
          select: { memberships: true, projects: true },
        },
      },
    });

    await this.auditService.logEvent(null, 'ORGANIZATION_UPDATED', undefined, {
      organizationId,
      name: updated.name,
      slug: updated.slug,
      status: updated.status,
    });

    return this.mapOrganization(updated, undefined, updated._count.memberships, updated._count.projects);
  }

  async delete(organizationId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    await this.prisma.organization.delete({
      where: { id: organizationId },
    });

    await this.auditService.logEvent(null, 'ORGANIZATION_DELETED', undefined, {
      organizationId,
      name: org.name,
      slug: org.slug,
    });

    return { success: true, message: 'Organization deleted successfully' };
  }

  async transferOwnership(organizationId: string, currentOwnerUserId: string, input: TransferOwnershipDto) {
    const targetUserId = input.newOwnerUserId;

    if (targetUserId === currentOwnerUserId) {
      throw new BadRequestException('You are already the owner of this organization');
    }

    const targetMembership = await this.prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: targetUserId,
          organizationId,
        },
      },
    });

    if (!targetMembership || targetMembership.status !== MembershipStatus.ACTIVE) {
      throw new BadRequestException('Target user must be an active member of this organization');
    }

    await this.prisma.$transaction(async (tx) => {
      // Demote current owner to ORGANIZATION_ADMIN
      await tx.membership.update({
        where: {
          userId_organizationId: {
            userId: currentOwnerUserId,
            organizationId,
          },
        },
        data: { role: OrganizationRole.ORGANIZATION_ADMIN },
      });

      // Promote target member to ORGANIZATION_OWNER
      await tx.membership.update({
        where: {
          userId_organizationId: {
            userId: targetUserId,
            organizationId,
          },
        },
        data: { role: OrganizationRole.ORGANIZATION_OWNER },
      });
    });

    await this.auditService.logEvent(currentOwnerUserId, 'OWNERSHIP_TRANSFERRED', undefined, {
      organizationId,
      previousOwnerUserId: currentOwnerUserId,
      newOwnerUserId: targetUserId,
    });

    return {
      success: true,
      message: 'Organization ownership transferred successfully',
      newOwnerUserId: targetUserId,
    };
  }

  // ==========================================
  // Member Management & Invariant Enforcement
  // ==========================================

  async listMembers(organizationId: string) {
    const memberships = await this.prisma.membership.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return memberships.map((m) => ({
      id: m.id,
      userId: m.userId,
      organizationId: m.organizationId,
      role: m.role as OrganizationRole,
      status: m.status as MembershipStatus,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
      user: m.user,
    }));
  }

  async updateMemberRole(organizationId: string, membershipId: string, input: UpdateMemberRoleDto) {
    const member = await this.prisma.membership.findUnique({
      where: { id: membershipId },
    });

    if (!member || member.organizationId !== organizationId) {
      throw new NotFoundException('Member not found in this organization');
    }

    // Invariant: If demoting an ORGANIZATION_OWNER, ensure at least one other active owner remains
    if (member.role === OrganizationRole.ORGANIZATION_OWNER && input.role !== OrganizationRole.ORGANIZATION_OWNER) {
      const activeOwnerCount = await this.prisma.membership.count({
        where: {
          organizationId,
          role: OrganizationRole.ORGANIZATION_OWNER,
          status: MembershipStatus.ACTIVE,
        },
      });

      if (activeOwnerCount <= 1) {
        throw new BadRequestException(
          'Invariant violation: Cannot change role of the last active owner. Transfer ownership or assign another owner first.',
        );
      }
    }

    const updated = await this.prisma.membership.update({
      where: { id: membershipId },
      data: { role: input.role },
      include: {
        user: { select: { id: true, email: true, fullName: true } },
      },
    });

    await this.auditService.logEvent(null, 'MEMBER_ROLE_CHANGED', undefined, {
      organizationId,
      membershipId,
      targetUserId: member.userId,
      previousRole: member.role,
      newRole: input.role,
    });

    return {
      id: updated.id,
      userId: updated.userId,
      organizationId: updated.organizationId,
      role: updated.role as OrganizationRole,
      status: updated.status as MembershipStatus,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      user: updated.user,
    };
  }

  async updateMemberStatus(organizationId: string, membershipId: string, input: UpdateMemberStatusDto) {
    const member = await this.prisma.membership.findUnique({
      where: { id: membershipId },
    });

    if (!member || member.organizationId !== organizationId) {
      throw new NotFoundException('Member not found in this organization');
    }

    // Invariant: If suspending an ORGANIZATION_OWNER, ensure at least one other active owner remains
    if (member.role === OrganizationRole.ORGANIZATION_OWNER && input.status === MembershipStatus.SUSPENDED) {
      const activeOwnerCount = await this.prisma.membership.count({
        where: {
          organizationId,
          role: OrganizationRole.ORGANIZATION_OWNER,
          status: MembershipStatus.ACTIVE,
        },
      });

      if (activeOwnerCount <= 1) {
        throw new BadRequestException(
          'Invariant violation: Cannot suspend the last active owner of the organization.',
        );
      }
    }

    const updated = await this.prisma.membership.update({
      where: { id: membershipId },
      data: { status: input.status },
      include: {
        user: { select: { id: true, email: true, fullName: true } },
      },
    });

    await this.auditService.logEvent(null, 'MEMBER_STATUS_CHANGED', undefined, {
      organizationId,
      membershipId,
      targetUserId: member.userId,
      previousStatus: member.status,
      newStatus: input.status,
    });

    return {
      id: updated.id,
      userId: updated.userId,
      organizationId: updated.organizationId,
      role: updated.role as OrganizationRole,
      status: updated.status as MembershipStatus,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      user: updated.user,
    };
  }

  async removeMember(organizationId: string, membershipId: string) {
    const member = await this.prisma.membership.findUnique({
      where: { id: membershipId },
    });

    if (!member || member.organizationId !== organizationId) {
      throw new NotFoundException('Member not found in this organization');
    }

    // Invariant: Cannot delete the last active owner
    if (member.role === OrganizationRole.ORGANIZATION_OWNER) {
      const activeOwnerCount = await this.prisma.membership.count({
        where: {
          organizationId,
          role: OrganizationRole.ORGANIZATION_OWNER,
          status: MembershipStatus.ACTIVE,
        },
      });

      if (activeOwnerCount <= 1) {
        throw new BadRequestException(
          'Invariant violation: Cannot remove the last active owner of the organization.',
        );
      }
    }

    await this.prisma.$transaction(async (tx) => {
      // Remove project memberships for this user in projects belonging to this org
      const orgProjects = await tx.project.findMany({
        where: { organizationId },
        select: { id: true },
      });
      const projectIds = orgProjects.map((p) => p.id);

      if (projectIds.length > 0) {
        await tx.projectMember.deleteMany({
          where: {
            userId: member.userId,
            projectId: { in: projectIds },
          },
        });
      }

      await tx.membership.delete({
        where: { id: membershipId },
      });
    });

    await this.auditService.logEvent(null, 'MEMBER_REMOVED', undefined, {
      organizationId,
      membershipId,
      targetUserId: member.userId,
    });

    return { success: true, message: 'Member removed from organization successfully' };
  }

  // ==========================================
  // Invitations Management
  // ==========================================

  async createInvitation(
    organizationId: string,
    inviter: { id: string; fullName: string },
    input: InviteMemberDto,
  ) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    const normalizedEmail = input.email.toLowerCase().trim();

    // Check if target is already an active member
    const existingMember = await this.prisma.membership.findFirst({
      where: {
        organizationId,
        user: { email: normalizedEmail },
        status: MembershipStatus.ACTIVE,
      },
    });

    if (existingMember) {
      throw new BadRequestException('This user is already an active member of this organization');
    }

    // Revoke any existing pending invitations for this email in this org
    await this.prisma.organizationInvitation.updateMany({
      where: {
        organizationId,
        email: normalizedEmail,
        status: InvitationStatus.PENDING,
      },
      data: { status: InvitationStatus.REVOKED },
    });

    // Generate secure token (never stored plaintext in DB)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await this.prisma.organizationInvitation.create({
      data: {
        organizationId,
        email: normalizedEmail,
        role: input.role,
        tokenHash,
        invitedById: inviter.id,
        status: InvitationStatus.PENDING,
        expiresAt,
      },
      include: {
        invitedBy: {
          select: { id: true, email: true, fullName: true },
        },
      },
    });

    // Send invitation email
    await this.emailService.sendOrganizationInvitation(normalizedEmail, rawToken, {
      fullName: inviter.fullName,
      organizationName: org.name,
      role: input.role,
    });

    await this.auditService.logEvent(inviter.id, 'INVITATION_CREATED', undefined, {
      organizationId,
      invitationId: invitation.id,
      invitedEmail: normalizedEmail,
      role: input.role,
    });

    return {
      id: invitation.id,
      organizationId: invitation.organizationId,
      email: invitation.email,
      role: invitation.role as OrganizationRole,
      status: invitation.status as InvitationStatus,
      invitedById: invitation.invitedById,
      invitedBy: invitation.invitedBy,
      expiresAt: invitation.expiresAt.toISOString(),
      createdAt: invitation.createdAt.toISOString(),
      // Provide rawToken for automated tests or local dev
      token: rawToken,
    };
  }

  async listInvitations(organizationId: string) {
    const invitations = await this.prisma.organizationInvitation.findMany({
      where: { organizationId },
      include: {
        invitedBy: {
          select: { id: true, email: true, fullName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return invitations.map((inv) => ({
      id: inv.id,
      organizationId: inv.organizationId,
      email: inv.email,
      role: inv.role as OrganizationRole,
      status: inv.status as InvitationStatus,
      invitedById: inv.invitedById,
      invitedBy: inv.invitedBy,
      expiresAt: inv.expiresAt.toISOString(),
      acceptedAt: inv.acceptedAt ? inv.acceptedAt.toISOString() : null,
      createdAt: inv.createdAt.toISOString(),
    }));
  }

  async revokeInvitation(organizationId: string, invitationId: string) {
    const invitation = await this.prisma.organizationInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation || invitation.organizationId !== organizationId) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(`Cannot revoke invitation with status "${invitation.status}"`);
    }

    await this.prisma.organizationInvitation.update({
      where: { id: invitationId },
      data: { status: InvitationStatus.REVOKED },
    });

    await this.auditService.logEvent(null, 'INVITATION_REVOKED', undefined, {
      organizationId,
      invitationId,
    });

    return { success: true, message: 'Invitation revoked successfully' };
  }

  async resendInvitation(
    organizationId: string,
    invitationId: string,
    inviter: { fullName: string },
  ) {
    const invitation = await this.prisma.organizationInvitation.findUnique({
      where: { id: invitationId },
      include: { organization: true },
    });

    if (!invitation || invitation.organizationId !== organizationId) {
      throw new NotFoundException('Invitation not found');
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const updated = await this.prisma.organizationInvitation.update({
      where: { id: invitationId },
      data: {
        tokenHash,
        status: InvitationStatus.PENDING,
        expiresAt,
      },
      include: {
        invitedBy: { select: { id: true, email: true, fullName: true } },
      },
    });

    await this.emailService.sendOrganizationInvitation(invitation.email, rawToken, {
      fullName: inviter.fullName,
      organizationName: invitation.organization.name,
      role: invitation.role,
    });

    await this.auditService.logEvent(null, 'INVITATION_RESENT', undefined, {
      organizationId,
      invitationId,
    });

    return {
      id: updated.id,
      organizationId: updated.organizationId,
      email: updated.email,
      role: updated.role as OrganizationRole,
      status: updated.status as InvitationStatus,
      invitedById: updated.invitedById,
      invitedBy: updated.invitedBy,
      expiresAt: updated.expiresAt.toISOString(),
      createdAt: updated.createdAt.toISOString(),
      token: rawToken,
    };
  }

  async verifyInvitation(rawToken: string) {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const invitation = await this.prisma.organizationInvitation.findUnique({
      where: { tokenHash },
      include: {
        organization: true,
        invitedBy: { select: { fullName: true, email: true } },
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found or invalid token');
    }

    const isExpired = new Date() > invitation.expiresAt;
    const isPending = invitation.status === InvitationStatus.PENDING;

    return {
      valid: isPending && !isExpired,
      organizationId: invitation.organizationId,
      organizationName: invitation.organization.name,
      email: invitation.email,
      role: invitation.role as OrganizationRole,
      status: isExpired && isPending ? InvitationStatus.EXPIRED : (invitation.status as InvitationStatus),
      expiresAt: invitation.expiresAt.toISOString(),
      invitedBy: invitation.invitedBy,
    };
  }

  async acceptInvitation(rawToken: string, user: { id: string; email: string }) {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const invitation = await this.prisma.organizationInvitation.findUnique({
      where: { tokenHash },
      include: { organization: true },
    });

    if (!invitation) {
      throw new BadRequestException('Invalid or expired invitation token');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(`Invitation is no longer valid (status: ${invitation.status})`);
    }

    if (new Date() > invitation.expiresAt) {
      await this.prisma.organizationInvitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.EXPIRED },
      });
      throw new BadRequestException('Invitation token has expired. Please ask for a new invitation.');
    }

    // Verify email match
    const normalizedUserEmail = user.email.toLowerCase().trim();
    const normalizedInviteEmail = invitation.email.toLowerCase().trim();

    if (normalizedUserEmail !== normalizedInviteEmail) {
      throw new ForbiddenException(
        `This invitation was sent to ${invitation.email}. You are currently signed in as ${user.email}.`,
      );
    }

    // Accept and create/activate membership in transaction with atomic concurrency protection
    await this.prisma.$transaction(async (tx) => {
      // Ensure invitation was still pending at moment of transaction commit
      const updateResult = await tx.organizationInvitation.updateMany({
        where: { id: invitation.id, status: InvitationStatus.PENDING },
        data: {
          status: InvitationStatus.ACCEPTED,
          acceptedAt: new Date(),
        },
      });

      if (updateResult.count === 0) {
        throw new BadRequestException('Invitation has already been accepted or is no longer valid');
      }

      await tx.membership.upsert({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId: invitation.organizationId,
          },
        },
        create: {
          userId: user.id,
          organizationId: invitation.organizationId,
          role: invitation.role,
          status: MembershipStatus.ACTIVE,
        },
        update: {
          role: invitation.role,
          status: MembershipStatus.ACTIVE,
        },
      });
    });

    await this.auditService.logEvent(user.id, 'INVITATION_ACCEPTED', undefined, {
      organizationId: invitation.organizationId,
      invitationId: invitation.id,
      role: invitation.role,
    });

    return {
      success: true,
      message: `Successfully joined ${invitation.organization.name}`,
      organization: {
        id: invitation.organization.id,
        name: invitation.organization.name,
        slug: invitation.organization.slug,
        role: invitation.role,
      },
    };
  }

  // ==========================================
  // Helper / Mapping
  // ==========================================

  private mapOrganization(
    org: any,
    currentUserRole?: OrganizationRole,
    memberCount?: number,
    projectCount?: number,
  ) {
    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      country: org.country,
      defaultCurrency: org.currency as CurrencyCode,
      status: org.status as OrganizationStatus,
      settings: org.settings,
      createdAt: org.createdAt.toISOString(),
      updatedAt: org.updatedAt.toISOString(),
      ...(currentUserRole ? { currentUserRole } : {}),
      ...(typeof memberCount === 'number' ? { memberCount } : {}),
      ...(typeof projectCount === 'number' ? { projectCount } : {}),
    };
  }
}
