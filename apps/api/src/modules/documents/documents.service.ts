import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
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
  DocumentWorkflowStatus,
  DrawingType,
  SheetSize,
  IssuePurpose,
  ReviewDecision,
  ReviewStatus,
  TransmittalStatus,
  DocumentSummary,
  DocumentDetails,
  DocumentVersionSummary,
  DrawingMetadataSummary,
  DocumentReviewSummary,
  TransmittalSummary,
  VersionComparisonDiff,
  DocumentUploadSessionSummary,
  StorageUsageSummary,
} from '@buildmind/shared-types';
import {
  CreateUploadSessionDto,
  CompleteUploadSessionDto,
  UpdateDocumentDto,
  UpdateDocumentLinksDto,
  DocumentQueryDto,
  CreateVersionDto,
  SubmitReviewDto,
  ReviewDecisionDto,
  CreateDrawingDto,
  UpdateDrawingDto,
  DrawingQueryDto,
  CreateTransmittalDto,
  TransmittalQueryDto,
} from './dto';

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
      latestVersionId: doc.latestVersionId,
      currentPublishedVersionId: doc.currentPublishedVersionId,
      currentRevisionCode: doc.currentRevisionCode || '01',
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
      versionCount: doc._count?.versions ?? (doc.versions ? doc.versions.length : 1),
      drawingMetadata: doc.drawingMetadata ? this.mapDrawing(doc.drawingMetadata) : null,
      currentPublishedVersion: doc.currentPublishedVersion
        ? this.mapVersion(doc.currentPublishedVersion)
        : null,
      latestVersion: doc.latestVersion ? this.mapVersion(doc.latestVersion) : null,
    };
  }

  public mapVersion(v: any): DocumentVersionSummary {
    return {
      id: v.id,
      organizationId: v.organizationId,
      projectId: v.projectId,
      documentId: v.documentId,
      versionNumber: v.versionNumber,
      revisionCode: v.revisionCode,
      title: v.title,
      description: v.description,
      originalFilename: v.originalFilename,
      fileFormat: v.fileFormat as DocumentFileFormat,
      mimeType: v.mimeType,
      fileSizeBytes: v.fileSizeBytes.toString(),
      storageObjectKey: v.storageObjectKey,
      checksumSha256: v.checksumSha256,
      uploadStatus: v.uploadStatus as DocumentUploadStatus,
      securityScanStatus: v.securityScanStatus as DocumentScanStatus,
      workflowStatus: v.workflowStatus as DocumentWorkflowStatus,
      uploadedById: v.uploadedById,
      uploadedBy: v.uploadedBy
        ? {
            id: v.uploadedBy.id,
            email: v.uploadedBy.email,
            fullName: v.uploadedBy.fullName,
          }
        : undefined,
      metadata: v.metadata,
      createdAt: v.createdAt.toISOString(),
      submittedAt: v.submittedAt ? v.submittedAt.toISOString() : null,
      approvedAt: v.approvedAt ? v.approvedAt.toISOString() : null,
      publishedAt: v.publishedAt ? v.publishedAt.toISOString() : null,
      supersededAt: v.supersededAt ? v.supersededAt.toISOString() : null,
      archivedAt: v.archivedAt ? v.archivedAt.toISOString() : null,
      spatialLinks: v.spatialLinks?.map((sl: any) => ({
        id: sl.id,
        spatialNodeId: sl.spatialNodeId,
        spatialNode: sl.spatialNode,
      })),
      workPackageLinks: v.workPackageLinks?.map((wl: any) => ({
        id: wl.id,
        workPackageId: wl.workPackageId,
        workPackage: wl.workPackage,
      })),
      reviewCount: v._count?.reviews ?? (v.reviews ? v.reviews.length : 0),
    };
  }

  public mapDrawing(d: any): DrawingMetadataSummary {
    return {
      id: d.id,
      organizationId: d.organizationId,
      projectId: d.projectId,
      documentId: d.documentId,
      drawingNumber: d.drawingNumber,
      drawingTitle: d.drawingTitle,
      discipline: d.discipline as DocumentDiscipline,
      drawingType: d.drawingType as DrawingType,
      originator: d.originator,
      sheetNumber: d.sheetNumber,
      sheetSize: d.sheetSize as SheetSize,
      declaredScale: d.declaredScale,
      issuePurpose: d.issuePurpose as IssuePurpose,
      status: d.status,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
      document: d.document ? this.mapDocument(d.document) : undefined,
      currentRevisionCode: d.document?.currentRevisionCode || '01',
      currentPublishedVersion: d.document?.currentPublishedVersion
        ? this.mapVersion(d.document.currentPublishedVersion)
        : null,
      latestVersion: d.document?.latestVersion ? this.mapVersion(d.document.latestVersion) : null,
      workflowStatus:
        (d.document?.currentPublishedVersion?.workflowStatus as DocumentWorkflowStatus) ||
        (d.document?.latestVersion?.workflowStatus as DocumentWorkflowStatus) ||
        DocumentWorkflowStatus.PUBLISHED,
    };
  }

  public mapReview(r: any): DocumentReviewSummary {
    return {
      id: r.id,
      organizationId: r.organizationId,
      projectId: r.projectId,
      documentId: r.documentId,
      versionId: r.versionId,
      assignedReviewerId: r.assignedReviewerId,
      requestedById: r.requestedById,
      status: r.status as ReviewStatus,
      dueAt: r.dueAt ? r.dueAt.toISOString() : null,
      comments: r.comments,
      decisionNote: r.decisionNote,
      completedAt: r.completedAt ? r.completedAt.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      document: r.document ? this.mapDocument(r.document) : undefined,
      version: r.version ? this.mapVersion(r.version) : undefined,
      assignedReviewer: r.assignedReviewer
        ? {
            id: r.assignedReviewer.id,
            email: r.assignedReviewer.email,
            fullName: r.assignedReviewer.fullName,
          }
        : undefined,
      requestedBy: r.requestedBy
        ? {
            id: r.requestedBy.id,
            email: r.requestedBy.email,
            fullName: r.requestedBy.fullName,
          }
        : undefined,
    };
  }

  public mapTransmittal(t: any): TransmittalSummary {
    return {
      id: t.id,
      organizationId: t.organizationId,
      projectId: t.projectId,
      reference: t.reference,
      subject: t.subject,
      senderUserId: t.senderUserId,
      authorizedRecipients: t.authorizedRecipients || [],
      issuePurpose: t.issuePurpose as IssuePurpose,
      issueDate: t.issueDate.toISOString(),
      status: t.status as TransmittalStatus,
      notes: t.notes,
      createdById: t.createdById,
      issuedAt: t.issuedAt ? t.issuedAt.toISOString() : null,
      cancelledAt: t.cancelledAt ? t.cancelledAt.toISOString() : null,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      sender: t.sender
        ? {
            id: t.sender.id,
            email: t.sender.email,
            fullName: t.sender.fullName,
          }
        : undefined,
      createdBy: t.createdBy
        ? {
            id: t.createdBy.id,
            email: t.createdBy.email,
            fullName: t.createdBy.fullName,
          }
        : undefined,
      itemCount: t._count?.items ?? (t.items ? t.items.length : 0),
      items: t.items?.map((item: any) => ({
        id: item.id,
        transmittalId: item.transmittalId,
        documentId: item.documentId,
        documentVersionId: item.documentVersionId,
        drawingNumber: item.drawingNumber,
        documentReference: item.documentReference,
        revisionCode: item.revisionCode,
        title: item.title,
        fileFormat: item.fileFormat,
        sheetSize: item.sheetSize,
        declaredScale: item.declaredScale,
        createdAt: item.createdAt.toISOString(),
      })),
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

    // Transactionally create document, initial version, and links
    const document = await this.prisma.$transaction(async (tx) => {
      const initialVersionId = crypto.randomUUID();

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

      // Create initial DocumentVersion (v1, rev '01', PUBLISHED)
      await tx.documentVersion.create({
        data: {
          id: initialVersionId,
          organizationId,
          projectId,
          documentId: doc.id,
          versionNumber: 1,
          revisionCode: '01',
          title: doc.title,
          description: doc.description,
          originalFilename: doc.originalFilename,
          fileFormat: doc.fileFormat,
          mimeType: doc.mimeType,
          fileSizeBytes: doc.fileSizeBytes,
          storageObjectKey: doc.storageObjectKey,
          checksumSha256: doc.checksumSha256,
          uploadStatus: DocumentUploadStatus.READY,
          securityScanStatus: doc.securityScanStatus,
          workflowStatus: DocumentWorkflowStatus.PUBLISHED,
          uploadedById: userId,
          createdAt: new Date(),
          publishedAt: new Date(),
        },
      });

      // Point document to initial version
      await tx.document.update({
        where: { id: doc.id },
        data: {
          latestVersionId: initialVersionId,
          currentPublishedVersionId: initialVersionId,
          currentRevisionCode: '01',
        },
      });

      // Create spatial links for document & version
      if (spatialNodeIds.length > 0) {
        await tx.documentSpatialLink.createMany({
          data: spatialNodeIds.map((nodeId) => ({
            documentId: doc.id,
            spatialNodeId: nodeId,
          })),
        });
        await tx.documentVersionSpatialLink.createMany({
          data: spatialNodeIds.map((nodeId) => ({
            versionId: initialVersionId,
            spatialNodeId: nodeId,
          })),
        });
      }

      // Create work package links for document & version
      if (workPackageIds.length > 0) {
        await tx.documentWorkPackageLink.createMany({
          data: workPackageIds.map((pkgId) => ({
            documentId: doc.id,
            workPackageId: pkgId,
          })),
        });
        await tx.documentVersionWorkPackageLink.createMany({
          data: workPackageIds.map((pkgId) => ({
            versionId: initialVersionId,
            workPackageId: pkgId,
          })),
        });
      }

      // Seed drawing register if drawing category or CAD format
      const isDrawing =
        category.includes('DRAWING') ||
        ['DWG', 'DXF', 'PDF'].includes(format.toUpperCase());

      if (isDrawing) {
        await tx.drawingMetadata.create({
          data: {
            organizationId,
            projectId,
            documentId: doc.id,
            drawingNumber: reference,
            drawingTitle: title,
            discipline: discipline || 'ARCHITECTURE',
            drawingType: 'FLOOR_PLAN',
            sheetSize: 'A1',
            issuePurpose: 'FOR_INFORMATION',
            status: 'ACTIVE',
          },
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
    const limit = Math.min(100, Math.max(1, Number(query.limit || query.pageSize) || 20));
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
        drawingMetadata: true,
        currentPublishedVersion: {
          include: {
            uploadedBy: { select: { id: true, email: true, fullName: true } },
          },
        },
        latestVersion: {
          include: {
            uploadedBy: { select: { id: true, email: true, fullName: true } },
          },
        },
        versions: {
          include: {
            uploadedBy: { select: { id: true, email: true, fullName: true } },
            spatialLinks: {
              include: {
                spatialNode: { select: { id: true, name: true, code: true, nodeType: true } },
              },
            },
            workPackageLinks: {
              include: {
                workPackage: { select: { id: true, name: true, code: true } },
              },
            },
            _count: { select: { reviews: true } },
          },
          orderBy: { versionNumber: 'desc' },
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
      versions: doc.versions?.map((v: any) => this.mapVersion(v)),
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

  // ==========================================
  // Phase 3C: Version Lifecycle & Management
  // ==========================================

  /**
   * Uploads and attaches a new immutable version/revision to an existing document
   */
  async createVersion(
    organizationId: string,
    projectId: string,
    documentId: string,
    userId: string,
    dto: CreateVersionDto,
    fileBuffer?: Buffer,
    fileMeta?: { originalname: string; mimetype: string },
  ): Promise<DocumentVersionSummary> {
    await this.getVerifiedProject(organizationId, projectId);

    const document = await this.prisma.document.findFirst({
      where: { id: documentId, projectId, organizationId },
      include: {
        latestVersion: true,
        currentPublishedVersion: true,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Check revisionCode uniqueness within this document
    const existingRevision = await this.prisma.documentVersion.findUnique({
      where: {
        documentId_revisionCode: {
          documentId,
          revisionCode: dto.revisionCode,
        },
      },
    });

    if (existingRevision) {
      throw new ConflictException(
        `Revision code "${dto.revisionCode}" already exists for this document`,
      );
    }

    // Determine sequential version number
    const maxVersion = await this.prisma.documentVersion.findFirst({
      where: { documentId },
      orderBy: { versionNumber: 'desc' },
      select: { versionNumber: true },
    });
    const nextVersionNumber = (maxVersion?.versionNumber ?? 0) + 1;

    let storageKey: string;
    let checksumSha256: string;
    let fileSizeBytes: bigint;
    let originalFilename: string;
    let mimeType: string;
    let fileFormat: DocumentFileFormat;
    let scanStatus: DocumentScanStatus = DocumentScanStatus.NOT_SCANNED;

    if (fileBuffer && fileMeta) {
      originalFilename = this.validator.sanitizeFilename(fileMeta.originalname);
      const extValidation = this.validator.validateExtension(originalFilename);
      fileFormat = extValidation.format;
      mimeType = fileMeta.mimetype || this.validator.getMimeTypeForFormat(fileFormat);

      this.validator.validateFileSize(fileBuffer.length);
      const isValidBytes = this.validator.validateMagicBytes(fileBuffer, fileFormat);
      if (!isValidBytes) {
        throw new BadRequestException(
          `File magic byte signature does not match declared format ${fileFormat}`,
        );
      }

      checksumSha256 = this.storage.computeSha256(fileBuffer);
      fileSizeBytes = BigInt(fileBuffer.length);
      scanStatus = await this.validator.scanFile(fileBuffer);

      storageKey = this.storage.getDocumentVersionKey(
        organizationId,
        projectId,
        documentId,
        nextVersionNumber,
        originalFilename,
      );

      await this.storage.putObject(
        this.storage.documentsBucket,
        storageKey,
        fileBuffer,
        fileBuffer.length,
        {
          'content-type': mimeType,
          'x-buildmind-document-id': documentId,
          'x-buildmind-version': nextVersionNumber.toString(),
          'x-buildmind-revision': dto.revisionCode,
          'x-buildmind-checksum': checksumSha256,
        },
      );
    } else {
      // Inherit file reference from previous version
      const baseVersion = document.latestVersion || document.currentPublishedVersion;
      if (baseVersion) {
        storageKey = baseVersion.storageObjectKey;
        checksumSha256 = baseVersion.checksumSha256;
        fileSizeBytes = baseVersion.fileSizeBytes;
        originalFilename = baseVersion.originalFilename;
        mimeType = baseVersion.mimeType;
        fileFormat = baseVersion.fileFormat as DocumentFileFormat;
        scanStatus = baseVersion.securityScanStatus as DocumentScanStatus;
      } else {
        storageKey = document.storageObjectKey;
        checksumSha256 = document.checksumSha256;
        fileSizeBytes = document.fileSizeBytes;
        originalFilename = document.originalFilename;
        mimeType = document.mimeType;
        fileFormat = document.fileFormat as DocumentFileFormat;
        scanStatus = document.securityScanStatus as DocumentScanStatus;
      }
    }

    const version = await this.prisma.$transaction(async (tx) => {
      const v = await tx.documentVersion.create({
        data: {
          organizationId,
          projectId,
          documentId,
          versionNumber: nextVersionNumber,
          revisionCode: dto.revisionCode,
          title: dto.title || document.title,
          description: dto.description !== undefined ? dto.description : document.description,
          originalFilename,
          fileFormat,
          mimeType,
          fileSizeBytes,
          storageObjectKey: storageKey,
          checksumSha256,
          uploadStatus: DocumentUploadStatus.READY,
          securityScanStatus: scanStatus,
          workflowStatus: DocumentWorkflowStatus.DRAFT,
          uploadedById: userId,
          metadata: {
            changeNote: dto.changeNote,
            declaredScale: dto.declaredScale,
          },
        },
        include: {
          uploadedBy: { select: { id: true, email: true, fullName: true } },
        },
      });

      // Spatial links
      if (dto.spatialNodeIds && dto.spatialNodeIds.length > 0) {
        await tx.documentVersionSpatialLink.createMany({
          data: dto.spatialNodeIds.map((nodeId) => ({
            versionId: v.id,
            spatialNodeId: nodeId,
          })),
        });
      }

      // Work package links
      if (dto.workPackageIds && dto.workPackageIds.length > 0) {
        await tx.documentVersionWorkPackageLink.createMany({
          data: dto.workPackageIds.map((pkgId) => ({
            versionId: v.id,
            workPackageId: pkgId,
          })),
        });
      }

      // Update parent document's latestVersionId (does not overwrite published version)
      await tx.document.update({
        where: { id: documentId },
        data: {
          latestVersionId: v.id,
        },
      });

      return v;
    });

    await this.auditService.logEvent(userId, 'DOCUMENT_VERSION_CREATED', undefined, {
      organizationId,
      projectId,
      documentId,
      versionId: version.id,
      versionNumber: nextVersionNumber,
      revisionCode: dto.revisionCode,
    });

    return this.mapVersion(version);
  }

  /**
   * Lists all immutable versions for a document
   */
  async listVersions(
    organizationId: string,
    projectId: string,
    documentId: string,
  ): Promise<DocumentVersionSummary[]> {
    await this.getVerifiedProject(organizationId, projectId);

    const doc = await this.prisma.document.findFirst({
      where: { id: documentId, projectId, organizationId },
    });
    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    const versions = await this.prisma.documentVersion.findMany({
      where: { documentId, projectId, organizationId },
      include: {
        uploadedBy: { select: { id: true, email: true, fullName: true } },
        spatialLinks: {
          include: {
            spatialNode: { select: { id: true, name: true, code: true, nodeType: true } },
          },
        },
        workPackageLinks: {
          include: {
            workPackage: { select: { id: true, name: true, code: true } },
          },
        },
        _count: { select: { reviews: true } },
      },
      orderBy: { versionNumber: 'desc' },
    });

    return versions.map((v) => this.mapVersion(v));
  }

  /**
   * Retrieves single document version details
   */
  async getVersion(
    organizationId: string,
    projectId: string,
    documentId: string,
    versionId: string,
  ): Promise<DocumentVersionSummary> {
    await this.getVerifiedProject(organizationId, projectId);

    const version = await this.prisma.documentVersion.findFirst({
      where: { id: versionId, documentId, projectId, organizationId },
      include: {
        uploadedBy: { select: { id: true, email: true, fullName: true } },
        spatialLinks: {
          include: {
            spatialNode: { select: { id: true, name: true, code: true, nodeType: true } },
          },
        },
        workPackageLinks: {
          include: {
            workPackage: { select: { id: true, name: true, code: true } },
          },
        },
        reviews: {
          include: {
            assignedReviewer: { select: { id: true, email: true, fullName: true } },
            requestedBy: { select: { id: true, email: true, fullName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { reviews: true } },
      },
    });

    if (!version) {
      throw new NotFoundException('Document version not found');
    }

    return this.mapVersion(version);
  }

  /**
   * Streams binary file of a specific historical version
   */
  async getVersionDownloadStream(
    organizationId: string,
    projectId: string,
    documentId: string,
    versionId: string,
  ) {
    await this.getVerifiedProject(organizationId, projectId);

    const version = await this.prisma.documentVersion.findFirst({
      where: { id: versionId, documentId, projectId, organizationId },
    });
    if (!version) {
      throw new NotFoundException('Document version not found');
    }

    const stream = await this.storage.getObject(
      this.storage.documentsBucket,
      version.storageObjectKey,
    );

    return {
      stream,
      filename: version.originalFilename,
      mimeType: version.mimeType,
      fileSizeBytes: version.fileSizeBytes.toString(),
      checksumSha256: version.checksumSha256,
      revisionCode: version.revisionCode,
    };
  }

  /**
   * Presigned download URL for a specific historical version
   */
  async getVersionDownloadUrl(
    organizationId: string,
    projectId: string,
    documentId: string,
    versionId: string,
  ) {
    await this.getVerifiedProject(organizationId, projectId);

    const version = await this.prisma.documentVersion.findFirst({
      where: { id: versionId, documentId, projectId, organizationId },
    });
    if (!version) {
      throw new NotFoundException('Document version not found');
    }

    const expiresInSeconds = 3600;
    const downloadUrl = await this.storage.getPresignedDownloadUrl(
      this.storage.documentsBucket,
      version.storageObjectKey,
      expiresInSeconds,
      version.originalFilename,
    );

    return {
      downloadUrl,
      filename: version.originalFilename,
      expiresInSeconds,
      revisionCode: version.revisionCode,
    };
  }

  /**
   * Metadata & checksum diff comparison between two versions
   */
  async compareVersions(
    organizationId: string,
    projectId: string,
    documentId: string,
    fromVersionId: string,
    toVersionId: string,
  ): Promise<VersionComparisonDiff> {
    await this.getVerifiedProject(organizationId, projectId);

    const [fromVersion, toVersion] = await Promise.all([
      this.getVersion(organizationId, projectId, documentId, fromVersionId),
      this.getVersion(organizationId, projectId, documentId, toVersionId),
    ]);

    const isChecksumIdentical = fromVersion.checksumSha256 === toVersion.checksumSha256;
    const fileSizeDifferenceBytes =
      Number(toVersion.fileSizeBytes) - Number(fromVersion.fileSizeBytes);
    const fileFormatChanged = fromVersion.fileFormat !== toVersion.fileFormat;

    const fromSpatialIds = new Set(fromVersion.spatialLinks?.map((s) => s.spatialNodeId) || []);
    const toSpatialIds = new Set(toVersion.spatialLinks?.map((s) => s.spatialNodeId) || []);

    const addedSpatial = (toVersion.spatialLinks || []).filter(
      (s) => !fromSpatialIds.has(s.spatialNodeId),
    );
    const removedSpatial = (fromVersion.spatialLinks || []).filter(
      (s) => !toSpatialIds.has(s.spatialNodeId),
    );
    const retainedSpatial = (toVersion.spatialLinks || []).filter((s) =>
      fromSpatialIds.has(s.spatialNodeId),
    );

    const fromWbsIds = new Set(fromVersion.workPackageLinks?.map((w) => w.workPackageId) || []);
    const toWbsIds = new Set(toVersion.workPackageLinks?.map((w) => w.workPackageId) || []);

    const addedWbs = (toVersion.workPackageLinks || []).filter(
      (w) => !fromWbsIds.has(w.workPackageId),
    );
    const removedWbs = (fromVersion.workPackageLinks || []).filter(
      (w) => !toWbsIds.has(w.workPackageId),
    );
    const retainedWbs = (toVersion.workPackageLinks || []).filter((w) =>
      fromWbsIds.has(w.workPackageId),
    );

    return {
      documentId,
      fromVersion,
      toVersion,
      isChecksumIdentical,
      fileSizeDifferenceBytes,
      fileFormatChanged,
      metadataDifferences: {
        revisionCode: { from: fromVersion.revisionCode, to: toVersion.revisionCode },
        workflowStatus: { from: fromVersion.workflowStatus, to: toVersion.workflowStatus },
        title: { from: fromVersion.title, to: toVersion.title },
        description: { from: fromVersion.description, to: toVersion.description },
      },
      spatialDifferences: {
        added: addedSpatial.map((s) => ({
          id: s.spatialNodeId,
          name: s.spatialNode?.name || 'Node',
        })),
        removed: removedSpatial.map((s) => ({
          id: s.spatialNodeId,
          name: s.spatialNode?.name || 'Node',
        })),
        retained: retainedSpatial.map((s) => ({
          id: s.spatialNodeId,
          name: s.spatialNode?.name || 'Node',
        })),
      },
      workPackageDifferences: {
        added: addedWbs.map((w) => ({
          id: w.workPackageId,
          code: w.workPackage?.code || '',
          name: w.workPackage?.name || 'Work Package',
        })),
        removed: removedWbs.map((w) => ({
          id: w.workPackageId,
          code: w.workPackage?.code || '',
          name: w.workPackage?.name || 'Work Package',
        })),
        retained: retainedWbs.map((w) => ({
          id: w.workPackageId,
          code: w.workPackage?.code || '',
          name: w.workPackage?.name || 'Work Package',
        })),
      },
    };
  }

  // ==========================================
  // Phase 3C: Workflow State Machine Transitions
  // ==========================================

  /**
   * Submits a DRAFT revision for review
   */
  async submitVersion(
    organizationId: string,
    projectId: string,
    documentId: string,
    versionId: string,
    userId: string,
  ): Promise<DocumentVersionSummary> {
    await this.getVerifiedProject(organizationId, projectId);

    const version = await this.prisma.documentVersion.findFirst({
      where: { id: versionId, documentId, projectId, organizationId },
    });
    if (!version) {
      throw new NotFoundException('Document version not found');
    }

    if (
      version.workflowStatus !== DocumentWorkflowStatus.DRAFT &&
      version.workflowStatus !== DocumentWorkflowStatus.CHANGES_REQUESTED
    ) {
      throw new BadRequestException(
        `Cannot submit version in "${version.workflowStatus}" status. Version must be DRAFT or CHANGES_REQUESTED.`,
      );
    }

    const updated = await this.prisma.documentVersion.update({
      where: { id: versionId },
      data: {
        workflowStatus: DocumentWorkflowStatus.SUBMITTED,
        submittedAt: new Date(),
      },
      include: {
        uploadedBy: { select: { id: true, email: true, fullName: true } },
      },
    });

    await this.auditService.logEvent(userId, 'DOCUMENT_VERSION_SUBMITTED', undefined, {
      organizationId,
      projectId,
      documentId,
      versionId,
      revisionCode: updated.revisionCode,
    });

    return this.mapVersion(updated);
  }

  /**
   * Assigns reviewer and moves version to UNDER_REVIEW
   */
  async requestReview(
    organizationId: string,
    projectId: string,
    documentId: string,
    versionId: string,
    userId: string,
    dto: SubmitReviewDto,
  ): Promise<DocumentReviewSummary> {
    await this.getVerifiedProject(organizationId, projectId);

    const version = await this.prisma.documentVersion.findFirst({
      where: { id: versionId, documentId, projectId, organizationId },
    });
    if (!version) {
      throw new NotFoundException('Document version not found');
    }

    // Verify assigned reviewer is active member of this project, or auto-assign an eligible member
    let reviewerId = dto.assignedReviewerId;
    if (!reviewerId) {
      const candidate =
        (await this.prisma.projectMember.findFirst({
          where: { projectId, userId: { not: version.uploadedById } },
        })) ||
        (await this.prisma.projectMember.findFirst({
          where: { projectId },
        }));
      if (!candidate) {
        throw new BadRequestException('No eligible project members found to assign as reviewer');
      }
      reviewerId = candidate.userId;
    } else {
      const member = await this.prisma.projectMember.findFirst({
        where: { projectId, userId: reviewerId },
      });
      if (!member) {
        throw new BadRequestException('Assigned reviewer is not an active member of this project');
      }
    }

    const review = await this.prisma.$transaction(async (tx) => {
      // Create DocumentReview
      const rev = await tx.documentReview.create({
        data: {
          organizationId,
          projectId,
          documentId,
          versionId,
          assignedReviewerId: reviewerId,
          requestedById: userId,
          status: ReviewStatus.PENDING,
          dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
          comments: dto.comments,
        },
        include: {
          assignedReviewer: { select: { id: true, email: true, fullName: true } },
          requestedBy: { select: { id: true, email: true, fullName: true } },
        },
      });

      // Update version workflow status to UNDER_REVIEW
      await tx.documentVersion.update({
        where: { id: versionId },
        data: {
          workflowStatus: DocumentWorkflowStatus.UNDER_REVIEW,
        },
      });

      return rev;
    });

    await this.auditService.logEvent(userId, 'DOCUMENT_REVIEW_REQUESTED', undefined, {
      organizationId,
      projectId,
      documentId,
      versionId,
      reviewId: review.id,
      assignedReviewerId: dto.assignedReviewerId,
    });

    return this.mapReview(review);
  }

  /**
   * Submits review decision (APPROVED, REJECTED, or CHANGES_REQUESTED)
   */
  async submitReviewDecision(
    organizationId: string,
    projectId: string,
    documentId: string,
    versionId: string,
    reviewerId: string,
    dto: ReviewDecisionDto,
  ): Promise<DocumentReviewSummary> {
    await this.getVerifiedProject(organizationId, projectId);

    const version = await this.prisma.documentVersion.findFirst({
      where: { id: versionId, documentId, projectId, organizationId },
    });
    if (!version) {
      throw new NotFoundException('Document version not found');
    }

    // Segregation of duties: uploader cannot approve their own version
    if (dto.decision === ReviewDecision.APPROVED && version.uploadedById === reviewerId) {
      throw new ForbiddenException(
        'Segregation of duties violation: Document uploader cannot approve their own version',
      );
    }

    // Map decision to target DocumentWorkflowStatus
    let targetWorkflowStatus: DocumentWorkflowStatus;
    if (dto.decision === ReviewDecision.APPROVED) {
      targetWorkflowStatus = DocumentWorkflowStatus.APPROVED;
    } else if (dto.decision === ReviewDecision.REJECTED) {
      targetWorkflowStatus = DocumentWorkflowStatus.REJECTED;
    } else {
      targetWorkflowStatus = DocumentWorkflowStatus.CHANGES_REQUESTED;
    }

    const review = await this.prisma.$transaction(async (tx) => {
      // Find open review or create decision record
      let activeReview = await tx.documentReview.findFirst({
        where: {
          versionId,
          assignedReviewerId: reviewerId,
          status: { in: [ReviewStatus.PENDING, ReviewStatus.IN_REVIEW] },
        },
      });

      if (activeReview) {
        activeReview = await tx.documentReview.update({
          where: { id: activeReview.id },
          data: {
            status: dto.decision as any,
            comments: dto.comments || activeReview.comments,
            decisionNote: dto.decisionNote,
            completedAt: new Date(),
          },
          include: {
            assignedReviewer: { select: { id: true, email: true, fullName: true } },
            requestedBy: { select: { id: true, email: true, fullName: true } },
          },
        });
      } else {
        activeReview = await tx.documentReview.create({
          data: {
            organizationId,
            projectId,
            documentId,
            versionId,
            assignedReviewerId: reviewerId,
            requestedById: reviewerId,
            status: dto.decision as any,
            comments: dto.comments,
            decisionNote: dto.decisionNote,
            completedAt: new Date(),
          },
          include: {
            assignedReviewer: { select: { id: true, email: true, fullName: true } },
            requestedBy: { select: { id: true, email: true, fullName: true } },
          },
        });
      }

      // Update version workflow status
      await tx.documentVersion.update({
        where: { id: versionId },
        data: {
          workflowStatus: targetWorkflowStatus,
          approvedAt: dto.decision === ReviewDecision.APPROVED ? new Date() : undefined,
        },
      });

      return activeReview;
    });

    await this.auditService.logEvent(reviewerId, 'DOCUMENT_REVIEW_DECIDED', undefined, {
      organizationId,
      projectId,
      documentId,
      versionId,
      reviewId: review.id,
      decision: dto.decision,
    });

    return this.mapReview(review);
  }

  /**
   * Atomic publication: Marks new version as PUBLISHED, supersedes previous published version.
   * Guarantees exactly one active published version per document!
   */
  async publishVersion(
    organizationId: string,
    projectId: string,
    documentId: string,
    versionId: string,
    userId: string,
  ): Promise<DocumentVersionSummary> {
    await this.getVerifiedProject(organizationId, projectId);

    const result = await this.prisma.$transaction(async (tx) => {
      const version = await tx.documentVersion.findFirst({
        where: { id: versionId, documentId, projectId, organizationId },
      });
      if (!version) {
        throw new NotFoundException('Document version not found');
      }

      // Idempotent: already published
      if (version.workflowStatus === DocumentWorkflowStatus.PUBLISHED) {
        return this.mapVersion(version);
      }

      if (
        version.workflowStatus !== DocumentWorkflowStatus.APPROVED &&
        version.workflowStatus !== DocumentWorkflowStatus.SUBMITTED
      ) {
        throw new BadRequestException(
          `Cannot publish version in "${version.workflowStatus}" status. Version must be APPROVED or SUBMITTED.`,
        );
      }

      const document = await tx.document.findUnique({
        where: { id: documentId },
      });
      if (!document) {
        throw new NotFoundException('Document not found');
      }

      // Atomically supersede previous published version if exists
      if (
        document.currentPublishedVersionId &&
        document.currentPublishedVersionId !== version.id
      ) {
        await tx.documentVersion.update({
          where: { id: document.currentPublishedVersionId },
          data: {
            workflowStatus: DocumentWorkflowStatus.SUPERSEDED,
            supersededAt: new Date(),
          },
        });
      }

      // Mark target version as PUBLISHED
      const published = await tx.documentVersion.update({
        where: { id: version.id },
        data: {
          workflowStatus: DocumentWorkflowStatus.PUBLISHED,
          publishedAt: new Date(),
        },
        include: {
          uploadedBy: { select: { id: true, email: true, fullName: true } },
        },
      });

      // Update parent document pointer
      await tx.document.update({
        where: { id: documentId },
        data: {
          currentPublishedVersionId: version.id,
          currentRevisionCode: version.revisionCode,
        },
      });

      return this.mapVersion(published);
    });

    await this.auditService.logEvent(userId, 'DOCUMENT_VERSION_PUBLISHED', undefined, {
      organizationId,
      projectId,
      documentId,
      versionId,
      revisionCode: result.revisionCode,
    });

    return result;
  }

  /**
   * Withdraws a document version
   */
  async withdrawVersion(
    organizationId: string,
    projectId: string,
    documentId: string,
    versionId: string,
    userId: string,
  ): Promise<DocumentVersionSummary> {
    await this.getVerifiedProject(organizationId, projectId);

    const version = await this.prisma.documentVersion.findFirst({
      where: { id: versionId, documentId, projectId, organizationId },
    });
    if (!version) {
      throw new NotFoundException('Document version not found');
    }

    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    const updated = await this.prisma.$transaction(async (tx) => {
      const v = await tx.documentVersion.update({
        where: { id: versionId },
        data: {
          workflowStatus: DocumentWorkflowStatus.WITHDRAWN,
          archivedAt: new Date(),
        },
        include: {
          uploadedBy: { select: { id: true, email: true, fullName: true } },
        },
      });

      // If it was the published version, reset published pointer
      if (document && document.currentPublishedVersionId === versionId) {
        await tx.document.update({
          where: { id: documentId },
          data: {
            currentPublishedVersionId: null,
          },
        });
      }

      return v;
    });

    await this.auditService.logEvent(userId, 'DOCUMENT_VERSION_WITHDRAWN', undefined, {
      organizationId,
      projectId,
      documentId,
      versionId,
      revisionCode: updated.revisionCode,
    });

    return this.mapVersion(updated);
  }

  // ==========================================
  // Phase 3C: Dedicated Drawings Register (ES-04)
  // ==========================================

  /**
   * Lists drawings in project with filters
   */
  async listDrawings(
    organizationId: string,
    projectId: string,
    query: DrawingQueryDto,
  ): Promise<{
    items: DrawingMetadataSummary[];
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

    if (query.discipline) {
      where.discipline = query.discipline;
    }
    if (query.drawingType) {
      where.drawingType = query.drawingType;
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.search) {
      where.OR = [
        { drawingNumber: { contains: query.search, mode: 'insensitive' } },
        { drawingTitle: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.drawingMetadata.findMany({
        where,
        include: {
          document: {
            include: {
              currentPublishedVersion: true,
              latestVersion: true,
            },
          },
        },
        orderBy: { drawingNumber: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.drawingMetadata.count({ where }),
    ]);

    return {
      items: items.map((d) => this.mapDrawing(d)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Creates drawing register metadata for an existing document
   */
  async createDrawing(
    organizationId: string,
    projectId: string,
    userId: string,
    dto: CreateDrawingDto,
  ): Promise<DrawingMetadataSummary> {
    await this.getVerifiedProject(organizationId, projectId);

    const doc = await this.prisma.document.findFirst({
      where: { id: dto.documentId, projectId, organizationId },
    });
    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    const existingNumber = await this.prisma.drawingMetadata.findUnique({
      where: {
        projectId_drawingNumber: {
          projectId,
          drawingNumber: dto.drawingNumber,
        },
      },
    });
    if (existingNumber) {
      throw new ConflictException(
        `Drawing number "${dto.drawingNumber}" already registered in this project`,
      );
    }

    const drawing = await this.prisma.drawingMetadata.create({
      data: {
        organizationId,
        projectId,
        documentId: dto.documentId,
        drawingNumber: dto.drawingNumber,
        drawingTitle: dto.drawingTitle,
        discipline: dto.discipline || (doc.discipline as any) || 'ARCHITECTURE',
        drawingType: dto.drawingType || 'FLOOR_PLAN',
        originator: dto.originator,
        sheetNumber: dto.sheetNumber,
        sheetSize: dto.sheetSize || 'A1',
        declaredScale: dto.declaredScale,
        issuePurpose: dto.issuePurpose || 'FOR_INFORMATION',
        status: 'ACTIVE',
      },
      include: {
        document: {
          include: {
            currentPublishedVersion: true,
            latestVersion: true,
          },
        },
      },
    });

    await this.auditService.logEvent(userId, 'DRAWING_REGISTERED', undefined, {
      organizationId,
      projectId,
      documentId: doc.id,
      drawingId: drawing.id,
      drawingNumber: drawing.drawingNumber,
    });

    return this.mapDrawing(drawing);
  }

  /**
   * Retrieves single drawing metadata with versions
   */
  async getDrawing(
    organizationId: string,
    projectId: string,
    drawingId: string,
  ): Promise<DrawingMetadataSummary> {
    await this.getVerifiedProject(organizationId, projectId);

    const drawing = await this.prisma.drawingMetadata.findFirst({
      where: { id: drawingId, projectId, organizationId },
      include: {
        document: {
          include: {
            currentPublishedVersion: true,
            latestVersion: true,
          },
        },
      },
    });

    if (!drawing) {
      throw new NotFoundException('Drawing not found');
    }

    return this.mapDrawing(drawing);
  }

  /**
   * Updates drawing metadata
   */
  async updateDrawing(
    organizationId: string,
    projectId: string,
    drawingId: string,
    dto: UpdateDrawingDto,
    userId: string,
  ): Promise<DrawingMetadataSummary> {
    await this.getVerifiedProject(organizationId, projectId);

    const drawing = await this.prisma.drawingMetadata.findFirst({
      where: { id: drawingId, projectId, organizationId },
    });
    if (!drawing) {
      throw new NotFoundException('Drawing not found');
    }

    if (dto.drawingNumber && dto.drawingNumber !== drawing.drawingNumber) {
      const existing = await this.prisma.drawingMetadata.findUnique({
        where: {
          projectId_drawingNumber: {
            projectId,
            drawingNumber: dto.drawingNumber,
          },
        },
      });
      if (existing) {
        throw new ConflictException(
          `Drawing number "${dto.drawingNumber}" already in use in this project`,
        );
      }
    }

    const updated = await this.prisma.drawingMetadata.update({
      where: { id: drawingId },
      data: {
        drawingNumber: dto.drawingNumber,
        drawingTitle: dto.drawingTitle,
        discipline: dto.discipline,
        drawingType: dto.drawingType,
        originator: dto.originator,
        sheetNumber: dto.sheetNumber,
        sheetSize: dto.sheetSize,
        declaredScale: dto.declaredScale,
        issuePurpose: dto.issuePurpose,
        status: dto.status,
      },
      include: {
        document: {
          include: {
            currentPublishedVersion: true,
            latestVersion: true,
          },
        },
      },
    });

    await this.auditService.logEvent(userId, 'DRAWING_UPDATED', undefined, {
      organizationId,
      projectId,
      drawingId,
    });

    return this.mapDrawing(updated);
  }

  // ==========================================
  // Phase 3C: Review Queue
  // ==========================================

  /**
   * Lists reviews assigned to user or for project
   */
  async listReviews(
    organizationId: string,
    projectId: string,
    _userId: string,
    status?: ReviewStatus,
  ): Promise<DocumentReviewSummary[]> {
    await this.getVerifiedProject(organizationId, projectId);

    const where: any = {
      organizationId,
      projectId,
    };

    if (status) {
      where.status = status;
    }

    const reviews = await this.prisma.documentReview.findMany({
      where,
      include: {
        document: true,
        version: {
          include: {
            uploadedBy: { select: { id: true, email: true, fullName: true } },
          },
        },
        assignedReviewer: { select: { id: true, email: true, fullName: true } },
        requestedBy: { select: { id: true, email: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reviews.map((r) => this.mapReview(r));
  }

  // ==========================================
  // Phase 3C: Document Transmittals (ES-05)
  // ==========================================

  /**
   * Creates a transmittal linking explicit DocumentVersion IDs
   */
  async createTransmittal(
    organizationId: string,
    projectId: string,
    userId: string,
    dto: CreateTransmittalDto,
  ): Promise<TransmittalSummary> {
    await this.getVerifiedProject(organizationId, projectId);

    const existingRef = await this.prisma.documentTransmittal.findUnique({
      where: {
        projectId_reference: {
          projectId,
          reference: dto.reference,
        },
      },
    });
    if (existingRef) {
      throw new ConflictException(
        `Transmittal reference "${dto.reference}" already exists in this project`,
      );
    }

    // Resolve version IDs and recipients from DTO or payload aliases
    const targetVersionIds: string[] = (
      dto.versionIds ||
      (dto as any).items?.map((it: any) => it.documentVersionId || it.versionId || it.id) ||
      []
    ).filter(Boolean);

    const authorizedRecipients = (dto.authorizedRecipients || (dto as any).recipients || []).map(
      (r: any) => ({
        name: r.name,
        email: r.email,
        organization: r.organization,
        role: r.role,
      }),
    );

    // Verify all version IDs belong to this project
    const versions = await this.prisma.documentVersion.findMany({
      where: {
        id: { in: targetVersionIds },
        projectId,
        organizationId,
      },
      include: {
        document: {
          include: {
            drawingMetadata: true,
          },
        },
      },
    });

    if (versions.length !== targetVersionIds.length) {
      throw new BadRequestException(
        'One or more specified document versions do not exist or belong to another project',
      );
    }

    const transmittal = await this.prisma.$transaction(async (tx) => {
      const t = await tx.documentTransmittal.create({
        data: {
          organizationId,
          projectId,
          reference: dto.reference,
          subject: dto.subject,
          senderUserId: dto.senderUserId || userId,
          authorizedRecipients: authorizedRecipients as any,
          issuePurpose: dto.issuePurpose || IssuePurpose.FOR_INFORMATION,
          issueDate: dto.issueDate ? new Date(dto.issueDate) : new Date(),
          status: TransmittalStatus.DRAFT,
          notes: dto.notes,
          createdById: userId,
        },
      });

      // Snapshot line items
      await tx.transmittalItem.createMany({
        data: versions.map((v) => ({
          transmittalId: t.id,
          documentId: v.documentId,
          documentVersionId: v.id,
          drawingNumber: v.document.drawingMetadata?.drawingNumber || null,
          documentReference: v.document.reference,
          revisionCode: v.revisionCode,
          title: v.title,
          fileFormat: v.fileFormat,
          sheetSize: v.document.drawingMetadata?.sheetSize || null,
          declaredScale: v.document.drawingMetadata?.declaredScale || null,
        })),
      });

      return tx.documentTransmittal.findUnique({
        where: { id: t.id },
        include: {
          sender: { select: { id: true, email: true, fullName: true } },
          createdBy: { select: { id: true, email: true, fullName: true } },
          items: true,
        },
      });
    });

    await this.auditService.logEvent(userId, 'TRANSMITTAL_CREATED', undefined, {
      organizationId,
      projectId,
      transmittalId: transmittal!.id,
      reference: transmittal!.reference,
      itemCount: versions.length,
    });

    return this.mapTransmittal(transmittal);
  }

  /**
   * Lists transmittals for project
   */
  async listTransmittals(
    organizationId: string,
    projectId: string,
    query: TransmittalQueryDto,
  ): Promise<{
    items: TransmittalSummary[];
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

    if (query.status) {
      where.status = query.status;
    }
    if (query.issuePurpose) {
      where.issuePurpose = query.issuePurpose;
    }
    if (query.search) {
      where.OR = [
        { reference: { contains: query.search, mode: 'insensitive' } },
        { subject: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.documentTransmittal.findMany({
        where,
        include: {
          sender: { select: { id: true, email: true, fullName: true } },
          createdBy: { select: { id: true, email: true, fullName: true } },
          _count: { select: { items: true } },
        },
        orderBy: { issueDate: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.documentTransmittal.count({ where }),
    ]);

    return {
      items: items.map((t) => this.mapTransmittal(t)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Retrieves full transmittal with immutable line items
   */
  async getTransmittal(
    organizationId: string,
    projectId: string,
    transmittalId: string,
  ): Promise<TransmittalSummary> {
    await this.getVerifiedProject(organizationId, projectId);

    const transmittal = await this.prisma.documentTransmittal.findFirst({
      where: { id: transmittalId, projectId, organizationId },
      include: {
        sender: { select: { id: true, email: true, fullName: true } },
        createdBy: { select: { id: true, email: true, fullName: true } },
        items: true,
      },
    });

    if (!transmittal) {
      throw new NotFoundException('Transmittal not found');
    }

    return this.mapTransmittal(transmittal);
  }

  /**
   * Issues a transmittal (status becomes ISSUED, record becomes immutable)
   */
  async issueTransmittal(
    organizationId: string,
    projectId: string,
    transmittalId: string,
    userId: string,
  ): Promise<TransmittalSummary> {
    await this.getVerifiedProject(organizationId, projectId);

    const transmittal = await this.prisma.documentTransmittal.findFirst({
      where: { id: transmittalId, projectId, organizationId },
    });
    if (!transmittal) {
      throw new NotFoundException('Transmittal not found');
    }

    if (transmittal.status !== TransmittalStatus.DRAFT) {
      throw new BadRequestException(
        `Cannot issue transmittal in "${transmittal.status}" status. Only DRAFT transmittals can be issued.`,
      );
    }

    const updated = await this.prisma.documentTransmittal.update({
      where: { id: transmittalId },
      data: {
        status: TransmittalStatus.ISSUED,
        issuedAt: new Date(),
      },
      include: {
        sender: { select: { id: true, email: true, fullName: true } },
        createdBy: { select: { id: true, email: true, fullName: true } },
        items: true,
      },
    });

    await this.auditService.logEvent(userId, 'TRANSMITTAL_ISSUED', undefined, {
      organizationId,
      projectId,
      transmittalId,
      reference: updated.reference,
    });

    return this.mapTransmittal(updated);
  }

  /**
   * Cancels a transmittal
   */
  async cancelTransmittal(
    organizationId: string,
    projectId: string,
    transmittalId: string,
    userId: string,
  ): Promise<TransmittalSummary> {
    await this.getVerifiedProject(organizationId, projectId);

    const transmittal = await this.prisma.documentTransmittal.findFirst({
      where: { id: transmittalId, projectId, organizationId },
    });
    if (!transmittal) {
      throw new NotFoundException('Transmittal not found');
    }

    if (transmittal.status === TransmittalStatus.CANCELLED) {
      throw new BadRequestException('Transmittal is already cancelled');
    }

    const updated = await this.prisma.documentTransmittal.update({
      where: { id: transmittalId },
      data: {
        status: TransmittalStatus.CANCELLED,
        cancelledAt: new Date(),
      },
      include: {
        sender: { select: { id: true, email: true, fullName: true } },
        createdBy: { select: { id: true, email: true, fullName: true } },
        items: true,
      },
    });

    await this.auditService.logEvent(userId, 'TRANSMITTAL_CANCELLED', undefined, {
      organizationId,
      projectId,
      transmittalId,
      reference: updated.reference,
    });

    return this.mapTransmittal(updated);
  }
}
