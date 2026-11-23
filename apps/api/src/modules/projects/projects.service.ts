import { Injectable, NotImplementedException } from '@nestjs/common';
import { ProjectSummary } from '@buildmind/shared-types';

@Injectable()
export class ProjectsService {
  /**
   * Phase 1 Service Boundary:
   * Real database CRUD operations are gated for Phase 2 authenticated tenant scope.
   */
  async findAll(): Promise<ProjectSummary[]> {
    return [];
  }

  async findOne(id: string): Promise<ProjectSummary | null> {
    throw new NotImplementedException(
      `Project retrieval for ${id} requires Phase 2 authenticated session.`,
    );
  }
}
