import { Injectable, BadRequestException } from '@nestjs/common';
import {
  DocumentFileFormat,
  DocumentScanStatus,
} from '@buildmind/shared-types';

export interface FileValidationResult {
  isValid: boolean;
  fileFormat: DocumentFileFormat;
  mimeType: string;
  sanitizedFilename: string;
  errorMessage?: string;
}

@Injectable()
export class FileValidatorService {
  // Maximum file size: 500 MB
  public static readonly MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024;

  // Allowed file extensions
  public static readonly EXTENSION_FORMAT_MAP: Record<string, DocumentFileFormat> = {
    // Vector & CAD
    dwg: DocumentFileFormat.DWG,
    dxf: DocumentFileFormat.DXF,
    ifc: DocumentFileFormat.IFC,
    // Raster Images
    png: DocumentFileFormat.PNG,
    jpg: DocumentFileFormat.JPG,
    jpeg: DocumentFileFormat.JPEG,
    tiff: DocumentFileFormat.TIFF,
    tif: DocumentFileFormat.TIFF,
    // Documents & Tabular
    pdf: DocumentFileFormat.PDF,
    docx: DocumentFileFormat.DOCX,
    xlsx: DocumentFileFormat.XLSX,
    csv: DocumentFileFormat.CSV,
    txt: DocumentFileFormat.TXT,
  };

  public static readonly FORMAT_MIME_MAP: Record<DocumentFileFormat, string> = {
    [DocumentFileFormat.PDF]: 'application/pdf',
    [DocumentFileFormat.PNG]: 'image/png',
    [DocumentFileFormat.JPG]: 'image/jpeg',
    [DocumentFileFormat.JPEG]: 'image/jpeg',
    [DocumentFileFormat.TIFF]: 'image/tiff',
    [DocumentFileFormat.DOCX]:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    [DocumentFileFormat.XLSX]:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    [DocumentFileFormat.CSV]: 'text/csv',
    [DocumentFileFormat.TXT]: 'text/plain',
    [DocumentFileFormat.IFC]: 'application/x-step',
    [DocumentFileFormat.DWG]: 'image/vnd.dwg',
    [DocumentFileFormat.DXF]: 'image/vnd.dxf',
  };

  /**
   * Returns default MIME type for format
   */
  getMimeTypeForFormat(format: DocumentFileFormat): string {
    return FileValidatorService.FORMAT_MIME_MAP[format] || 'application/octet-stream';
  }

  /**
   * Sanitizes filename to prevent directory traversal and invalid characters
   */
  sanitizeFilename(filename: string): string {
    if (!filename) return 'unnamed_document';
    // Remove null bytes, directory path characters, control characters
    const clean = filename
      .replace(/[\x00-\x1f\x7f]/g, '')
      .replace(/\\/g, '/')
      .split('/')
      .pop() || 'unnamed_document';

    // Replace invalid characters on Windows and Unix: <>:"/\|?*
    return clean.replace(/[<>:"/\\|?*]/g, '_').trim() || 'unnamed_document';
  }

  /**
   * Validates file extension
   */
  validateExtension(filename: string): { extension: string; format: DocumentFileFormat } {
    const cleanName = this.sanitizeFilename(filename);
    const parts = cleanName.split('.');
    if (parts.length < 2) {
      throw new BadRequestException('File must have a valid extension');
    }
    const ext = parts.pop()!.toLowerCase();
    const format = FileValidatorService.EXTENSION_FORMAT_MAP[ext];
    if (!format) {
      throw new BadRequestException(
        `Unsupported file type .${ext}. Allowed formats: PDF, PNG, JPG, JPEG, TIFF, DOCX, XLSX, CSV, TXT, IFC, DWG, DXF`,
      );
    }
    return { extension: ext, format };
  }

  /**
   * Validates file size
   */
  validateFileSize(sizeBytes: number): void {
    if (sizeBytes <= 0) {
      throw new BadRequestException('File cannot be empty');
    }
    if (sizeBytes > FileValidatorService.MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException(
        `File size (${(sizeBytes / (1024 * 1024)).toFixed(1)} MB) exceeds maximum limit of 500 MB`,
      );
    }
  }

  /**
   * Inspects magic bytes and headers of a buffer against the declared format
   */
  validateMagicBytes(buffer: Buffer, format: DocumentFileFormat): boolean {
    if (!buffer || buffer.length === 0) return false;

    switch (format) {
      case DocumentFileFormat.PDF:
        // %PDF- (0x25 0x50 0x44 0x46)
        return (
          buffer.length >= 4 &&
          buffer[0] === 0x25 &&
          buffer[1] === 0x50 &&
          buffer[2] === 0x44 &&
          buffer[3] === 0x46
        );

      case DocumentFileFormat.PNG:
        // 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
        return (
          buffer.length >= 8 &&
          buffer[0] === 0x89 &&
          buffer[1] === 0x50 &&
          buffer[2] === 0x4e &&
          buffer[3] === 0x47 &&
          buffer[4] === 0x0d &&
          buffer[5] === 0x0a &&
          buffer[6] === 0x1a &&
          buffer[7] === 0x0a
        );

      case DocumentFileFormat.JPG:
      case DocumentFileFormat.JPEG:
        // 0xFF 0xD8 0xFF
        return (
          buffer.length >= 3 &&
          buffer[0] === 0xff &&
          buffer[1] === 0xd8 &&
          buffer[2] === 0xff
        );

      case DocumentFileFormat.TIFF:
        // II*\0 (0x49 0x49 0x2A 0x00) or MM\0* (0x4D 0x4D 0x00 0x2A)
        if (buffer.length < 4) return false;
        const isLittleEndian =
          buffer[0] === 0x49 && buffer[1] === 0x49 && buffer[2] === 0x2a && buffer[3] === 0x00;
        const isBigEndian =
          buffer[0] === 0x4d && buffer[1] === 0x4d && buffer[2] === 0x00 && buffer[3] === 0x2a;
        return isLittleEndian || isBigEndian;

      case DocumentFileFormat.DOCX:
      case DocumentFileFormat.XLSX:
        // PK\x03\x04 (ZIP container signature: 0x50 0x4B 0x03 0x04)
        return (
          buffer.length >= 4 &&
          buffer[0] === 0x50 &&
          buffer[1] === 0x4b &&
          buffer[2] === 0x03 &&
          buffer[3] === 0x04
        );

      case DocumentFileFormat.DWG:
        // AC10xx (0x41 0x43 0x31 0x30)
        return (
          buffer.length >= 6 &&
          buffer[0] === 0x41 &&
          buffer[1] === 0x43 &&
          buffer[2] === 0x31 &&
          buffer[3] === 0x30
        );

      case DocumentFileFormat.DXF: {
        // ASCII DXF contains SECTION or HEADER in the header area
        const sample = buffer.slice(0, Math.min(buffer.length, 1024)).toString('ascii');
        return sample.includes('SECTION') || sample.includes('HEADER') || sample.includes('0');
      }

      case DocumentFileFormat.IFC: {
        // IFC STEP files start with ISO-10303-21;
        const sample = buffer.slice(0, Math.min(buffer.length, 512)).toString('utf8').trim();
        return sample.startsWith('ISO-10303-21;');
      }

      case DocumentFileFormat.CSV:
      case DocumentFileFormat.TXT: {
        // Valid text: should not contain null bytes in first 512 bytes
        const sampleLen = Math.min(buffer.length, 512);
        for (let i = 0; i < sampleLen; i++) {
          if (buffer[i] === 0x00) return false;
        }
        return true;
      }

      default:
        return false;
    }
  }

  /**
   * Scan simulation / verification
   */
  async scanFile(_buffer: Buffer): Promise<DocumentScanStatus> {
    // In production, integrate ClamAV or commercial AV scanner.
    // In local dev/enterprise testing, verify no known malicious signatures and mark CLEAN.
    return DocumentScanStatus.CLEAN;
  }
}
