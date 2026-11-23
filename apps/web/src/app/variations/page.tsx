'use client';

import React from 'react';
import { AppShell } from '@/components/shell/AppShell';
import { ModulePlaceholder } from '@/components/modules/ModulePlaceholder';

export default function VariationsPage() {
  return (
    <AppShell>
      <ModulePlaceholder
        code="QS-10"
        title="Variation Management & Rate Derivations"
        category="QS Core Module"
        phase={2}
        standard="FIDIC Clause 13 / CIDA SBD Variations"
        description="Comprehensive change order register for client, engineer, and contractor claims. Calculates cost impact based on contract rates, pro-rata rates, or star/daywork rate build-ups."
        boundaries={[
          'Formal Variation Order (VO) issuance and status workflow',
          'Rate derivation hierarchy: Contract -> Pro-rata -> Daywork build-up',
          'Direct linkage to drawing revision deltas (ES-04)',
          'Cumulative impact on original contract sum and completion date',
        ]}
      />
    </AppShell>
  );
}
