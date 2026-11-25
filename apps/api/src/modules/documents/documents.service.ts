import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { FileValidatorService } from '../storage/file-validator.service';
import { AuditService } from '../auth/services/audit.service';
import {
  DocumentCategory,
  DocumentDiscipline,
  DocumentFileFormat,
  DocumentUploadStatus,
  DocumentScanStatus,
  DocumentSummary,
  DocumentDetails,
  DocumentUploadSessionSummary,
  StorageUsageSummary,
} from '@buildmind/shared-types';
import {
  CreateUploadSessionDto,
  CompleteUploadSessionDto,
  UpdateDocumentDto,
  UpdateDocumentLinksDto,
  DocumentQueryDto,
} from './dto/document.dto';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly validator: FileValidatorService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Helper: verify project exists and belongs to organization
   */
  private async getVerifiedProject(organizationId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId },
    });
    if (!project) {
      throw new NotFoundException(`Project not found in this organization`);
    }
    return project;
  }

  /**
   * Helper: format Document record to DTO with BigInt serialized to string
   */
  private mapDocument(doc: any): DocumentSummary {
    return {
      id: doc.id,
      organizationId: doc.organizationId,
      projectId: doc.projectId,
      reference: doc.reference,
      title: doc.title,
      description: doc.description,
      category: doc.category as DocumentCategory,
      discipline: doc.discipline as DocumentDiscipline,
      originalFilename: doc.originalFilename,
      fileFormat: doc.fileFormat as DocumentFileFormat,
      mimeType: doc.mimeType,
      fileSizeBytes: doc.fileSizeBytes.toString(),
      storageObjectKey: doc.storageObjectKey,
      checksumSha256: doc.checksumSha256,
      uploadStatus: doc.uploadStatus as DocumentUploadStatus,
      securityScanStatus: doc.securityScanStatus as DocumentScanStatus,
      uploadedById: doc.uploadedById,
      archivedAt: doc.archivedAt ? doc.archivedAt.toISOString() : null,
      metadata: doc.metadata,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
      uploadedBy: doc.uploadedBy
        ? {
            id: doc.uploadedBy.id,
            email: doc.uploadedBy.email,
            fullName: doc.uploadedBy.fullName,
          }
        : undefined,
      spatialLinkCount: doc._count?.spatialLinks ?? (doc.spatialLinks ? doc.spatialLinks.length : 0),
      workPackageLinkCount:
        doc._count?.workPackageLinks ?? (doc.workPackageLinks ? doc.workPackageLinks.length : 0),
    };
  }

  /**
   * Helper: format DocumentUploadSession record
   */
  private mapUploadSession(session: any): DocumentUploadSessionSummary {
    return {
      id: session.id,
      organizationId: session.organizationId,
      projectId: session.projectId,
      userId: session.userId,
      documentId: session.documentId,
      declaredFilename: session.declaredFilename,
      declaredMimeType: session.declaredMimeType,
      declaredSizeBytes: session.declaredSizeBytes.toString(),
      category: session.category,
      discipline: session.discipline,
      storageKey: session.storageKey,
      status: session.status,
      checksumSha256: session.checksumSha256,
      actualSizeBytes: session.actualSizeBytes ? session.actualSizeBytes.toString() : null,
      metadata: session.metadata,
      expiresAt: session.expiresAt.toISOString(),
      completedAt: session.completedAt ? session.completedAt.toISOString() : null,
      errorMessage: session.errorMessage,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
    };
  }

  // ==========================================
  // 1. Upload Session Lifecycle
  // ==========================================

  /**
   * Initiates an upload session
   */
  async createUploadSession(
    organizationId: string,
    projectId: string,
    userId: string,
    dto: CreateUploadSessionDto,
  ): Promise<DocumentUploadSessionSummary & { uploadUrl?: string }> {
    await this.getVerifiedProject(organizationId, projectId);

    // Validate filename & extension
    const sanitizedName = this.validator.sanitizeFilename(dto.declaredFilename);
    const { format } = this.validator.validateExtension(sanitizedName);

    // Validate declared size (max 500MB)
    this.validator.validateFileSize(dto.declaredSizeBytes);

    // If reference provided, verify uniqueness in project
    const ref = dto.reference?.trim() || `DOC-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
    const existingDoc = await this.prisma.document.findUnique({
      where: {
        projectId_reference: {
          projectId,
          reference: ref,
        },
      },
    });
    if (existingDoc) {
      throw new ConflictException(`Document reference "${ref}" already exists in this project`);
    }

    // Verify spatial nodes belong to project
    if (dto.spatialNodeIds && dto.spatialNodeIds.length > 0) {
      const validNodesCount = await this.prisma.spatialNode.count({
        where: { id: { in: dto.spatialNodeIds }, projectId },
      });
      if (validNodesCount !== dto.spatialNodeIds.length) {
        throw new BadRequestException('One or more spatial nodes do not belong to this project');
      }
    }

    // Verify work packages belong to project
    if (dto.workPackageIds && dto.workPackageIds.length > 0) {
      const validPackagesCount = await this.prisma.workPackage.count({
        where: { id: { in: dto.workPackageIds }, projectId },
      });
      if (validPackagesCount !== dto.workPackageIds.length) {
        throw new BadRequestException('One or more work packages do not belong to this project');
      }
    }

    // Create session in DB with 2-hour expiration
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const dummyId = crypto.randomUUID();
    const quarantineStorageKey = this.storage.getQuarantineKey(
      organizationId,
      projectId,
      dummyId,
      sanitizedName,
    );

    const session = await this.prisma.documentUploadSession.create({
      data: {
        id: dummyId,
        organizationId,
        projectId,
        userId,
        declaredFilename: sanitizedName,
        declaredMimeType: dto.declaredMimeType,
        declaredSizeBytes: BigInt(dto.declaredSizeBytes),
        category: dto.category,
        discipline: dto.discipline || DocumentDiscipline.GENERAL,
        storageKey: quarantineStorageKey,
        status: DocumentUploadStatus.PENDING,
        metadata: {
          reference: ref,
          title: dto.title || sanitizedName,
          description: dto.description,
          fileFormat: format,
          spatialNodeIds: dto.spatialNodeIds || [],
          workPackageIds: dto.workPackageIds || [],
          clientMetadata: dto.metadata || {},
        },
        expiresAt,
      },
    });

    return this.mapUploadSession(session);
  }

  /**
   * Directly upload file data to quarantine storage
   */
  async uploadFileDirect(
    organizationId: string,
    projectId: string,
    sessionId: string,
    userId: string,
    fileBuffer: Buffer,
  ): Promise<DocumentUploadSessionSummary> {
    const session = await this.prisma.documentUploadSession.findFirst({
      where: { id: sessionId, projectId, organizationId },
    });

    if (!session) {
      throw new NotFoundException('Upload session not found');
    }

    if (session.status === DocumentUploadStatus.READY) {
      throw new BadRequestException('Upload session has already been completed');
    }

    if (new Date() > session.expiresAt) {
      await this.prisma.documentUploadSession.update({
        where: { id: sessionId },
        data: { status: DocumentUploadStatus.EXPIRED, errorMessage: 'Upload session expired' },
      });
      throw new BadRequestException('Upload session has expired');
    }

    // Validate size
    this.validator.validateFileSize(fileBuffer.length);

    // Validate magic bytes
    const metadata = (session.metadata as any) || {};
    const format = (metadata.fileFormat || DocumentFileFormat.PDF) as DocumentFileFormat;
    const isValidBytes = this.validator.validateMagicBytes(fileBuffer, format);
    if (!isValidBytes) {
      await this.prisma.documentUploadSession.update({
        where: { id: sessionId },
        data: {
          status: DocumentUploadStatus.REJECTED,
          errorMessage: `File content does not match declared format ${format}`,
        },
      });
      throw new BadRequestException(
        `File magic byte signature does not match declared format ${format}`,
      );
    }

    // Compute checksum
    const checksumSha256 = this.storage.computeSha256(fileBuffer);

    // Upload to MinIO quarantine
    await this.storage.putObject(
      this.storage.documentsBucket,
      session.storageKey,
      fileBuffer,
      fileBuffer.length,
      {
        'content-type': session.declaredMimeType,
        'x-buildmind-session-id': session.id,
        'x-buildmind-checksum': checksumSha256,
      },
    );

    // Update session status to QUARANTINED
    this.logger.log(`Direct upload completed for session ${sessionId} by user ${userId}`);
    const updated = await this.prisma.documentUploadSession.update({
      where: { id: sessionId },
      data: {
        status: DocumentUploadStatus.QUARANTINED,
        checksumSha256,
        actualSizeBytes: BigInt(fileBuffer.length),
      },
    });

    return this.mapUploadSession(updated);
  }

  /**
   * Finalizes and completes the upload session, creating Document and linking to Spatial/WBS nodes
   */
  async completeUploadSession(
    organizationId: string,
    projectId: string,
    userId: string,
    dto: CompleteUploadSessionDto,
  ): Promise<DocumentDetails> {
    const session = await this.prisma.documentUploadSession.findFirst({
      where: { id: dto.sessionId, projectId, organizationId },
    });

    if (!session) {
      throw new NotFoundException('Upload session not found');
    }

    // Idempotency: if already completed and linked to a document, return the existing document
    if (session.status === DocumentUploadStatus.READY && session.documentId) {
      return this.findOne(organizationId, projectId, session.documentId);
    }

    if (session.status !== DocumentUploadStatus.QUARANTINED) {
      throw new BadRequestException(
        `Session is in status ${session.status}. File must be uploaded before completion.`,
      );
    }

    if (new Date() > session.expiresAt) {
      throw new BadRequestException('Upload session has expired');
    }

    // Verify SHA-256 match
    if (
      session.checksumSha256 &&
      session.checksumSha256.toLowerCase() !== dto.checksumSha256.toLowerCase()
    ) {
      await this.prisma.documentUploadSession.update({
        where: { id: session.id },
        data: {
          status: DocumentUploadStatus.FAILED,
          errorMessage: 'Checksum verification mismatch',
        },
      });
      throw new BadRequestException('Checksum verification mismatch');
    }

    const sessionMeta = (session.metadata as any) || {};
    const reference = dto.reference || sessionMeta.reference || `DOC-${Date.now().toString().slice(-6)}`;
    const title = dto.title || sessionMeta.title || session.declaredFilename;
    const description = dto.description !== undefined ? dto.description : sessionMeta.description;
    const category = dto.category || session.category;
    const discipline = dto.discipline || session.discipline;
    const format = sessionMeta.fileFormat || DocumentFileFormat.PDF;
    const spatialNodeIds: string[] = dto.spatialNodeIds || sessionMeta.spatialNodeIds || [];
    const workPackageIds: string[] = dto.workPackageIds || sessionMeta.workPackageIds || [];
    const actualBytes = session.actualSizeBytes || session.declaredSizeBytes;

    // Verify spatial node IDs belong to this project
    if (spatialNodeIds.length > 0) {
      const validNodesCount = await this.prisma.spatialNode.count({
        where: { id: { in: spatialNodeIds }, projectId },
      });
      if (validNodesCount !== spatialNodeIds.length) {
        throw new BadRequestException('Cannot link document to spatial node from a different project');
      }
    }

    // Verify work package IDs belong to this project
    if (workPackageIds.length > 0) {
      const validPackagesCount = await this.prisma.workPackage.count({
        where: { id: { in: workPackageIds }, projectId },
      });
      if (validPackagesCount !== workPackageIds.length) {
        throw new BadRequestException('Cannot link document to work package from a different project');
      }
    }

    // Check unique reference in project
    const existingDoc = await this.prisma.document.findUnique({
      where: {
        projectId_reference: {
          projectId,
          reference,
        },
      },
    });
    if (existingDoc) {
      throw new ConflictException(`Document reference "${reference}" already exists in this project`);
    }

    const documentId = crypto.randomUUID();
    const permanentKey = this.storage.getDocumentKey(
      organizationId,
      projectId,
      documentId,
      session.declaredFilename,
    );

    // Move file from quarantine to permanent key in MinIO
    await this.storage.copyObject(
      this.storage.documentsBucket,
      session.storageKey,
      this.storage.documentsBucket,
      permanentKey,
    );
    // Cleanup quarantine object
    await this.storage.removeObject(this.storage.documentsBucket, session.storageKey);

    // Transactionally create document and links
    const document = await this.prisma.$transaction(async (tx) => {
      const doc = await tx.document.create({
        data: {
          id: documentId,
          organizationId,
          projectId,
          reference,
          title,
          description,
          category,
          discipline,
          originalFilename: session.declaredFilename,
          fileFormat: format,
          mimeType: session.declaredMimeType,
          fileSizeBytes: actualBytes,
          storageObjectKey: permanentKey,
          checksumSha256: session.checksumSha256 || dto.checksumSha256,
          uploadStatus: DocumentUploadStatus.READY,
          securityScanStatus: DocumentScanStatus.CLEAN,
          uploadedById: userId,
          metadata: dto.metadata || sessionMeta.clientMetadata || {},
        },
      });

      // Create spatial links
      if (spatialNodeIds.length > 0) {
        await tx.documentSpatialLink.createMany({
          data: spatialNodeIds.map((nodeId) => ({
            documentId: doc.id,
            spatialNodeId: nodeId,
          })),
        });
      }

      // Create work package links
      if (workPackageIds.length > 0) {
        await tx.documentWorkPackageLink.createMany({
          data: workPackageIds.map((pkgId) => ({
            documentId: doc.id,
            workPackageId: pkgId,
          })),
        });
      }

      // Update session
      await tx.documentUploadSession.update({
        where: { id: session.id },
        data: {
          status: DocumentUploadStatus.READY,
          documentId: doc.id,
          completedAt: new Date(),
        },
      });

      return doc;
    });

    // Audit log
    await this.auditService.logEvent(userId, 'DOCUMENT_UPLOAD_COMPLETED', undefined, {
      organizationId,
      projectId,
      documentId: document.id,
      reference: document.reference,
      filename: document.originalFilename,
      bytes: document.fileSizeBytes.toString(),
    });

    return this.findOne(organizationId, projectId, document.id);
  }

  /**
   * Cancels an upload session and cleans up quarantine
   */
  async cancelUploadSession(
    organizationId: string,
    projectId: string,
    sessionId: string,
    userId: string,
  ): Promise<{ message: string }> {
    const session = await this.prisma.documentUploadSession.findFirst({
      where: { id: sessionId, projectId, organizationId },
    });

    if (!session) {
      throw new NotFoundException('Upload session not found');
    }

    if (session.status === DocumentUploadStatus.READY) {
      throw new BadRequestException('Cannot cancel an already completed upload session');
    }

    // Clean up MinIO quarantine object
    await this.storage.removeObject(this.storage.documentsBucket, session.storageKey);

    // Update status
    await this.prisma.documentUploadSession.update({
      where: { id: sessionId },
      data: {
        status: DocumentUploadStatus.FAILED,
        errorMessage: 'Cancelled by user',
      },
    });

    await this.auditService.logEvent(userId, 'DOCUMENT_UPLOAD_CANCELLED', undefined, {
      organizationId,
      projectId,
      sessionId,
    });

    return { message: 'Upload session cancelled successfully' };
  }

  // ==========================================
  // 2. Document Query & Management
  // ==========================================

  /**
   * Lists documents in a project with filtering & pagination
   */
  async findAll(
    organizationId: string,
    projectId: string,
    query: DocumentQueryDto,
  ): Promise<{
    items: DocumentSummary[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    await this.getVerifiedProject(organizationId, projectId);

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {
      organizationId,
      projectId,
    };

    if (!query.includeArchived) {
      where.archivedAt = null;
    }

    if (query.category) {
      where.category = query.category;
    }

    if (query.discipline) {
      where.discipline = query.discipline;
    }

    if (query.fileFormat) {
      where.fileFormat = query.fileFormat;
    }

    if (query.uploadStatus) {
      where.uploadStatus = query.uploadStatus;
    }

    if (query.spatialNodeId) {
      where.spatialLinks = {
        some: { spatialNodeId: query.spatialNodeId },
      };
    }

    if (query.workPackageId) {
      where.workPackageLinks = {
        some: { workPackageId: query.workPackageId },
      };
    }

    if (query.search) {
      const term = query.search.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { reference: { contains: term, mode: 'insensitive' } },
        { originalFilename: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        include: {
          uploadedBy: {
            select: { id: true, email: true, fullName: true },
          },
          _count: {
            select: {
              spatialLinks: true,
              workPackageLinks: true,
            },
          },
        },
        orderBy: { createdAt: query.sortOrder === 'asc' ? 'asc' : 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.document.count({ where }),
    ]);

    return {
      items: items.map((doc) => this.mapDocument(doc)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Retrieves full document details with linked spatial nodes & work packages
   */
  async findOne(
    organizationId: string,
    projectId: string,
    documentId: string,
  ): Promise<DocumentDetails> {
    await this.getVerifiedProject(organizationId, projectId);

    const doc = await this.prisma.document.findFirst({
      where: { id: documentId, projectId, organizationId },
      include: {
        uploadedBy: {
          select: { id: true, email: true, fullName: true },
        },
        spatialLinks: {
          include: {
            spatialNode: {
              select: { id: true, name: true, code: true, nodeType: true },
            },
          },
        },
        workPackageLinks: {
          include: {
            workPackage: {
              select: { id: true, name: true, code: true },
            },
          },
        },
      },
    });

    if (!doc) {
      throw new NotFoundException(`Document not found`);
    }

    const base = this.mapDocument(doc);
    return {
      ...base,
      spatialLinks: doc.spatialLinks.map((sl) => ({
        id: sl.id,
        spatialNodeId: sl.spatialNodeId,
        spatialNode: {
          id: sl.spatialNode.id,
          name: sl.spatialNode.name,
          code: sl.spatialNode.code,
          nodeType: sl.spatialNode.nodeType,
        },
      })),
      workPackageLinks: doc.workPackageLinks.map((wl) => ({
        id: wl.id,
        workPackageId: wl.workPackageId,
        workPackage: {
          id: wl.workPackage.id,
          name: wl.workPackage.name,
          code: wl.workPackage.code,
        },
      })),
    };
  }

  /**
   * Updates document metadata
   */
  async update(
    organizationId: string,
    projectId: string,
    documentId: string,
    dto: UpdateDocumentDto,
    userId: string,
  ): Promise<DocumentDetails> {
    await this.getVerifiedProject(organizationId, projectId);

    const existing = await this.prisma.document.findFirst({
      where: { id: documentId, projectId, organizationId },
    });
    if (!existing) {
      throw new NotFoundException('Document not found');
    }

    if (dto.reference && dto.reference !== existing.reference) {
      const conflict = await this.prisma.document.findUnique({
        where: {
          projectId_reference: {
            projectId,
            reference: dto.reference,
          },
        },
      });
      if (conflict) {
        throw new ConflictException(
          `Document reference "${dto.reference}" already exists in this project`,
        );
      }
    }

    await this.prisma.document.update({
      where: { id: documentId },
      data: {
        title: dto.title ?? existing.title,
        reference: dto.reference ?? existing.reference,
        description: dto.description !== undefined ? dto.description : existing.description,
        category: dto.category ?? existing.category,
        discipline: dto.discipline ?? existing.discipline,
        metadata: dto.metadata !== undefined ? dto.metadata : (existing.metadata as any),
      },
    });

    await this.auditService.logEvent(userId, 'DOCUMENT_UPDATED', undefined, {
      organizationId,
      projectId,
      documentId,
      updates: dto,
    });

    return this.findOne(organizationId, projectId, documentId);
  }

  /**
   * Archives a document (soft delete)
   */
  async archive(
    organizationId: string,
    projectId: string,
    documentId: string,
    userId: string,
  ): Promise<DocumentDetails> {
    await this.getVerifiedProject(organizationId, projectId);

    const doc = await this.prisma.document.findFirst({
      where: { id: documentId, projectId, organizationId },
    });
    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    await this.prisma.document.update({
      where: { id: documentId },
      data: { archivedAt: new Date() },
    });

    await this.auditService.logEvent(userId, 'DOCUMENT_ARCHIVED', undefined, {
      organizationId,
      projectId,
      documentId,
    });

    return this.findOne(organizationId, projectId, documentId);
  }

  /**
   * Restores an archived document
   */
  async restore(
    organizationId: string,
    projectId: string,
    documentId: string,
    userId: string,
  ): Promise<DocumentDetails> {
    await this.getVerifiedProject(organizationId, projectId);

    const doc = await this.prisma.document.findFirst({
      where: { id: documentId, projectId, organizationId },
    });
    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    await this.prisma.document.update({
      where: { id: documentId },
      data: { archivedAt: null },
    });

    await this.auditService.logEvent(userId, 'DOCUMENT_RESTORED', undefined, {
      organizationId,
      projectId,
      documentId,
    });

    return this.findOne(organizationId, projectId, documentId);
  }

  /**
   * Updates spatial and work package links for a document
   */
  async updateLinks(
    organizationId: string,
    projectId: string,
    documentId: string,
    dto: UpdateDocumentLinksDto,
    userId: string,
  ): Promise<DocumentDetails> {
    await this.getVerifiedProject(organizationId, projectId);

    const doc = await this.prisma.document.findFirst({
      where: { id: documentId, projectId, organizationId },
    });
    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    // Validate spatial nodes belong to project
    if (dto.spatialNodeIds && dto.spatialNodeIds.length > 0) {
      const validNodesCount = await this.prisma.spatialNode.count({
        where: { id: { in: dto.spatialNodeIds }, projectId },
      });
      if (validNodesCount !== dto.spatialNodeIds.length) {
        throw new BadRequestException('Cannot link document to spatial node from a different project');
      }
    }

    // Validate work packages belong to project
    if (dto.workPackageIds && dto.workPackageIds.length > 0) {
      const validPackagesCount = await this.prisma.workPackage.count({
        where: { id: { in: dto.workPackageIds }, projectId },
      });
      if (validPackagesCount !== dto.workPackageIds.length) {
        throw new BadRequestException('Cannot link document to work package from a different project');
      }
    }

    await this.prisma.$transaction(async (tx) => {
      if (dto.spatialNodeIds !== undefined) {
        await tx.documentSpatialLink.deleteMany({
          where: { documentId },
        });
        if (dto.spatialNodeIds.length > 0) {
          await tx.documentSpatialLink.createMany({
            data: dto.spatialNodeIds.map((nodeId) => ({
              documentId,
              spatialNodeId: nodeId,
            })),
          });
        }
      }

      if (dto.workPackageIds !== undefined) {
        await tx.documentWorkPackageLink.deleteMany({
          where: { documentId },
        });
        if (dto.workPackageIds.length > 0) {
          await tx.documentWorkPackageLink.createMany({
            data: dto.workPackageIds.map((pkgId) => ({
              documentId,
              workPackageId: pkgId,
            })),
          });
        }
      }
    });

    await this.auditService.logEvent(userId, 'DOCUMENT_LINKS_UPDATED', undefined, {
      organizationId,
      projectId,
      documentId,
    });

    return this.findOne(organizationId, projectId, documentId);
  }

  /**
   * Retrieves download stream & metadata
   */
  async getDownloadStream(
    organizationId: string,
    projectId: string,
    documentId: string,
  ) {
    await this.getVerifiedProject(organizationId, projectId);

    const doc = await this.prisma.document.findFirst({
      where: { id: documentId, projectId, organizationId },
    });
    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    const stream = await this.storage.getObject(
      this.storage.documentsBucket,
      doc.storageObjectKey,
    );

    return {
      stream,
      filename: doc.originalFilename,
      mimeType: doc.mimeType,
      fileSizeBytes: doc.fileSizeBytes.toString(),
      checksumSha256: doc.checksumSha256,
    };
  }

  /**
   * Generates presigned download URL
   */
  async getDownloadUrl(
    organizationId: string,
    projectId: string,
    documentId: string,
  ): Promise<{ downloadUrl: string; filename: string; expiresInSeconds: number }> {
    await this.getVerifiedProject(organizationId, projectId);

    const doc = await this.prisma.document.findFirst({
      where: { id: documentId, projectId, organizationId },
    });
    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    const expiresInSeconds = 3600;
    const downloadUrl = await this.storage.getPresignedDownloadUrl(
      this.storage.documentsBucket,
      doc.storageObjectKey,
      expiresInSeconds,
      doc.originalFilename,
    );

    return {
      downloadUrl,
      filename: doc.originalFilename,
      expiresInSeconds,
    };
  }

  /**
   * Calculates project storage usage metrics
   */
  async getStorageUsage(organizationId: string, projectId: string): Promise<StorageUsageSummary> {
    await this.getVerifiedProject(organizationId, projectId);

    const [docs, totalSessions] = await Promise.all([
      this.prisma.document.findMany({
        where: { organizationId, projectId, archivedAt: null },
        select: { category: true, fileFormat: true, fileSizeBytes: true },
      }),
      this.prisma.documentUploadSession.count({
        where: { organizationId, projectId },
      }),
    ]);

    let totalBytes = BigInt(0);
    const categoryMap: Record<string, { count: number; bytes: bigint }> = {};
    const formatMap: Record<string, { count: number; bytes: bigint }> = {};

    for (const d of docs) {
      totalBytes += d.fileSizeBytes;

      if (!categoryMap[d.category]) {
        categoryMap[d.category] = { count: 0, bytes: BigInt(0) };
      }
      categoryMap[d.category].count += 1;
      categoryMap[d.category].bytes += d.fileSizeBytes;

      if (!formatMap[d.fileFormat]) {
        formatMap[d.fileFormat] = { count: 0, bytes: BigInt(0) };
      }
      formatMap[d.fileFormat].count += 1;
      formatMap[d.fileFormat].bytes += d.fileSizeBytes;
    }

    const formatBytes = (bytes: bigint): string => {
      const num = Number(bytes);
      if (num < 1024) return `${num} B`;
      if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
      if (num < 1024 * 1024 * 1024) return `${(num / (1024 * 1024)).toFixed(1)} MB`;
      return `${(num / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    };

    return {
      totalBytes: totalBytes.toString(),
      totalBytesFormatted: formatBytes(totalBytes),
      totalDocuments: docs.length,
      totalUploadSessions: totalSessions,
      byCategory: Object.entries(categoryMap).map(([category, stats]) => ({
        category,
        count: stats.count,
        bytes: stats.bytes.toString(),
      })),
      byFormat: Object.entries(formatMap).map(([format, stats]) => ({
        format,
        count: stats.count,
        bytes: stats.bytes.toString(),
      })),
    };
  }
}
