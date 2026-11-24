import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../auth/services/audit.service';
import {
  MeasurementStandard,
  ProjectStatus,
  CurrencyCode,
  ContractStandard,
} from '@buildmind/shared-types';
import {
  CreateProjectDto,
  UpdateProjectDto,
  AddProjectMemberDto,
} from './dto/project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(
    organizationId: string,
    query?: { search?: string; status?: ProjectStatus },
  ) {
    const whereClause: any = { organizationId };

    if (query?.status) {
      whereClause.status = query.status;
    }

    if (query?.search) {
      const term = query.search.trim();
      whereClause.OR = [
        { code: { contains: term, mode: 'insensitive' } },
        { name: { contains: term, mode: 'insensitive' } },
      ];
    }

    const projects = await this.prisma.project.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { members: true },
        },
        createdBy: {
          select: { id: true, email: true, fullName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return projects.map((p) => this.mapProject(p));
  }

  async findOne(organizationId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId,
      },
      include: {
        _count: {
          select: { members: true },
        },
        createdBy: {
          select: { id: true, email: true, fullName: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, email: true, fullName: true },
            },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found in this organization');
    }

    return this.mapProject(project);
  }

  async create(
    organizationId: string,
    userId: string,
    input: CreateProjectDto,
  ) {
    // Check code uniqueness within organization
    const existing = await this.prisma.project.findUnique({
      where: {
        organizationId_code: {
          organizationId,
          code: input.code,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Project code "${input.code}" already exists in this organization`,
      );
    }

    const project = await this.prisma.$transaction(async (tx) => {
      const created = await tx.project.create({
        data: {
          organizationId,
          code: input.code,
          name: input.name,
          description: input.description,
          country: input.country || 'LK',
          standard: input.measurementStandard || MeasurementStandard.SLS_573,
          contractStandard: input.contractStandard,
          currency: input.currency || CurrencyCode.LKR,
          status: input.status || ProjectStatus.PLANNING,
          createdById: userId,
        },
        include: {
          _count: { select: { members: true } },
          createdBy: { select: { id: true, email: true, fullName: true } },
        },
      });

      // Automatically add creator as initial project member
      await tx.projectMember.create({
        data: {
          projectId: created.id,
          userId,
          role: 'PROJECT_LEAD',
        },
      });

      return created;
    });

    await this.auditService.logEvent(userId, 'PROJECT_CREATED', undefined, {
      organizationId,
      projectId: project.id,
      code: project.code,
      name: project.name,
    });

    return this.mapProject(project);
  }

  async update(
    organizationId: string,
    projectId: string,
    input: UpdateProjectDto,
  ) {
    const existing = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId },
    });

    if (!existing) {
      throw new NotFoundException('Project not found in this organization');
    }

    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        name: input.name ?? existing.name,
        description: input.description ?? existing.description,
        country: input.country ?? existing.country,
        standard: input.measurementStandard ?? existing.standard,
        contractStandard: input.contractStandard ?? existing.contractStandard,
        currency: input.currency ?? existing.currency,
        status: input.status ?? existing.status,
      },
      include: {
        _count: { select: { members: true } },
        createdBy: { select: { id: true, email: true, fullName: true } },
      },
    });

    await this.auditService.logEvent(null, 'PROJECT_UPDATED', undefined, {
      organizationId,
      projectId,
      changes: input,
    });

    return this.mapProject(updated);
  }

  async delete(organizationId: string, projectId: string) {
    const existing = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId },
    });

    if (!existing) {
      throw new NotFoundException('Project not found in this organization');
    }

    await this.prisma.project.delete({
      where: { id: projectId },
    });

    await this.auditService.logEvent(null, 'PROJECT_DELETED', undefined, {
      organizationId,
      projectId,
      code: existing.code,
      name: existing.name,
    });

    return { success: true, message: 'Project deleted successfully' };
  }

  // ==========================================
  // Project Member Access Grants
  // ==========================================

  async listMembers(organizationId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId },
    });

    if (!project) {
      throw new NotFoundException('Project not found in this organization');
    }

    const members = await this.prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: { select: { id: true, email: true, fullName: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return members.map((m) => ({
      id: m.id,
      projectId: m.projectId,
      userId: m.userId,
      role: m.role,
      createdAt: m.createdAt.toISOString(),
      user: m.user,
    }));
  }

  async addMember(
    organizationId: string,
    projectId: string,
    input: AddProjectMemberDto,
  ) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId },
    });

    if (!project) {
      throw new NotFoundException('Project not found in this organization');
    }

    // Verify target user is an active member of this organization
    const orgMembership = await this.prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: input.userId,
          organizationId,
        },
      },
    });

    if (!orgMembership || orgMembership.status !== 'ACTIVE') {
      throw new BadRequestException(
        'User must be an active member of this organization to be granted project access',
      );
    }

    const existingMember = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: input.userId,
        },
      },
    });

    if (existingMember) {
      throw new ConflictException('User is already assigned to this project');
    }

    const member = await this.prisma.projectMember.create({
      data: {
        projectId,
        userId: input.userId,
        role: input.role || 'MEMBER',
      },
      include: {
        user: { select: { id: true, email: true, fullName: true } },
      },
    });

    await this.auditService.logEvent(null, 'PROJECT_MEMBER_ADDED', undefined, {
      organizationId,
      projectId,
      targetUserId: input.userId,
      role: input.role,
    });

    return {
      id: member.id,
      projectId: member.projectId,
      userId: member.userId,
      role: member.role,
      createdAt: member.createdAt.toISOString(),
      user: member.user,
    };
  }

  async removeMember(
    organizationId: string,
    projectId: string,
    targetUserId: string,
  ) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId },
    });

    if (!project) {
      throw new NotFoundException('Project not found in this organization');
    }

    const member = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: targetUserId,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Project member grant not found');
    }

    await this.prisma.projectMember.delete({
      where: { id: member.id },
    });

    await this.auditService.logEvent(null, 'PROJECT_MEMBER_REMOVED', undefined, {
      organizationId,
      projectId,
      targetUserId,
    });

    return { success: true, message: 'Member removed from project successfully' };
  }

  // ==========================================
  // Helper / Mapping
  // ==========================================

  private mapProject(p: any) {
    return {
      id: p.id,
      organizationId: p.organizationId,
      code: p.code,
      name: p.name,
      description: p.description,
      country: p.country,
      measurementStandard: p.standard as MeasurementStandard,
      contractStandard: (p.contractStandard as ContractStandard) || undefined,
      status: p.status as ProjectStatus,
      currency: p.currency as CurrencyCode,
      createdById: p.createdById,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      memberCount: p._count?.members ?? (p.members?.length || 0),
      createdBy: p.createdBy,
      ...(p.members
        ? {
            members: p.members.map((m: any) => ({
              id: m.id,
              userId: m.userId,
              role: m.role,
              createdAt: m.createdAt.toISOString(),
              user: m.user,
            })),
          }
        : {}),
    };
  }
}
