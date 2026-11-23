import { Module } from '@nestjs/common';
import { HealthModule } from './modules/health/health.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { QsModule } from './modules/qs/qs.module';

@Module({
  imports: [HealthModule, OrganizationsModule, ProjectsModule, QsModule],
})
export class AppModule {}
