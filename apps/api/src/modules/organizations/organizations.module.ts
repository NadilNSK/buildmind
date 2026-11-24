import { Module } from '@nestjs/common';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { EmailModule } from '../email/email.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [EmailModule, AuthModule],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
