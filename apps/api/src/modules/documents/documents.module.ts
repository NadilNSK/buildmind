import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DrawingsController } from './drawings.controller';
import { TransmittalsController } from './transmittals.controller';
import { ReviewsController } from './reviews.controller';
import { DocumentsService } from './documents.service';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [AuthModule, StorageModule],
  controllers: [
    DocumentsController,
    DrawingsController,
    TransmittalsController,
    ReviewsController,
  ],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
