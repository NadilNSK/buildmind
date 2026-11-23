import { Module } from '@nestjs/common';
import { QsController } from './qs.controller';
import { QsService } from './qs.service';

@Module({
  controllers: [QsController],
  providers: [QsService],
  exports: [QsService],
})
export class QsModule {}
