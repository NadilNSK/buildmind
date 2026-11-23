'use client';

import React from 'react';
import Link from 'next/link';
import { Building2, ShieldCheck, Activity } from 'lucide-react';

export function Header() {
  return (
    <header className="h-14 bg-[#0B1220]/90 backdrop-blur-md border-b border-[#1E2E4E] px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-4">
        {/* Project Selector Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#111C35] border border-[#1E2E4E] text-xs">
          <Building2 className="w-3.5 h-3.5 text-[#14B8A6]" />
          <span className="text-[#94A3B8]">Project:</span>
          <span className="font-semibold text-[#F8FAFC]">Commercial Development Phase 1</span>
          <span className="text-[10px] font-mono bg-[#14B8A6]/15 text-[#14B8A6] px-1.5 py-0.5 rounded border border-[#14B8A6]/30">
            PRJ-CMB-001
          </span>
        </div>

        {/* Measurement Standard Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#070C16] border border-[#16223B] text-[11px] text-[#94A3B8]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6]"></span>
          <span>Method: <strong className="text-[#CBD5E1]">SLS 573:1999</strong></span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* System Health Status Indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#10B981]/10 border border-[#10B981]/25 text-[11px] text-[#10B981]">
          <Activity className="w-3 h-3 animate-pulse" />
          <span className="font-medium">System Online</span>
        </div>

        {/* Security & Audit Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-[#64748B]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#14B8A6]" />
          <span>Audit Logging Active</span>
        </div>

        {/* User Identity Placeholder */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-[#1E2E4E]">
          <div className="w-7 h-7 rounded-full bg-[#1E2F4C] border border-[#2C436B] flex items-center justify-center text-xs font-semibold text-[#14B8A6]">
            QS
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-medium text-[#F8FAFC]">Senior QS Lead</div>
            <div className="text-[10px] text-[#64748B]">Royal Inst. of QS</div>
          </div>
          <Link
            href="/"
            className="text-[11px] text-[#94A3B8] hover:text-[#14B8A6] ml-2 px-2 py-1 rounded border border-[#1E2E4E] bg-[#111C35]"
          >
            Home
          </Link>
        </div>
      </div>
    </header>
  );
}
