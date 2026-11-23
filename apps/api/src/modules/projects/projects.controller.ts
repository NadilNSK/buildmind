import { Controller, Get, Param, UseInterceptors } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { TransformInterceptor } from '../../common/interceptors/transform.interceptor';

@Controller('projects')
@UseInterceptors(TransformInterceptor)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  async list() {
    return this.projectsService.findAll();
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }
}
