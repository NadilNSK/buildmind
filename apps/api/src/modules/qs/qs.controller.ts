import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { QsService } from './qs.service';
import { TransformInterceptor } from '../../common/interceptors/transform.interceptor';

@Controller('qs')
@UseInterceptors(TransformInterceptor)
export class QsController {
  constructor(private readonly qsService: QsService) {}

  @Get('capabilities')
  getCapabilities() {
    return this.qsService.getCapabilities();
  }
}
