import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { QsService } from './qs.service';
import { TransformInterceptor } from '../../common/interceptors/transform.interceptor';
import { Public } from '../../common/decorators/public.decorator';

@Controller('qs')
@UseInterceptors(TransformInterceptor)
export class QsController {
  constructor(private readonly qsService: QsService) {}

  @Public()
  @Get('capabilities')
  getCapabilities() {
    return this.qsService.getCapabilities();
  }
}
