import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseInterceptors,
  UploadedFile,
  Res,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { DocumentsService } from './documents.service';
import { TransformInterceptor } from '../../common/interceptors/transform.interceptor';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ActiveOrg } from '../../common/decorators/active-tenant.decorator';
import { RequireTenant } from '../../common/decorators/require-tenant.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { Organization } from '@prisma/client';
import {
  CreateUploadSessionDto,
  CompleteUploadSessionDto,
  UpdateDocumentDto,
  UpdateDocumentLinksDto,
  DocumentQueryDto,
  CreateVersionDto,
  SubmitReviewDto,
  ReviewDecisionDto,
} from './dto';

@Controller('projects/:projectId/documents')
@UseInterceptors(TransformInterceptor)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  // ==========================================
  // 1. Upload Sessions & Direct Upload
  // ==========================================

  @Post('upload-sessions')
  @HttpCode(HttpStatus.CREATED)
  @RequireTenant()
  @RequirePermissions('documents.upload')
  async createUploadSession(
    @ActiveOrg() org: Organization,
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateUploadSessionDto,
  ) {
    return this.documentsService.createUploadSession(org.id, projectId, user.id, body);
  }

  @Post('upload-sessions/:sessionId/file')
  @HttpCode(HttpStatus.OK)
  @RequireTenant()
  @RequirePermissions('documents.upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFileToSession(
    @ActiveOrg() org: Organization,
    @Param('projectId') projectId: string,
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file || !file.buffer) {
      throw new BadRequestException('File is required in multipart form-data under field "file"');
    }
    return this.documentsService.uploadFileDirect(
      org.id,
      projectId,
      sessionId,
      user.id,
      file.buffer,
    );
  }

  @Post('upload-sessions/complete')
  @HttpCode(HttpStatus.OK)
  @RequireTenant()
  @RequirePermissions('documents.upload')
  async completeUploadSession(
    @ActiveOrg() org: Organization,
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CompleteUploadSessionDto,
  ) {
    return this.documentsService.completeUploadSession(org.id, projectId, user.id, body);
  }

  @Delete('upload-sessions/:sessionId')
  @HttpCode(HttpStatus.OK)
  @RequireTenant()
  @RequirePermissions('documents.upload')
  async cancelUploadSession(
    @ActiveOrg() org: Organization,
    @Param('projectId') projectId: string,
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentsService.cancelUploadSession(org.id, projectId, sessionId, user.id);
  }

  // ==========================================
  // 2. Storage Usage Metrics
  // ==========================================

  @Get('storage-usage')
  @RequireTenant()
  @RequirePermissions('documents.storage_usage')
  async getStorageUsage(
    @ActiveOrg() org: Organization,
    @Param('projectId') projectId: string,
  ) {
    return this.documentsService.getStorageUsage(org.id, projectId);
  }

  // ==========================================
  // 3. Document Retrieval & Management
  // ==========================================

  @Get()
  @RequireTenant()
  @RequirePermissions('documents.view')
  async listDocuments(
    @ActiveOrg() org: Organization,
    @Param('projectId') projectId: string,
    @Query() query: DocumentQueryDto,
  ) {
    return this.documentsService.findAll(org.id, projectId, query);
  }

  @Get(':documentId')
  @RequireTenant()
  @RequirePermissions('documents.view')
  async getDocument(
    @ActiveOrg() org: Organization,
    @Param('projectId') projectId: string,
    @Param('documentId') documentId: string,
  ) {
    return this.documentsService.findOne(org.id, projectId, documentId);
  }

  @Patch(':documentId')
  @RequireTenant()
  @RequirePermissions('documents.update')
  async updateDocument(
    @ActiveOrg() org: Organization,
    @Param('projectId') projectId: string,
    @Param('documentId') documentId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateDocumentDto,
  ) {
    return this.documentsService.update(org.id, projectId, documentId, body, user.id);
  }

  @Post(':documentId/archive')
  @HttpCode(HttpStatus.OK)
  @RequireTenant()
  @RequirePermissions('documents.archive')
  async archiveDocument(
    @ActiveOrg() org: Organization,
    @Param('projectId') projectId: string,
    @Param('documentId') documentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentsService.archive(org.id, projectId, documentId, user.id);
  }

  @Post(':documentId/restore')
  @HttpCode(HttpStatus.OK)
  @RequireTenant()
  @RequirePermissions('documents.restore')
  async restoreDocument(
    @ActiveOrg() org: Organization,
    @Param('projectId') projectId: string,
    @Param('documentId') documentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentsService.restore(org.id, projectId, documentId, user.id);
  }

  @Put(':documentId/links')
  @HttpCode(HttpStatus.OK)
  @RequireTenant()
  @RequirePermissions('documents.link')
  async updateLinks(
    @ActiveOrg() org: Organization,
    @Param('projectId') projectId: string,
    @Param('documentId') documentId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateDocumentLinksDto,
  ) {
    return this.documentsService.updateLinks(org.id, projectId, documentId, body, user.id);
  }

  // ==========================================
  // 4. Download Endpoints
  // ==========================================

  @Get(':documentId/download')
  @RequireTenant()
  @RequirePermissions('documents.download')
  async downloadDocumentStream(
    @ActiveOrg() org: Organization,
    @Param('projectId') projectId: string,
    @Param('documentId') documentId: string,
    @Res() res: Response,
  ) {
    const { stream, filename, mimeType, fileSizeBytes, checksumSha256 } =
      await this.documentsService.getDownloadStream(org.id, projectId, documentId);

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', fileSizeBytes);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('X-Checksum-SHA256', checksumSha256);

    stream.pipe(res);
  }

  @Get(':documentId/download-url')
  @RequireTenant()
  @RequirePermissions('documents.download')
  async getDownloadUrl(
    @ActiveOrg() org: Organization,
    @Param('projectId') projectId: string,
    @Param('documentId') documentId: string,
  ) {
    return this.documentsService.getDownloadUrl(org.id, projectId, documentId);
  }

  // ==========================================
  // 5. Phase 3C: Document Versions & Comparison
  // ==========================================

  @Post(':documentId/versions')
  @HttpCode(HttpStatus.CREATED)
  @RequireTenant()
  @RequirePermissions('documents.versions.upload')
  @UseInterceptors(FileInterceptor('file'))
  async createVersion(
    @ActiveOrg() org: Organization,
    @Param('projectId') projectId: string,
    @Param('documentId') documentId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateVersionDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.documentsService.createVersion(
      org.id,
      projectId,
      documentId,
      user.id,
      body,
      file?.buffer,
      file ? { originalname: file.originalname, mimetype: file.mimetype } : undefined,
    );
  }

  @Get(':documentId/versions')
  @RequireTenant()
  @RequirePermissions('documents.versions.view')
  async listVersions(
    @ActiveOrg() org: Organization,
    @Param('projectId') projectId: string,
    @Param('documentId') documentId: string,
  ) {
    return this.documentsService.listVersions(org.id, projectId, documentId);
  }

  @Get(':documentId/versions-compare')
  @RequireTenant()
  @RequirePermissions('documents.versions.view')
  async compareVersions(
    @ActiveOrg() org: Organization,
    @Param('projectId') projectId: string,
    @Param('documentId') documentId: string,
    @Query('fromVersionId') fromVersionId: string,
    @Query('toVersionId') toVersionId: string,
  ) {
    if (!fromVersionId || !toVersionId) {
      throw new BadRequestException('Both fromVersionId and toVersionId query parameters are required');
    }
    return this.documentsService.compareVersions(
      org.id,
      projectId,
      documentId,
      fromVersionId,
      toVersionId,
    );
  }

  @Get(':documentId/versions/compare')
  @RequireTenant()
  @RequirePermissions('documents.versions.view')
  async compareVersionsNested(
    @ActiveOrg() org: Organization,
    @Param('projectId') projectId: string,
    @Param('documentId') documentId: string,
    @Query('fromVersionId') fromVersionId: string,
    @Query('toVersionId') toVersionId: string,
  ) {
    if (!fromVersionId || !toVersionId) {
      throw new BadRequestException('Both fromVersionId and toVersionId query parameters are required');
    }
    return this.documentsService.compareVersions(
      org.id,
      projectId,
      documentId,
      fromVersionId,
      toVersionId,
    );
  }

  @Get(':documentId/versions/:versionId')
  @RequireTenant()
  @RequirePermissions('documents.versions.view')
  async getVersion(
    @ActiveOrg() org: Organization,
    @Param('projectId') projectId: string,
    @Param('documentId') documentId: string,
    @Param('versionId') versionId: string,
  ) {
    return this.documentsService.getVersion(org.id, projectId, documentId, versionId);
  }

  @Get(':documentId/versions/:versionId/download')
  @RequireTenant()
  @RequirePermissions('documents.versions.download')
  async downloadVersionStream(
    @ActiveOrg() org: Organization,
    @Param('projectId') projectId: string,
    @Param('documentId') documentId: string,
    @Param('versionId') versionId: string,
    @Res() res: Response,
  ) {
    const { stream, filename, mimeType, fileSizeBytes, checksumSha256, revisionCode } =
      await this.documentsService.getVersionDownloadStream(
        org.id,
        projectId,
        documentId,
        versionId,
      );

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', fileSizeBytes);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('X-Checksum-SHA256', checksumSha256);
    res.setHeader('X-Revision-Code', revisionCode);

    stream.pipe(res);
  }

  @Get(':documentId/versions/:versionId/download-url')
  @RequireTenant()
  @RequirePermissions('documents.versions.download')
  async getVersionDownloadUrl(
    @ActiveOrg() org: Organization,
    @Param('projectId') projectId: string,
    @Param('documentId') documentId: string,
    @Param('versionId') versionId: string,
  ) {
    return this.documentsService.getVersionDownloadUrl(org.id, projectId, documentId, versionId);
  }

  // ==========================================
  // 6. Phase 3C: Workflow State Machine Transitions
  // ==========================================

  @Post(':documentId/versions/:versionId/submit')
  @HttpCode(HttpStatus.OK)
  @RequireTenant()
  @RequirePermissions('documents.submit')
  async submitVersion(
    @ActiveOrg() org: Organization,
    @Param('projectId') projectId: string,
    @Param('documentId') documentId: string,
    @Param('versionId') versionId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentsService.submitVersion(org.id, projectId, documentId, versionId, user.id);
  }

  @Post(':documentId/versions/:versionId/request-review')
  @HttpCode(HttpStatus.OK)
  @RequireTenant()
  @RequirePermissions('documents.submit')
  async requestReview(
    @ActiveOrg() org: Organization,
    @Param('projectId') projectId: string,
    @Param('documentId') documentId: string,
    @Param('versionId') versionId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: SubmitReviewDto,
  ) {
    return this.documentsService.requestReview(
      org.id,
      projectId,
      documentId,
      versionId,
      user.id,
      body,
    );
  }

  @Post(':documentId/versions/:versionId/review-decision')
  @HttpCode(HttpStatus.OK)
  @RequireTenant()
  @RequirePermissions('documents.approve')
  async submitReviewDecision(
    @ActiveOrg() org: Organization,
    @Param('projectId') projectId: string,
    @Param('documentId') documentId: string,
    @Param('versionId') versionId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: ReviewDecisionDto,
  ) {
    return this.documentsService.submitReviewDecision(
      org.id,
      projectId,
      documentId,
      versionId,
      user.id,
      body,
    );
  }

  @Post(':documentId/versions/:versionId/publish')
  @HttpCode(HttpStatus.OK)
  @RequireTenant()
  @RequirePermissions('documents.publish')
  async publishVersion(
    @ActiveOrg() org: Organization,
    @Param('projectId') projectId: string,
    @Param('documentId') documentId: string,
    @Param('versionId') versionId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentsService.publishVersion(org.id, projectId, documentId, versionId, user.id);
  }

  @Post(':documentId/versions/:versionId/withdraw')
  @HttpCode(HttpStatus.OK)
  @RequireTenant()
  @RequirePermissions('documents.withdraw')
  async withdrawVersion(
    @ActiveOrg() org: Organization,
    @Param('projectId') projectId: string,
    @Param('documentId') documentId: string,
    @Param('versionId') versionId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentsService.withdrawVersion(
      org.id,
      projectId,
      documentId,
      versionId,
      user.id,
    );
  }
}
