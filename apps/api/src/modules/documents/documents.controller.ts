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
} from './dto/document.dto';

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
}
