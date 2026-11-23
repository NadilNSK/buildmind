'use client';

import React from 'react';
import { AppShell } from '@/components/shell/AppShell';
import { ModulePlaceholder } from '@/components/modules/ModulePlaceholder';

export default function CostControlPage() {
  return (
    <AppShell>
      <ModulePlaceholder
        code="QS-08"
        title="Cost Control & Earned Value Management"
        category="QS Core Module"
        phase={3}
        standard="EVM (Earned Value Management) / Cost-to-Complete"
        description="Real-time commercial monitoring using Earned Value Analysis: Planned Value (PV), Earned Value (EV), Actual Cost (AC), Cost Variance (CV), Schedule Variance (SV), and Cost Performance Index (CPI)."
        boundaries={[
          'Earned Value calculation engine with exact decimal precision',
          'Cost-to-Complete (CTC) and Estimate at Completion (EAC) projections',
          'Trade-by-trade cost variance heatmaps',
          'Executive cost report export conforming to ES-06 format',
        ]}
      />
    </AppShell>
  );
}
