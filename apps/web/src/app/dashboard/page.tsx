'use client';

import React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import {
  Building2,
  FileSpreadsheet,
  Ruler,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#F8FAFC]">Commercial QS Workspace</h1>
            <p className="text-xs text-[#94A3B8]">
              BuildMind AI v5.0 Foundation • Active Standard Context: <span className="text-[#14B8A6] font-medium">SLS 573:1999 (Sri Lanka)</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#14B8A6] hover:bg-[#0D9488] text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Building2 className="w-3.5 h-3.5" />
              Manage Projects
            </Link>
          </div>
        </div>

        {/* Status Alert Banner */}
        <div className="p-4 rounded-xl bg-[#111C35] border border-[#1E2E4E] flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[#14B8A6] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-xs font-semibold text-[#F8FAFC]">
              Phase 1 Enterprise Foundation Verified
            </h2>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Monorepo architecture, NestJS backend API, FastAPI AI worker, PostgreSQL/Prisma data models, and the Navy/Teal design system are fully initialized.
              No fake data or simulated commercial metrics are shown below. Real database project telemetry will activate in Phase 2.
            </p>
          </div>
        </div>

        {/* Commercial Metric Cards (Placeholder with explicit zero-state) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#111C35] border border-[#1E2E4E]">
            <div className="flex items-center justify-between text-xs text-[#64748B] mb-2">
              <span>Active Projects</span>
              <Building2 className="w-4 h-4 text-[#14B8A6]" />
            </div>
            <div className="text-2xl font-bold text-[#F8FAFC]">0</div>
            <div className="text-[11px] text-[#64748B] mt-1">Gated for Phase 2 auth</div>
          </div>

          <div className="p-4 rounded-xl bg-[#111C35] border border-[#1E2E4E]">
            <div className="flex items-center justify-between text-xs text-[#64748B] mb-2">
              <span>Takeoff Sheets</span>
              <Ruler className="w-4 h-4 text-[#14B8A6]" />
            </div>
            <div className="text-2xl font-bold text-[#F8FAFC]">0</div>
            <div className="text-[11px] text-[#64748B] mt-1">QS-01 Takeoff engine pending</div>
          </div>

          <div className="p-4 rounded-xl bg-[#111C35] border border-[#1E2E4E]">
            <div className="flex items-center justify-between text-xs text-[#64748B] mb-2">
              <span>Generated BOQs</span>
              <FileSpreadsheet className="w-4 h-4 text-[#14B8A6]" />
            </div>
            <div className="text-2xl font-bold text-[#F8FAFC]">0</div>
            <div className="text-[11px] text-[#64748B] mt-1">SLS 573 / CIDA compliant</div>
          </div>

          <div className="p-4 rounded-xl bg-[#111C35] border border-[#1E2E4E]">
            <div className="flex items-center justify-between text-xs text-[#64748B] mb-2">
              <span>Payment Valuations</span>
              <TrendingUp className="w-4 h-4 text-[#14B8A6]" />
            </div>
            <div className="text-2xl font-bold text-[#F8FAFC]">0 LKR</div>
            <div className="text-[11px] text-[#64748B] mt-1">Deterministic arithmetic ready</div>
          </div>
        </div>

        {/* Quick Launchpad to 24 Core Capabilities */}
        <div className="rounded-xl bg-[#111C35] border border-[#1E2E4E] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#F8FAFC]">
              Core Quantity Surveying Modules (Roadmap Directory)
            </h2>
            <span className="text-xs text-[#64748B]">12 Domain Modules</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { code: 'QS-01', name: 'Quantity Takeoff', href: '/takeoff' },
              { code: 'QS-02', name: 'Cost Estimation', href: '/estimation' },
              { code: 'QS-03', name: 'BOQ Generation', href: '/boq' },
              { code: 'QS-04', name: 'Budget Planning', href: '/budgets' },
              { code: 'QS-05', name: 'Tender Management', href: '/tenders' },
              { code: 'QS-06', name: 'Contract Administration', href: '/contracts' },
              { code: 'QS-07', name: 'Procurement Management', href: '/procurement' },
              { code: 'QS-08', name: 'Cost Control & EVM', href: '/cost-control' },
              { code: 'QS-09', name: 'Interim Valuations', href: '/valuations' },
              { code: 'QS-10', name: 'Variation Management', href: '/variations' },
              { code: 'QS-11', name: 'Risk & Value Engineering', href: '/risk-value' },
              { code: 'QS-12', name: 'Final Accounts', href: '/final-accounts' },
            ].map((mod) => (
              <Link
                key={mod.code}
                href={mod.href}
                className="p-3 rounded-lg bg-[#0B1220] border border-[#1E2E4E] hover:border-[#14B8A6]/40 flex items-center justify-between text-xs transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[#14B8A6] font-semibold">{mod.code}</span>
                  <span className="text-[#CBD5E1] group-hover:text-[#F8FAFC]">{mod.name}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#14B8A6]" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
