'use client';

import React from 'react';
import { AppShell } from '@/components/shell/AppShell';
import { ModulePlaceholder } from '@/components/modules/ModulePlaceholder';

export default function ProcurementPage() {
  return (
    <AppShell>
      <ModulePlaceholder
        code="QS-07"
        title="Procurement & Material Requisition"
        category="QS Core Module"
        phase={3}
        standard="Commercial Procurement Best Practice"
        description="Streamline commercial requisitions against BOQ material allowances, track supplier quotations, issue purchase orders, and audit delivery against takeoff limits."
        boundaries={[
          'Requisition vs BOQ budget check (over-procurement prevention)',
          'Supplier RFQ comparison and order placement',
          'Long-lead item tracking and commercial delivery schedules',
          'Reconciliation with interim valuation material on site (MOS)',
        ]}
      />
    </AppShell>
  );
}
