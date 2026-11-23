import { Controller, Get, Param, UseInterceptors } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { TransformInterceptor } from '../../common/interceptors/transform.interceptor';

@Controller('organizations')
@UseInterceptors(TransformInterceptor)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  async list() {
    return this.organizationsService.findAll();
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.organizationsService.findOne(id);
  }
}
