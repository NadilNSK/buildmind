import { Injectable, OnModuleInit, Logger, InternalServerErrorException } from '@nestjs/common';
import * as Minio from 'minio';
import * as crypto from 'crypto';
import { Readable } from 'stream';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private client!: Minio.Client;

  public readonly documentsBucket: string;
  public readonly drawingsBucket: string;

  constructor() {
    this.documentsBucket = process.env.S3_BUCKET_DOCUMENTS || 'buildmind-documents';
    this.drawingsBucket = process.env.S3_BUCKET_DRAWINGS || 'buildmind-drawings';

    const s3Endpoint = process.env.S3_ENDPOINT || 'http://localhost:9000';
    const accessKey = process.env.S3_ACCESS_KEY || 'minio_buildmind_access';
    const secretKey = process.env.S3_SECRET_KEY || 'minio_buildmind_secret_change_in_prod';
    const region = process.env.S3_REGION || 'us-east-1';

    let endPoint = 'localhost';
    let port = 9000;
    let useSSL = false;

    try {
      const url = new URL(s3Endpoint);
      endPoint = url.hostname;
      port = url.port ? parseInt(url.port, 10) : url.protocol === 'https:' ? 443 : 80;
      useSSL = url.protocol === 'https:';
    } catch {
      endPoint = s3Endpoint.replace(/^https?:\/\//, '').split(':')[0] || 'localhost';
    }

    this.client = new Minio.Client({
      endPoint,
      port,
      useSSL,
      accessKey,
      secretKey,
      region,
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.ensureBucketExists(this.documentsBucket);
      await this.ensureBucketExists(this.drawingsBucket);
      this.logger.log(`MinIO storage client connected. Buckets verified: [${this.documentsBucket}, ${this.drawingsBucket}]`);
    } catch (err: any) {
      this.logger.warn(`MinIO connection or bucket check notice: ${err?.message || err}`);
    }
  }

  private async ensureBucketExists(bucket: string): Promise<void> {
    try {
      const exists = await this.client.bucketExists(bucket);
      if (!exists) {
        await this.client.makeBucket(bucket, process.env.S3_REGION || 'us-east-1');
        this.logger.log(`Created MinIO bucket: ${bucket}`);
      }
    } catch (err: any) {
      // In multi-threaded or reconnect environments, bucket may already exist
      if (err?.code !== 'BucketAlreadyOwnedByYou' && err?.code !== 'BucketAlreadyExists') {
        this.logger.warn(`Bucket verification error for ${bucket}: ${err?.message}`);
      }
    }
  }

  /**
   * Generates quarantine storage object key
   */
  getQuarantineKey(
    organizationId: string,
    projectId: string,
    sessionId: string,
    sanitizedFilename: string,
  ): string {
    return `organizations/${organizationId}/projects/${projectId}/quarantine/${sessionId}/${sanitizedFilename}`;
  }

  /**
   * Generates permanent document storage object key
   */
  getDocumentKey(
    organizationId: string,
    projectId: string,
    documentId: string,
    sanitizedFilename: string,
  ): string {
    return `organizations/${organizationId}/projects/${projectId}/documents/${documentId}/${sanitizedFilename}`;
  }

  /**
   * Generates permanent immutable document version storage object key
   */
  getDocumentVersionKey(
    organizationId: string,
    projectId: string,
    documentId: string,
    versionNumber: number,
    sanitizedFilename: string,
  ): string {
    return `organizations/${organizationId}/projects/${projectId}/documents/${documentId}/versions/v${versionNumber}_${sanitizedFilename}`;
  }

  /**
   * Computes SHA-256 hash of a buffer
   */
  computeSha256(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Puts an object (Buffer or Stream) into MinIO
   */
  async putObject(
    bucket: string,
    objectKey: string,
    data: Buffer | Readable,
    size?: number,
    metadata?: Record<string, string>,
  ): Promise<void> {
    try {
      const contentLen = Buffer.isBuffer(data) ? data.length : size;
      await this.client.putObject(bucket, objectKey, data, contentLen, metadata);
    } catch (err: any) {
      this.logger.error(`Failed to put object ${objectKey} in ${bucket}: ${err?.message}`);
      throw new InternalServerErrorException(`Storage upload failed: ${err?.message}`);
    }
  }

  /**
   * Retrieves an object stream from MinIO
   */
  async getObject(bucket: string, objectKey: string): Promise<Readable> {
    try {
      return await this.client.getObject(bucket, objectKey);
    } catch (err: any) {
      this.logger.error(`Failed to get object ${objectKey} from ${bucket}: ${err?.message}`);
      throw new InternalServerErrorException(`Storage download failed: ${err?.message}`);
    }
  }

  /**
   * Retrieves object stats
   */
  async statObject(bucket: string, objectKey: string): Promise<Minio.BucketItemStat> {
    try {
      return await this.client.statObject(bucket, objectKey);
    } catch (err: any) {
      this.logger.error(`Failed to stat object ${objectKey} from ${bucket}: ${err?.message}`);
      throw new InternalServerErrorException(`Storage metadata lookup failed: ${err?.message}`);
    }
  }

  /**
   * Deletes an object from MinIO
   */
  async removeObject(bucket: string, objectKey: string): Promise<void> {
    try {
      await this.client.removeObject(bucket, objectKey);
    } catch (err: any) {
      this.logger.warn(`Failed to remove object ${objectKey} from ${bucket}: ${err?.message}`);
    }
  }

  /**
   * Copies an object within or across buckets
   */
  async copyObject(
    sourceBucket: string,
    sourceKey: string,
    destBucket: string,
    destKey: string,
  ): Promise<void> {
    try {
      const conds = new Minio.CopyConditions();
      await this.client.copyObject(destBucket, destKey, `/${sourceBucket}/${sourceKey}`, conds);
    } catch (err: any) {
      this.logger.error(`Failed to copy object from ${sourceKey} to ${destKey}: ${err?.message}`);
      throw new InternalServerErrorException(`Storage transfer failed: ${err?.message}`);
    }
  }

  /**
   * Generates a presigned URL for downloading an object
   */
  async getPresignedDownloadUrl(
    bucket: string,
    objectKey: string,
    expirySeconds = 3600,
    downloadFilename?: string,
  ): Promise<string> {
    try {
      const respHeaders: Record<string, string> = {};
      if (downloadFilename) {
        respHeaders['response-content-disposition'] = `attachment; filename="${downloadFilename}"`;
      }
      return await this.client.presignedGetObject(bucket, objectKey, expirySeconds, respHeaders);
    } catch (err: any) {
      this.logger.error(`Failed to generate presigned download URL for ${objectKey}: ${err?.message}`);
      throw new InternalServerErrorException('Failed to generate secure download link');
    }
  }

  /**
   * Generates a presigned URL for direct upload
   */
  async getPresignedUploadUrl(
    bucket: string,
    objectKey: string,
    expirySeconds = 3600,
  ): Promise<string> {
    try {
      return await this.client.presignedPutObject(bucket, objectKey, expirySeconds);
    } catch (err: any) {
      this.logger.error(`Failed to generate presigned upload URL for ${objectKey}: ${err?.message}`);
      throw new InternalServerErrorException('Failed to generate secure upload link');
    }
  }
}
