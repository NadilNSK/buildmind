'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Building2, MapPin, Calendar, Coins, ShieldCheck, Ruler } from 'lucide-react';
import { ProjectStatus, ProjectType } from '@buildmind/shared-types';

interface ProjectHeaderProps {
  project?: {
    id: string;
    code: string;
    name: string;
    description?: string | null;
    projectType?: string | null;
    status: string;
    country?: string | null;
    location?: string | null;
    clientName?: string | null;
    contractorName?: string | null;
    consultantName?: string | null;
    projectManager?: string | null;
    estimatedContractValue?: string | null;
    currency?: string | null;
    measurementStandard?: string | null;
    measurementUnitSystem?: string | null;
    contractStandard?: string | null;
  } | null;
  loading?: boolean;
}

const STATUS_COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  PLANNING: { bg: 'bg-[#3B82F6]/10', text: 'text-[#3B82F6]', border: 'border-[#3B82F6]/30' },
  DESIGN: { bg: 'bg-[#8B5CF6]/10', text: 'text-[#8B5CF6]', border: 'border-[#8B5CF6]/30' },
  TENDERING: { bg: 'bg-[#F59E0B]/10', text: 'text-[#F59E0B]', border: 'border-[#F59E0B]/30' },
  PRE_CONSTRUCTION: { bg: 'bg-[#EC4899]/10', text: 'text-[#EC4899]', border: 'border-[#EC4899]/30' },
  UNDER_CONSTRUCTION: { bg: 'bg-[#10B981]/10', text: 'text-[#10B981]', border: 'border-[#10B981]/30' },
  ACTIVE: { bg: 'bg-[#14B8A6]/10', text: 'text-[#14B8A6]', border: 'border-[#14B8A6]/30' },
  ON_HOLD: { bg: 'bg-[#F97316]/10', text: 'text-[#F97316]', border: 'border-[#F97316]/30' },
  COMMERCIAL_CLOSEOUT: { bg: 'bg-[#6366F1]/10', text: 'text-[#6366F1]', border: 'border-[#6366F1]/30' },
  FINAL_ACCOUNT: { bg: 'bg-[#A855F7]/10', text: 'text-[#A855F7]', border: 'border-[#A855F7]/30' },
  COMPLETED: { bg: 'bg-[#22C55E]/10', text: 'text-[#22C55E]', border: 'border-[#22C55E]/30' },
  CANCELLED: { bg: 'bg-[#EF4444]/10', text: 'text-[#EF4444]', border: 'border-[#EF4444]/30' },
  ARCHIVED: { bg: 'bg-[#64748B]/10', text: 'text-[#94A3B8]', border: 'border-[#64748B]/30' },
};

export function ProjectHeader({ project, loading }: ProjectHeaderProps) {
  if (loading || !project) {
    return (
      <div className="h-20 rounded-xl bg-[#111C35]/50 animate-pulse border border-[#1E2E4E]/50" />
    );
  }

  const statusColors = STATUS_COLOR_MAP[project.status] || {
    bg: 'bg-[#1E2E4E]',
    text: 'text-[#CBD5E1]',
    border: 'border-[#1E2E4E]',
  };

  const formattedValue = project.estimatedContractValue
    ? `${project.currency || 'LKR'} ${Number(project.estimatedContractValue).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : null;

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
        <Link href="/projects" className="hover:text-[#14B8A6] flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Projects Portfolio</span>
        </Link>
        <span>/</span>
        <span className="text-[#F8FAFC] font-mono">{project.code}</span>
      </div>

      {/* Main Banner */}
      <div className="p-6 rounded-2xl bg-[#111C35] border border-[#1E2E4E] shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono bg-[#14B8A6]/15 text-[#14B8A6] px-2.5 py-1 rounded border border-[#14B8A6]/30 font-bold">
              {project.code}
            </span>
            <span
              className={`text-xs font-mono px-2.5 py-1 rounded border font-semibold ${statusColors.bg} ${statusColors.text} ${statusColors.border}`}
            >
              {project.status.replace(/_/g, ' ')}
            </span>
            {project.projectType && (
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#070C16] text-[#94A3B8] border border-[#1E2E4E]">
                {project.projectType.replace(/_/g, ' ')}
              </span>
            )}
            {project.location && (
              <span className="text-xs text-[#94A3B8] flex items-center gap-1 bg-[#070C16] px-2 py-0.5 rounded border border-[#1E2E4E]">
                <MapPin className="w-3 h-3 text-[#14B8A6]" />
                <span>
                  {project.location}
                  {project.country ? `, ${project.country}` : ''}
                </span>
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold text-[#F8FAFC]">{project.name}</h1>

          {project.description && (
            <p className="text-xs text-[#94A3B8] max-w-2xl leading-relaxed">
              {project.description}
            </p>
          )}
        </div>

        {/* Right Info Badges */}
        <div className="flex flex-wrap lg:flex-col items-start lg:items-end gap-2 text-xs text-[#94A3B8]">
          {formattedValue && (
            <div className="flex items-center gap-1.5 bg-[#070C16] px-3 py-1.5 rounded-lg border border-[#1E2E4E]">
              <Coins className="w-3.5 h-3.5 text-[#14B8A6]" />
              <span className="text-[#64748B]">Value:</span>
              <strong className="text-[#10B981] font-mono">{formattedValue}</strong>
            </div>
          )}

          <div className="flex items-center gap-1.5 bg-[#070C16] px-3 py-1.5 rounded-lg border border-[#1E2E4E]">
            <Ruler className="w-3.5 h-3.5 text-[#14B8A6]" />
            <span className="text-[#64748B]">Method:</span>
            <strong className="text-[#14B8A6] font-mono">{project.measurementStandard || 'SLS_573'}</strong>
            {project.measurementUnitSystem && (
              <span className="text-[10px] text-[#64748B] font-mono">({project.measurementUnitSystem})</span>
            )}
          </div>

          {project.contractStandard && (
            <div className="flex items-center gap-1.5 bg-[#070C16] px-3 py-1.5 rounded-lg border border-[#1E2E4E]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#64748B]" />
              <span className="text-[#64748B]">Contract:</span>
              <strong className="text-[#CBD5E1] font-mono">{project.contractStandard}</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
