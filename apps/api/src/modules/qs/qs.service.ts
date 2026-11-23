import { Injectable } from '@nestjs/common';
import { CapabilityMeta, QSModuleId } from '@buildmind/shared-types';

@Injectable()
export class QsService {
  private readonly capabilities: CapabilityMeta[] = [
    // 12 Core QS Modules
    { id: QSModuleId.QS_01, name: 'Quantity Takeoff', category: 'QS_MODULE', phase: 2, status: 'FOUNDATION_PLACEHOLDER', description: 'CAD/PDF/BIM 2D & 3D measurement extraction with measurement sheet audit logs' },
    { id: QSModuleId.QS_02, name: 'Cost Estimation', category: 'QS_MODULE', phase: 2, status: 'FOUNDATION_PLACEHOLDER', description: 'Analytical rate build-ups (labour, plant, material, overheads) with Sri Lanka CIDA rate reference' },
    { id: QSModuleId.QS_03, name: 'BOQ Generation', category: 'QS_MODULE', phase: 2, status: 'FOUNDATION_PLACEHOLDER', description: 'Hierarchical Bill of Quantities conforming to SLS 573, CESMM4, and NRM2 standard methods' },
    { id: QSModuleId.QS_04, name: 'Budget Planning', category: 'QS_MODULE', phase: 3, status: 'FOUNDATION_PLACEHOLDER', description: 'Baseline cash flow forecasting and contingency risk modeling' },
    { id: QSModuleId.QS_05, name: 'Tender Management', category: 'QS_MODULE', phase: 3, status: 'FOUNDATION_PLACEHOLDER', description: 'Packaging, automated addenda distribution, bid evaluation matrices' },
    { id: QSModuleId.QS_06, name: 'Contract Administration', category: 'QS_MODULE', phase: 3, status: 'FOUNDATION_PLACEHOLDER', description: 'FIDIC / CIDA SBD clause management, formal notices, milestones' },
    { id: QSModuleId.QS_07, name: 'Procurement Management', category: 'QS_MODULE', phase: 3, status: 'FOUNDATION_PLACEHOLDER', description: 'Material requisitions, supplier RFQ tracking, purchase order matching' },
    { id: QSModuleId.QS_08, name: 'Cost Control & Monitoring', category: 'QS_MODULE', phase: 3, status: 'FOUNDATION_PLACEHOLDER', description: 'Earned Value Analysis (EVM), cost variance tracking, cost-to-complete forecasts' },
    { id: QSModuleId.QS_09, name: 'Interim Payment Valuation', category: 'QS_MODULE', phase: 2, status: 'FOUNDATION_PLACEHOLDER', description: 'Monthly progress valuations, retention deductions, payment certificate issuance' },
    { id: QSModuleId.QS_10, name: 'Variation Management', category: 'QS_MODULE', phase: 2, status: 'FOUNDATION_PLACEHOLDER', description: 'Variation orders, clause-based rate derivations, cumulative financial impact' },
    { id: QSModuleId.QS_11, name: 'Risk & Value Engineering', category: 'QS_MODULE', phase: 3, status: 'FOUNDATION_PLACEHOLDER', description: 'Quantitative risk registers, value optimization trade-offs' },
    { id: QSModuleId.QS_12, name: 'Final Account Preparation', category: 'QS_MODULE', phase: 3, status: 'FOUNDATION_PLACEHOLDER', description: 'Final measurement reconciliation, liquidated damages, claims settlement' },

    // 7 Shared Systems
    { id: QSModuleId.ES_01, name: 'Measurement Standards Engine', category: 'SHARED_SYSTEM', phase: 2, status: 'FOUNDATION_PLACEHOLDER', description: 'Rule definitions and standard method validation (SLS 573, CESMM4, NRM2, SMM7, POMI)' },
    { id: QSModuleId.ES_02, name: 'Construction Specifications Engine', category: 'SHARED_SYSTEM', phase: 2, status: 'FOUNDATION_PLACEHOLDER', description: 'CIDA, MasterFormat, and custom specification clause linkage' },
    { id: QSModuleId.ES_03, name: 'Contract Rules Engine', category: 'SHARED_SYSTEM', phase: 3, status: 'FOUNDATION_PLACEHOLDER', description: 'FIDIC Red/Yellow, CIDA SBD-01/02 condition compliance engine' },
    { id: QSModuleId.ES_04, name: 'Drawing Revision Management', category: 'SHARED_SYSTEM', phase: 2, status: 'FOUNDATION_PLACEHOLDER', description: 'Cloud-delta revision comparison and geometric change detection' },
    { id: QSModuleId.ES_05, name: 'Document Control', category: 'SHARED_SYSTEM', phase: 2, status: 'FOUNDATION_PLACEHOLDER', description: 'Transmittals, submittals, RFI audit tracking' },
    { id: QSModuleId.ES_06, name: 'Commercial Reporting', category: 'SHARED_SYSTEM', phase: 2, status: 'FOUNDATION_PLACEHOLDER', description: 'Executive cost dashboards, BOQ exports, certificate printing' },
    { id: QSModuleId.ES_07, name: 'Quality Assurance & Audit', category: 'SHARED_SYSTEM', phase: 2, status: 'FOUNDATION_PLACEHOLDER', description: 'Immutable provenance audit logging for measurements, rates, and sign-offs' },

    // 1 Smart Selective Scope Engine
    { id: QSModuleId.SSQ_01, name: 'Smart Selective QS', category: 'SELECTIVE_SCOPE', phase: 2, status: 'FOUNDATION_PLACEHOLDER', description: 'Multi-granularity takeoff scoping: project, floor, room, element, polygon, trade' },

    // 4 Advanced Features
    { id: QSModuleId.AF_01, name: 'AI Auto-Detection & One-Click Takeoff', category: 'ADVANCED_FEATURE', phase: 2, status: 'FOUNDATION_PLACEHOLDER', description: 'Computer-vision assisted element deduction; user-confirmed calculation only' },
    { id: QSModuleId.AF_02, name: 'Interactive 3D BIM Viewer', category: 'ADVANCED_FEATURE', phase: 2, status: 'FOUNDATION_PLACEHOLDER', description: 'Browser-based IFC/glTF rendering with direct BIM element quantity queries' },
    { id: QSModuleId.AF_03, name: 'AI Drawing Conflict Detection', category: 'ADVANCED_FEATURE', phase: 3, status: 'FOUNDATION_PLACEHOLDER', description: 'Structural vs architectural cross-drawing clash and dimension mismatch detection' },
    { id: QSModuleId.AF_04, name: 'Conversational QS Copilot', category: 'ADVANCED_FEATURE', phase: 3, status: 'FOUNDATION_PLACEHOLDER', description: 'Natural language queries over project BOQs, contracts, specifications, and drawing revisions' },
  ];

  getCapabilities(): CapabilityMeta[] {
    return this.capabilities;
  }
}
