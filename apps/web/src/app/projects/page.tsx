'use client';

import React from 'react';
import { AppShell } from '@/components/shell/AppShell';
import { Building2, Plus, ShieldCheck, Compass } from 'lucide-react';

export default function ProjectsPage() {
  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#F8FAFC]">Projects Portfolio</h1>
            <p className="text-xs text-[#94A3B8]">
              Manage construction projects, measurement standards (SLS 573 / CESMM4 / NRM2), and multi-tenant isolation.
            </p>
          </div>
          <button
            disabled
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-[#14B8A6]/40 text-[#CBD5E1] text-xs font-semibold cursor-not-allowed border border-[#14B8A6]/30"
          >
            <Plus className="w-3.5 h-3.5" />
            New Project (Phase 2)
          </button>
        </div>

        {/* Database Architecture Notice */}
        <div className="p-4 rounded-xl bg-[#111C35] border border-[#1E2E4E] flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[#14B8A6] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-xs font-semibold text-[#F8FAFC]">
              Prisma Project Data Model Configured
            </h2>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              The database schema provides the <code>Project</code> entity with UUID keys, <code>organizationId</code> multi-tenant scope,
              measurement standard binding (<code>SLS_573</code>, <code>CESMM4</code>, <code>NRM2</code>, <code>SMM7</code>, <code>POMI</code>),
              and contract condition binding (<code>CIDA_SBD_01/02</code>, <code>FIDIC_RED</code>).
              Interactive project creation will activate once the Phase 2 authentication session is wired.
            </p>
          </div>
        </div>

        {/* Empty State */}
        <div className="p-12 rounded-xl bg-[#070C16] border border-[#16223B] text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#111C35] border border-[#1E2E4E] flex items-center justify-center mx-auto text-[#14B8A6]">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-[#F8FAFC]">No Live Projects Loaded</h3>
            <p className="text-xs text-[#64748B] max-w-md mx-auto">
              Project records will be stored in PostgreSQL via <code>packages/database</code> upon Phase 2 activation.
              No fake simulation records are injected.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 text-xs text-[#14B8A6] font-mono bg-[#14B8A6]/10 px-3 py-1 rounded border border-[#14B8A6]/20">
            <Compass className="w-3.5 h-3.5" /> Ready for Sri Lankan & International Projects
          </div>
        </div>
      </div>
    </AppShell>
  );
}
