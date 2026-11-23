'use client';

import React from 'react';
import { AppShell } from '@/components/shell/AppShell';
import { ModulePlaceholder } from '@/components/modules/ModulePlaceholder';

export default function TendersPage() {
  return (
    <AppShell>
      <ModulePlaceholder
        code="QS-05"
        title="Tender Management & Bid Evaluation"
        category="QS Core Module"
        phase={3}
        standard="CIDA SBD / FIDIC Procurement Guidelines"
        description="Package trade work items into competitive tender packages, manage bidder distribution, issue formal addenda, and perform automated bid comparison matrices."
        boundaries={[
          'Subcontractor and supplier trade tender packaging',
          'Automated tender comparison matrix and rate outlier detection',
          'Addenda issuance with drawing revision cross-checks',
          'Commercial evaluation reporting with recommendation letters',
        ]}
      />
    </AppShell>
  );
}
