import { Module, Global } from '@nestjs/common';
import { StorageService } from './storage.service';
import { FileValidatorService } from './file-validator.service';

@Global()
@Module({
  providers: [StorageService, FileValidatorService],
  exports: [StorageService, FileValidatorService],
})
export class StorageModule {}
