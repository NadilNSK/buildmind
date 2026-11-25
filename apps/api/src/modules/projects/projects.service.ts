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
  ProjectType,
  UnitSystem,
  SpatialNodeType,
} from '@buildmind/shared-types';
import { Prisma } from '@buildmind/database';
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

const ALLOWED_STATUS_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  [ProjectStatus.PLANNING]: [
    ProjectStatus.PLANNING,
    ProjectStatus.DESIGN,
    ProjectStatus.TENDERING,
    ProjectStatus.CANCELLED,
  ],
  [ProjectStatus.DESIGN]: [
    ProjectStatus.DESIGN,
    ProjectStatus.TENDERING,
    ProjectStatus.PRE_CONSTRUCTION,
    ProjectStatus.CANCELLED,
  ],
  [ProjectStatus.TENDERING]: [
    ProjectStatus.TENDERING,
    ProjectStatus.PRE_CONSTRUCTION,
    ProjectStatus.CANCELLED,
  ],
  [ProjectStatus.PRE_CONSTRUCTION]: [
    ProjectStatus.PRE_CONSTRUCTION,
    ProjectStatus.UNDER_CONSTRUCTION,
    ProjectStatus.ACTIVE,
    ProjectStatus.CANCELLED,
  ],
  [ProjectStatus.UNDER_CONSTRUCTION]: [
    ProjectStatus.UNDER_CONSTRUCTION,
    ProjectStatus.ON_HOLD,
    ProjectStatus.COMMERCIAL_CLOSEOUT,
    ProjectStatus.FINAL_ACCOUNT,
    ProjectStatus.CANCELLED,
  ],
  [ProjectStatus.ACTIVE]: [
    ProjectStatus.ACTIVE,
    ProjectStatus.ON_HOLD,
    ProjectStatus.COMMERCIAL_CLOSEOUT,
    ProjectStatus.FINAL_ACCOUNT,
    ProjectStatus.CANCELLED,
  ],
  [ProjectStatus.ON_HOLD]: [
    ProjectStatus.ON_HOLD,
    ProjectStatus.UNDER_CONSTRUCTION,
    ProjectStatus.ACTIVE,
    ProjectStatus.CANCELLED,
  ],
  [ProjectStatus.COMMERCIAL_CLOSEOUT]: [
    ProjectStatus.COMMERCIAL_CLOSEOUT,
    ProjectStatus.FINAL_ACCOUNT,
    ProjectStatus.CANCELLED,
  ],
  [ProjectStatus.FINAL_ACCOUNT]: [
    ProjectStatus.FINAL_ACCOUNT,
    ProjectStatus.COMPLETED,
    ProjectStatus.CANCELLED,
  ],
  [ProjectStatus.COMPLETED]: [
    ProjectStatus.COMPLETED,
    ProjectStatus.ARCHIVED,
  ],
  [ProjectStatus.CANCELLED]: [
    ProjectStatus.CANCELLED,
    ProjectStatus.ARCHIVED,
  ],
  [ProjectStatus.ARCHIVED]: [
    ProjectStatus.ARCHIVED,
    ProjectStatus.PLANNING, // Reopen
  ],
};

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // ==========================================
  // Project Lifecycle & CRUD
  // ==========================================

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
        { clientName: { contains: term, mode: 'insensitive' } },
        { contractorName: { contains: term, mode: 'insensitive' } },
        { location: { contains: term, mode: 'insensitive' } },
      ];
    }

    const projects = await this.prisma.project.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            members: true,
            spatialNodes: true,
            workPackages: true,
          },
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
          select: {
            members: true,
            spatialNodes: true,
            workPackages: true,
          },
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

    const decimalValue =
      input.estimatedContractValue !== undefined && input.estimatedContractValue !== null && input.estimatedContractValue !== ''
        ? new Prisma.Decimal(input.estimatedContractValue)
        : null;

    const project = await this.prisma.$transaction(async (tx) => {
      const created = await tx.project.create({
        data: {
          organizationId,
          code: input.code,
          name: input.name,
          description: input.description,
          projectType: input.projectType || ProjectType.COMMERCIAL,
          country: input.country || 'LK',
          location: input.location,
          clientName: input.clientName,
          contractorName: input.contractorName,
          consultantName: input.consultantName,
          projectManager: input.projectManager,
          startDate: input.startDate ? new Date(input.startDate) : null,
          expectedCompletionDate: input.expectedCompletionDate ? new Date(input.expectedCompletionDate) : null,
          actualCompletionDate: input.actualCompletionDate ? new Date(input.actualCompletionDate) : null,
          estimatedContractValue: decimalValue,
          currency: input.currency || CurrencyCode.LKR,
          standard: input.measurementStandard || MeasurementStandard.SLS_573,
          measurementUnitSystem: input.measurementUnitSystem || UnitSystem.METRIC,
          contractStandard: input.contractStandard,
          status: input.status || ProjectStatus.PLANNING,
          createdById: userId,
        },
        include: {
          _count: {
            select: {
              members: true,
              spatialNodes: true,
              workPackages: true,
            },
          },
          createdBy: { select: { id: true, email: true, fullName: true } },
        },
      });

      // Automatically add creator as initial project lead
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
    userId?: string,
  ) {
    const existing = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId },
    });

    if (!existing) {
      throw new NotFoundException('Project not found in this organization');
    }

    // Validate status transition if status is being modified
    if (input.status && input.status !== existing.status) {
      const allowed = ALLOWED_STATUS_TRANSITIONS[existing.status as ProjectStatus] || [];
      if (!allowed.includes(input.status)) {
        throw new BadRequestException(
          `Invalid project status transition from ${existing.status} to ${input.status}`,
        );
      }
    }

    const decimalValue =
      input.estimatedContractValue !== undefined
        ? input.estimatedContractValue !== null && input.estimatedContractValue !== ''
          ? new Prisma.Decimal(input.estimatedContractValue)
          : null
        : existing.estimatedContractValue;

    const isArchiving = input.status === ProjectStatus.ARCHIVED && existing.status !== ProjectStatus.ARCHIVED;
    const isUnarchiving = input.status && input.status !== ProjectStatus.ARCHIVED && existing.status === ProjectStatus.ARCHIVED;

    let archivedAt = existing.archivedAt;
    if (isArchiving) {
      archivedAt = new Date();
    } else if (isUnarchiving) {
      archivedAt = null;
    }

    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        name: input.name ?? existing.name,
        description: input.description ?? existing.description,
        projectType: input.projectType ?? existing.projectType,
        country: input.country ?? existing.country,
        location: input.location ?? existing.location,
        clientName: input.clientName ?? existing.clientName,
        contractorName: input.contractorName ?? existing.contractorName,
        consultantName: input.consultantName ?? existing.consultantName,
        projectManager: input.projectManager ?? existing.projectManager,
        startDate: input.startDate !== undefined ? (input.startDate ? new Date(input.startDate) : null) : existing.startDate,
        expectedCompletionDate: input.expectedCompletionDate !== undefined ? (input.expectedCompletionDate ? new Date(input.expectedCompletionDate) : null) : existing.expectedCompletionDate,
        actualCompletionDate: input.actualCompletionDate !== undefined ? (input.actualCompletionDate ? new Date(input.actualCompletionDate) : null) : existing.actualCompletionDate,
        estimatedContractValue: decimalValue,
        currency: input.currency ?? existing.currency,
        standard: input.measurementStandard ?? existing.standard,
        measurementUnitSystem: input.measurementUnitSystem ?? existing.measurementUnitSystem,
        contractStandard: input.contractStandard ?? existing.contractStandard,
        status: input.status ?? existing.status,
        archivedAt,
      },
      include: {
        _count: {
          select: {
            members: true,
            spatialNodes: true,
            workPackages: true,
          },
        },
        createdBy: { select: { id: true, email: true, fullName: true } },
      },
    });

    if (input.status && input.status !== existing.status) {
      await this.auditService.logEvent(userId || null, 'PROJECT_STATUS_CHANGED', undefined, {
        organizationId,
        projectId,
        oldStatus: existing.status,
        newStatus: input.status,
      });
    }

    await this.auditService.logEvent(userId || null, 'PROJECT_UPDATED', undefined, {
      organizationId,
      projectId,
      changes: input,
    });

    return this.mapProject(updated);
  }

  async delete(organizationId: string, projectId: string, userId?: string) {
    const existing = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId },
    });

    if (!existing) {
      throw new NotFoundException('Project not found in this organization');
    }

    await this.prisma.project.delete({
      where: { id: projectId },
    });

    await this.auditService.logEvent(userId || null, 'PROJECT_DELETED', undefined, {
      organizationId,
      projectId,
      code: existing.code,
      name: existing.name,
    });

    return { success: true, message: 'Project deleted successfully' };
  }

  // ==========================================
  // Project Settings & Overview
  // ==========================================

  async getSettings(organizationId: string, projectId: string) {
    const project = await this.findOne(organizationId, projectId);
    return {
      id: project.id,
      code: project.code,
      name: project.name,
      description: project.description,
      projectType: project.projectType,
      country: project.country,
      location: project.location,
      clientName: project.clientName,
      contractorName: project.contractorName,
      consultantName: project.consultantName,
      projectManager: project.projectManager,
      startDate: project.startDate,
      expectedCompletionDate: project.expectedCompletionDate,
      actualCompletionDate: project.actualCompletionDate,
      estimatedContractValue: project.estimatedContractValue,
      currency: project.currency,
      measurementStandard: project.measurementStandard,
      measurementUnitSystem: project.measurementUnitSystem,
      contractStandard: project.contractStandard,
      status: project.status,
      archivedAt: project.archivedAt,
      updatedAt: project.updatedAt,
    };
  }

  async updateSettings(
    organizationId: string,
    projectId: string,
    userId: string,
    input: UpdateProjectSettingsDto,
  ) {
    const updated = await this.update(organizationId, projectId, input, userId);
    await this.auditService.logEvent(userId, 'PROJECT_SETTINGS_UPDATED', undefined, {
      organizationId,
      projectId,
      changes: input,
    });
    return updated;
  }

  async getOverview(organizationId: string, projectId: string) {
    const project = await this.findOne(organizationId, projectId);

    // Fetch recent audit events related to this project
    let recentActivity: any[] = [];
    try {
      const events = await this.prisma.authAuditEvent.findMany({
        where: {
          metadata: {
            path: ['projectId'],
            equals: projectId,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: { select: { id: true, email: true, fullName: true } },
        },
      });

      recentActivity = events.map((e) => ({
        id: e.id,
        eventType: e.eventType,
        createdAt: e.createdAt.toISOString(),
        user: e.user,
        metadata: e.metadata,
      }));
    } catch {
      // In case json path filter is unsupported or empty
      recentActivity = [];
    }

    return {
      project,
      metrics: {
        memberCount: project.memberCount,
        spatialNodeCount: project.spatialNodeCount,
        workPackageCount: project.workPackageCount,
      },
      recentActivity,
    };
  }

  // ==========================================
  // Spatial Nodes (Spatial Breakdown Structure)
  // ==========================================

  async listSpatialNodes(
    organizationId: string,
    projectId: string,
    query?: { status?: string },
  ) {
    await this.verifyProjectAccess(organizationId, projectId);

    const where: any = { projectId };
    if (query?.status) {
      where.status = query.status;
    } else {
      where.status = 'ACTIVE';
    }

    const nodes = await this.prisma.spatialNode.findMany({
      where,
      include: {
        parentNode: {
          select: { id: true, name: true, code: true, nodeType: true },
        },
        _count: {
          select: { childNodes: true },
        },
      },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return nodes.map((n) => this.mapSpatialNode(n));
  }

  async getSpatialNode(
    organizationId: string,
    projectId: string,
    nodeId: string,
  ) {
    await this.verifyProjectAccess(organizationId, projectId);

    const node = await this.prisma.spatialNode.findFirst({
      where: { id: nodeId, projectId },
      include: {
        parentNode: {
          select: { id: true, name: true, code: true, nodeType: true },
        },
        childNodes: {
          select: {
            id: true,
            name: true,
            code: true,
            nodeType: true,
            displayOrder: true,
            status: true,
          },
          orderBy: { displayOrder: 'asc' },
        },
        _count: {
          select: { childNodes: true },
        },
      },
    });

    if (!node) {
      throw new NotFoundException('Spatial node not found in this project');
    }

    return this.mapSpatialNode(node);
  }

  async createSpatialNode(
    organizationId: string,
    projectId: string,
    userId: string,
    input: CreateSpatialNodeDto,
  ) {
    await this.verifyProjectAccess(organizationId, projectId);

    if (input.parentNodeId) {
      const parent = await this.prisma.spatialNode.findFirst({
        where: { id: input.parentNodeId, projectId },
      });
      if (!parent) {
        throw new BadRequestException(
          'Parent spatial node does not exist in this project',
        );
      }
    }

    const node = await this.prisma.spatialNode.create({
      data: {
        projectId,
        parentNodeId: input.parentNodeId || null,
        nodeType: input.nodeType || SpatialNodeType.BUILDING,
        name: input.name,
        code: input.code,
        description: input.description,
        displayOrder: input.displayOrder ?? 0,
        status: 'ACTIVE',
        metadata: input.metadata || {},
      },
      include: {
        parentNode: {
          select: { id: true, name: true, code: true, nodeType: true },
        },
        _count: {
          select: { childNodes: true },
        },
      },
    });

    await this.auditService.logEvent(userId, 'SPATIAL_NODE_CREATED', undefined, {
      organizationId,
      projectId,
      nodeId: node.id,
      name: node.name,
      nodeType: node.nodeType,
    });

    return this.mapSpatialNode(node);
  }

  async updateSpatialNode(
    organizationId: string,
    projectId: string,
    nodeId: string,
    userId: string,
    input: UpdateSpatialNodeDto,
  ) {
    await this.verifyProjectAccess(organizationId, projectId);

    const existing = await this.prisma.spatialNode.findFirst({
      where: { id: nodeId, projectId },
    });

    if (!existing) {
      throw new NotFoundException('Spatial node not found in this project');
    }

    if (input.parentNodeId !== undefined && input.parentNodeId !== null) {
      await this.validateNoSpatialCycle(projectId, nodeId, input.parentNodeId);
    }

    const updated = await this.prisma.spatialNode.update({
      where: { id: nodeId },
      data: {
        name: input.name ?? existing.name,
        code: input.code !== undefined ? input.code : existing.code,
        description: input.description !== undefined ? input.description : existing.description,
        nodeType: input.nodeType ?? existing.nodeType,
        parentNodeId: input.parentNodeId !== undefined ? input.parentNodeId : existing.parentNodeId,
        displayOrder: input.displayOrder !== undefined ? input.displayOrder : existing.displayOrder,
        status: input.status ?? existing.status,
        metadata: input.metadata !== undefined ? input.metadata : (existing.metadata as any),
      },
      include: {
        parentNode: {
          select: { id: true, name: true, code: true, nodeType: true },
        },
        _count: {
          select: { childNodes: true },
        },
      },
    });

    const isArchived = input.status === 'ARCHIVED' && existing.status !== 'ARCHIVED';
    await this.auditService.logEvent(
      userId,
      isArchived ? 'SPATIAL_NODE_ARCHIVED' : 'SPATIAL_NODE_UPDATED',
      undefined,
      {
        organizationId,
        projectId,
        nodeId,
        changes: input,
      },
    );

    return this.mapSpatialNode(updated);
  }

  async deleteSpatialNode(
    organizationId: string,
    projectId: string,
    nodeId: string,
    userId: string,
  ) {
    await this.verifyProjectAccess(organizationId, projectId);

    const existing = await this.prisma.spatialNode.findFirst({
      where: { id: nodeId, projectId },
    });

    if (!existing) {
      throw new NotFoundException('Spatial node not found in this project');
    }

    // Soft delete / archive
    await this.prisma.spatialNode.update({
      where: { id: nodeId },
      data: { status: 'ARCHIVED' },
    });

    await this.auditService.logEvent(userId, 'SPATIAL_NODE_ARCHIVED', undefined, {
      organizationId,
      projectId,
      nodeId,
      name: existing.name,
    });

    return { success: true, message: 'Spatial node archived successfully' };
  }

  // ==========================================
  // Work Packages (Work Breakdown Structure)
  // ==========================================

  async listWorkPackages(
    organizationId: string,
    projectId: string,
    query?: { status?: string },
  ) {
    await this.verifyProjectAccess(organizationId, projectId);

    const where: any = { projectId };
    if (query?.status) {
      where.status = query.status;
    } else {
      where.status = 'ACTIVE';
    }

    const packages = await this.prisma.workPackage.findMany({
      where,
      include: {
        parentPackage: {
          select: { id: true, code: true, name: true },
        },
        _count: {
          select: { childPackages: true },
        },
      },
      orderBy: [{ displayOrder: 'asc' }, { code: 'asc' }],
    });

    return packages.map((wp) => this.mapWorkPackage(wp));
  }

  async getWorkPackage(
    organizationId: string,
    projectId: string,
    packageId: string,
  ) {
    await this.verifyProjectAccess(organizationId, projectId);

    const wp = await this.prisma.workPackage.findFirst({
      where: { id: packageId, projectId },
      include: {
        parentPackage: {
          select: { id: true, code: true, name: true },
        },
        childPackages: {
          select: {
            id: true,
            code: true,
            name: true,
            displayOrder: true,
            status: true,
          },
          orderBy: { displayOrder: 'asc' },
        },
        _count: {
          select: { childPackages: true },
        },
      },
    });

    if (!wp) {
      throw new NotFoundException('Work package not found in this project');
    }

    return this.mapWorkPackage(wp);
  }

  async createWorkPackage(
    organizationId: string,
    projectId: string,
    userId: string,
    input: CreateWorkPackageDto,
  ) {
    await this.verifyProjectAccess(organizationId, projectId);

    // Enforce unique code within project
    const existingCode = await this.prisma.workPackage.findUnique({
      where: {
        projectId_code: {
          projectId,
          code: input.code,
        },
      },
    });

    if (existingCode) {
      throw new ConflictException(
        `Work package code "${input.code}" already exists in this project`,
      );
    }

    if (input.parentPackageId) {
      const parent = await this.prisma.workPackage.findFirst({
        where: { id: input.parentPackageId, projectId },
      });
      if (!parent) {
        throw new BadRequestException(
          'Parent work package does not exist in this project',
        );
      }
    }

    const wp = await this.prisma.workPackage.create({
      data: {
        projectId,
        parentPackageId: input.parentPackageId || null,
        code: input.code,
        name: input.name,
        description: input.description,
        displayOrder: input.displayOrder ?? 0,
        status: 'ACTIVE',
        metadata: input.metadata || {},
      },
      include: {
        parentPackage: {
          select: { id: true, code: true, name: true },
        },
        _count: {
          select: { childPackages: true },
        },
      },
    });

    await this.auditService.logEvent(userId, 'WORK_PACKAGE_CREATED', undefined, {
      organizationId,
      projectId,
      packageId: wp.id,
      code: wp.code,
      name: wp.name,
    });

    return this.mapWorkPackage(wp);
  }

  async updateWorkPackage(
    organizationId: string,
    projectId: string,
    packageId: string,
    userId: string,
    input: UpdateWorkPackageDto,
  ) {
    await this.verifyProjectAccess(organizationId, projectId);

    const existing = await this.prisma.workPackage.findFirst({
      where: { id: packageId, projectId },
    });

    if (!existing) {
      throw new NotFoundException('Work package not found in this project');
    }

    if (input.code && input.code !== existing.code) {
      const conflict = await this.prisma.workPackage.findUnique({
        where: {
          projectId_code: {
            projectId,
            code: input.code,
          },
        },
      });
      if (conflict) {
        throw new ConflictException(
          `Work package code "${input.code}" already exists in this project`,
        );
      }
    }

    if (input.parentPackageId !== undefined && input.parentPackageId !== null) {
      await this.validateNoWorkPackageCycle(projectId, packageId, input.parentPackageId);
    }

    const updated = await this.prisma.workPackage.update({
      where: { id: packageId },
      data: {
        code: input.code ?? existing.code,
        name: input.name ?? existing.name,
        description: input.description !== undefined ? input.description : existing.description,
        parentPackageId: input.parentPackageId !== undefined ? input.parentPackageId : existing.parentPackageId,
        displayOrder: input.displayOrder !== undefined ? input.displayOrder : existing.displayOrder,
        status: input.status ?? existing.status,
        metadata: input.metadata !== undefined ? input.metadata : (existing.metadata as any),
      },
      include: {
        parentPackage: {
          select: { id: true, code: true, name: true },
        },
        _count: {
          select: { childPackages: true },
        },
      },
    });

    const isArchived = input.status === 'ARCHIVED' && existing.status !== 'ARCHIVED';
    await this.auditService.logEvent(
      userId,
      isArchived ? 'WORK_PACKAGE_ARCHIVED' : 'WORK_PACKAGE_UPDATED',
      undefined,
      {
        organizationId,
        projectId,
        packageId,
        changes: input,
      },
    );

    return this.mapWorkPackage(updated);
  }

  async deleteWorkPackage(
    organizationId: string,
    projectId: string,
    packageId: string,
    userId: string,
  ) {
    await this.verifyProjectAccess(organizationId, projectId);

    const existing = await this.prisma.workPackage.findFirst({
      where: { id: packageId, projectId },
    });

    if (!existing) {
      throw new NotFoundException('Work package not found in this project');
    }

    await this.prisma.workPackage.update({
      where: { id: packageId },
      data: { status: 'ARCHIVED' },
    });

    await this.auditService.logEvent(userId, 'WORK_PACKAGE_ARCHIVED', undefined, {
      organizationId,
      projectId,
      packageId,
      code: existing.code,
      name: existing.name,
    });

    return { success: true, message: 'Work package archived successfully' };
  }

  // ==========================================
  // Project Member Access Grants
  // ==========================================

  async listMembers(organizationId: string, projectId: string) {
    await this.verifyProjectAccess(organizationId, projectId);

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
    userId?: string,
  ) {
    await this.verifyProjectAccess(organizationId, projectId);

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

    await this.auditService.logEvent(userId || null, 'PROJECT_MEMBER_ADDED', undefined, {
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
    userId?: string,
  ) {
    await this.verifyProjectAccess(organizationId, projectId);

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

    await this.auditService.logEvent(userId || null, 'PROJECT_MEMBER_REMOVED', undefined, {
      organizationId,
      projectId,
      targetUserId,
    });

    return { success: true, message: 'Member removed from project successfully' };
  }

  // ==========================================
  // Helper / Cycle Validation & Mapping
  // ==========================================

  private async verifyProjectAccess(organizationId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found in this organization');
    }
    return project;
  }

  private async validateNoSpatialCycle(
    projectId: string,
    nodeId: string,
    newParentId: string,
  ): Promise<void> {
    if (nodeId === newParentId) {
      throw new BadRequestException('A spatial node cannot be its own parent');
    }

    let currentParentId: string | null = newParentId;
    const visited = new Set<string>([nodeId]);

    while (currentParentId) {
      if (visited.has(currentParentId)) {
        throw new BadRequestException(
          'Circular reference detected: a node cannot have one of its descendants as parent',
        );
      }
      visited.add(currentParentId);

      const parent: { parentNodeId: string | null; projectId: string } | null =
        await this.prisma.spatialNode.findUnique({
          where: { id: currentParentId },
          select: { parentNodeId: true, projectId: true },
        });

      if (!parent || parent.projectId !== projectId) {
        throw new BadRequestException(
          'Parent spatial node does not exist in this project',
        );
      }

      currentParentId = parent.parentNodeId;
    }
  }

  private async validateNoWorkPackageCycle(
    projectId: string,
    packageId: string,
    newParentId: string,
  ): Promise<void> {
    if (packageId === newParentId) {
      throw new BadRequestException('A work package cannot be its own parent');
    }

    let currentParentId: string | null = newParentId;
    const visited = new Set<string>([packageId]);

    while (currentParentId) {
      if (visited.has(currentParentId)) {
        throw new BadRequestException(
          'Circular reference detected: a work package cannot have one of its descendants as parent',
        );
      }
      visited.add(currentParentId);

      const parent: { parentPackageId: string | null; projectId: string } | null =
        await this.prisma.workPackage.findUnique({
          where: { id: currentParentId },
          select: { parentPackageId: true, projectId: true },
        });

      if (!parent || parent.projectId !== projectId) {
        throw new BadRequestException(
          'Parent work package does not exist in this project',
        );
      }

      currentParentId = parent.parentPackageId;
    }
  }

  private mapProject(p: any) {
    return {
      id: p.id,
      organizationId: p.organizationId,
      code: p.code,
      name: p.name,
      description: p.description,
      projectType: p.projectType as ProjectType,
      country: p.country,
      location: p.location,
      clientName: p.clientName,
      contractorName: p.contractorName,
      consultantName: p.consultantName,
      projectManager: p.projectManager,
      startDate: p.startDate ? p.startDate.toISOString() : null,
      expectedCompletionDate: p.expectedCompletionDate ? p.expectedCompletionDate.toISOString() : null,
      actualCompletionDate: p.actualCompletionDate ? p.actualCompletionDate.toISOString() : null,
      estimatedContractValue: p.estimatedContractValue != null ? p.estimatedContractValue.toString() : null,
      currency: p.currency as CurrencyCode,
      measurementStandard: p.standard as MeasurementStandard,
      measurementUnitSystem: p.measurementUnitSystem as UnitSystem,
      contractStandard: (p.contractStandard as ContractStandard) || undefined,
      status: p.status as ProjectStatus,
      archivedAt: p.archivedAt ? p.archivedAt.toISOString() : null,
      createdById: p.createdById,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      memberCount: p._count?.members ?? (p.members?.length || 0),
      spatialNodeCount: p._count?.spatialNodes ?? 0,
      workPackageCount: p._count?.workPackages ?? 0,
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

  private mapSpatialNode(node: any) {
    return {
      id: node.id,
      projectId: node.projectId,
      parentNodeId: node.parentNodeId,
      nodeType: node.nodeType as SpatialNodeType,
      name: node.name,
      code: node.code,
      description: node.description,
      displayOrder: node.displayOrder,
      status: node.status,
      metadata: node.metadata,
      createdAt: node.createdAt.toISOString(),
      updatedAt: node.updatedAt.toISOString(),
      parentNode: node.parentNode
        ? {
            id: node.parentNode.id,
            name: node.parentNode.name,
            code: node.parentNode.code,
            nodeType: node.parentNode.nodeType,
          }
        : undefined,
      childCount: node._count?.childNodes ?? (node.childNodes?.length || 0),
      ...(node.childNodes
        ? {
            childNodes: node.childNodes.map((c: any) => ({
              id: c.id,
              name: c.name,
              code: c.code,
              nodeType: c.nodeType,
              displayOrder: c.displayOrder,
              status: c.status,
            })),
          }
        : {}),
    };
  }

  private mapWorkPackage(wp: any) {
    return {
      id: wp.id,
      projectId: wp.projectId,
      parentPackageId: wp.parentPackageId,
      code: wp.code,
      name: wp.name,
      description: wp.description,
      displayOrder: wp.displayOrder,
      status: wp.status,
      metadata: wp.metadata,
      createdAt: wp.createdAt.toISOString(),
      updatedAt: wp.updatedAt.toISOString(),
      parentPackage: wp.parentPackage
        ? {
            id: wp.parentPackage.id,
            code: wp.parentPackage.code,
            name: wp.parentPackage.name,
          }
        : undefined,
      childCount: wp._count?.childPackages ?? (wp.childPackages?.length || 0),
      ...(wp.childPackages
        ? {
            childPackages: wp.childPackages.map((c: any) => ({
              id: c.id,
              code: c.code,
              name: c.name,
              displayOrder: c.displayOrder,
              status: c.status,
            })),
          }
        : {}),
    };
  }
}
