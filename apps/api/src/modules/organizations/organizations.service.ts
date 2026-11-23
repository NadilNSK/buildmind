import { Injectable, NotImplementedException } from '@nestjs/common';
import { OrganizationSummary } from '@buildmind/shared-types';

@Injectable()
export class OrganizationsService {
  /**
   * Phase 1 Service Boundary:
   * Real database CRUD operations are gated for Phase 2 authentication and authorization.
   */
  async findAll(): Promise<OrganizationSummary[]> {
    return [];
  }

  async findOne(id: string): Promise<OrganizationSummary | null> {
    throw new NotImplementedException(
      `Organization retrieval for ${id} requires Phase 2 authenticated session.`,
    );
  }
}
