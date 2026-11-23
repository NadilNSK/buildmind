'use client';

import React from 'react';
import { AppShell } from '@/components/shell/AppShell';
import { ModulePlaceholder } from '@/components/modules/ModulePlaceholder';

export default function QSCopilotPage() {
  return (
    <AppShell>
      <ModulePlaceholder
        code="AF-04"
        title="Conversational QS Copilot"
        category="Advanced Feature"
        phase={3}
        standard="Domain-Specialized RAG Architecture"
        description="Specialized conversational assistant for quantity surveyors. Leverages retrieval-augmented generation over project drawings, contracts, specifications, and BOQ work items."
        boundaries={[
          'Natural language queries grounded strictly in project documentation',
          'Full citation provenance (drawing sheet, revision, clause number)',
          'Deterministic separation: Copilot suggests formulas, QS confirms calculation',
          'Zero simulated responses in Phase 1 (connected to services/ai-worker in Phase 3)',
        ]}
      />
    </AppShell>
  );
}
