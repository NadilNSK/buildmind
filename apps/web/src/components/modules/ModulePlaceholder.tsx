import React from 'react';
import Link from 'next/link';
import { Clock, ShieldAlert, ArrowLeft, BookOpen, Layers } from 'lucide-react';

interface ModulePlaceholderProps {
  code: string;
  title: string;
  category: 'QS Core Module' | 'Enterprise Shared System' | 'Smart Selective Scope' | 'Advanced Feature';
  phase: number;
  standard: string;
  description: string;
  boundaries: string[];
}

export function ModulePlaceholder({
  code,
  title,
  category,
  phase,
  standard,
  description,
  boundaries,
}: ModulePlaceholderProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#64748B]">
        <Link href="/dashboard" className="hover:text-[#14B8A6] flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </Link>
        <span>/</span>
        <span className="text-[#94A3B8]">{category}</span>
        <span>/</span>
        <span className="text-[#F8FAFC] font-medium">{code}</span>
      </div>

      {/* Hero Card */}
      <div className="rounded-xl bg-[#111C35] border border-[#1E2E4E] p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#14B8A6]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm px-2.5 py-1 rounded bg-[#14B8A6]/15 text-[#14B8A6] border border-[#14B8A6]/30 font-semibold">
              {code}
            </span>
            <span className="text-xs px-2.5 py-1 rounded bg-[#070C16] text-[#94A3B8] border border-[#16223B]">
              {category}
            </span>
            <span className="text-xs px-2.5 py-1 rounded bg-[#070C16] text-[#94A3B8] border border-[#16223B]">
              Standard: {standard}
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#F59E0B] text-xs font-medium">
            <Clock className="w-3.5 h-3.5" />
            <span>Scheduled for Phase {phase}</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-[#F8FAFC] mb-2">{title}</h1>
        <p className="text-sm text-[#94A3B8] leading-relaxed mb-6">{description}</p>

        {/* Planned Engineering Boundaries */}
        <div className="border-t border-[#1E2E4E] pt-5 mt-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#CBD5E1] mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#14B8A6]" />
            Approved Architectural Capabilities & Boundaries
          </h2>
          <ul className="grid sm:grid-cols-2 gap-2 text-xs text-[#94A3B8]">
            {boundaries.map((boundary, idx) => (
              <li key={idx} className="flex items-start gap-2 bg-[#0B1220]/60 p-2.5 rounded border border-[#1E2E4E]/60">
                <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6] mt-1.5 shrink-0" />
                <span>{boundary}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Engineering Integrity Notice */}
      <div className="rounded-lg bg-[#070C16] border border-[#16223B] p-4 flex items-start gap-3 text-xs">
        <ShieldAlert className="w-4 h-4 text-[#14B8A6] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-[#CBD5E1]">Phase 1 Engineering Notice: No Fabricated Calculations</div>
          <p className="text-[#64748B] leading-relaxed">
            In strict compliance with BuildMind AI architectural directives, Phase 1 delivers foundational infrastructure only.
            Deterministic rate build-ups, automated takeoff extraction, and contract workflows are not faked with mock data.
            This module route is live and ready to receive Phase {phase} domain services.
          </p>
        </div>
      </div>

      {/* Documentation Link */}
      <div className="flex justify-end">
        <Link
          href="https://github.com/buildmind"
          target="_blank"
          className="inline-flex items-center gap-1.5 text-xs text-[#14B8A6] hover:underline"
        >
          <BookOpen className="w-3.5 h-3.5" /> View Scope Specification (docs/requirements/FEATURE_SCOPE.md)
        </Link>
      </div>
    </div>
  );
}
