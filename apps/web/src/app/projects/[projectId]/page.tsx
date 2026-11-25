'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { ProjectHeader } from '@/components/project/ProjectHeader';
import { ProjectNav } from '@/components/project/ProjectNav';
import {
  Building2,
  Users,
  Coins,
  Calendar,
  Ruler,
  Network,
  ListTree,
  Settings,
  Activity,
  ArrowRight,
  ShieldCheck,
  Clock,
  Briefcase,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Layers,
  FileSpreadsheet,
  Calculator,
  Compass,
} from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api-client';
import { useOrganization } from '@/context/organization-context';

export default function ProjectOverviewPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { currentOrganization } = useOrganization();

  const [overviewData, setOverviewData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOverview = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiClient<any>(`/projects/${projectId}/overview`);
      setOverviewData(data);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load project overview';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      void loadOverview();
    }
  }, [projectId, currentOrganization?.id]);

  if (isLoading && !overviewData) {
    return (
      <AppShell>
        <div className="py-20 flex flex-col items-center justify-center space-y-3 text-xs text-[#94A3B8]">
          <Loader2 className="w-6 h-6 animate-spin text-[#14B8A6]" />
          <span>Loading project workspace overview...</span>
        </div>
      </AppShell>
    );
  }

  const project = overviewData?.project;
  const metrics = overviewData?.metrics || {
    memberCount: 0,
    spatialNodeCount: 0,
    workPackageCount: 0,
  };
  const recentActivity = overviewData?.recentActivity || [];

  const formattedValue = project?.estimatedContractValue
    ? `${project.currency || 'LKR'} ${Number(project.estimatedContractValue).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : 'Not Specified';

  return (
    <AppShell>
      <div className="space-y-6 max-w-6xl mx-auto">
        {project && <ProjectHeader project={project} />}

        {error && (
          <div className="p-3.5 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 flex items-center gap-2.5 text-xs text-[#EF4444]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <ProjectNav
          projectId={projectId}
          memberCount={metrics.memberCount}
          spatialNodeCount={metrics.spatialNodeCount}
          workPackageCount={metrics.workPackageCount}
        />

        {/* 4 Key Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Commercial & Financials */}
          <div className="p-5 rounded-xl bg-[#111C35] border border-[#1E2E4E] shadow-md space-y-3">
            <div className="flex items-center justify-between text-[#14B8A6]">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                Estimated Value
              </span>
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-bold font-mono text-[#F8FAFC] truncate">
                {formattedValue}
              </div>
              <div className="text-[11px] text-[#64748B] mt-1">
                Currency: <span className="text-[#CBD5E1] font-mono">{project?.currency}</span>
              </div>
            </div>
            <div className="pt-2 border-t border-[#1E2E4E] flex items-center justify-between text-[11px] text-[#94A3B8]">
              <span>Unit System:</span>
              <span className="font-mono text-[#CBD5E1]">{project?.measurementUnitSystem || 'METRIC'}</span>
            </div>
          </div>

          {/* Card 2: Key Stakeholders */}
          <div className="p-5 rounded-xl bg-[#111C35] border border-[#1E2E4E] shadow-md space-y-3">
            <div className="flex items-center justify-between text-[#3B82F6]">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                Stakeholders
              </span>
              <Briefcase className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <div className="text-xs">
                <span className="text-[#64748B]">Client: </span>
                <span className="text-[#F8FAFC] font-medium">{project?.clientName || 'Not specified'}</span>
              </div>
              <div className="text-xs">
                <span className="text-[#64748B]">Contractor: </span>
                <span className="text-[#F8FAFC] font-medium">{project?.contractorName || 'Not specified'}</span>
              </div>
            </div>
            <div className="pt-2 border-t border-[#1E2E4E] text-[11px] text-[#94A3B8] truncate">
              PM: <span className="text-[#CBD5E1]">{project?.projectManager || 'Not assigned'}</span>
            </div>
          </div>

          {/* Card 3: Timeline & Schedule */}
          <div className="p-5 rounded-xl bg-[#111C35] border border-[#1E2E4E] shadow-md space-y-3">
            <div className="flex items-center justify-between text-[#F59E0B]">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                Timeline
              </span>
              <Calendar className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <div className="text-xs">
                <span className="text-[#64748B]">Start: </span>
                <span className="text-[#F8FAFC] font-mono">
                  {project?.startDate ? new Date(project.startDate).toLocaleDateString() : 'TBD'}
                </span>
              </div>
              <div className="text-xs">
                <span className="text-[#64748B]">Target End: </span>
                <span className="text-[#F8FAFC] font-mono">
                  {project?.expectedCompletionDate
                    ? new Date(project.expectedCompletionDate).toLocaleDateString()
                    : 'TBD'}
                </span>
              </div>
            </div>
            <div className="pt-2 border-t border-[#1E2E4E] text-[11px] text-[#94A3B8] flex items-center justify-between">
              <span>Lifecycle:</span>
              <span className="font-mono text-[#F59E0B]">{project?.status}</span>
            </div>
          </div>

          {/* Card 4: Structure & Hierarchy */}
          <div className="p-5 rounded-xl bg-[#111C35] border border-[#1E2E4E] shadow-md space-y-3">
            <div className="flex items-center justify-between text-[#8B5CF6]">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                Hierarchy & Team
              </span>
              <Layers className="w-4 h-4" />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-1.5 rounded bg-[#070C16] border border-[#1E2E4E]">
                <div className="text-base font-bold font-mono text-[#14B8A6]">{metrics.spatialNodeCount}</div>
                <div className="text-[9px] text-[#64748B] uppercase">SBS</div>
              </div>
              <div className="p-1.5 rounded bg-[#070C16] border border-[#1E2E4E]">
                <div className="text-base font-bold font-mono text-[#3B82F6]">{metrics.workPackageCount}</div>
                <div className="text-[9px] text-[#64748B] uppercase">WBS</div>
              </div>
              <div className="p-1.5 rounded bg-[#070C16] border border-[#1E2E4E]">
                <div className="text-base font-bold font-mono text-[#8B5CF6]">{metrics.memberCount}</div>
                <div className="text-[9px] text-[#64748B] uppercase">Team</div>
              </div>
            </div>
            <div className="pt-2 border-t border-[#1E2E4E] text-[11px] text-[#94A3B8] flex items-center justify-between">
              <span>Standard:</span>
              <span className="font-mono text-[#14B8A6]">{project?.measurementStandard}</span>
            </div>
          </div>
        </div>

        {/* Quick Management Shortcuts */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href={`/projects/${projectId}/spatial`}
            className="p-4 rounded-xl bg-[#111C35]/60 hover:bg-[#111C35] border border-[#1E2E4E] hover:border-[#14B8A6]/50 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#14B8A6]/10 border border-[#14B8A6]/20 flex items-center justify-center text-[#14B8A6]">
                <Network className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xs font-semibold text-[#F8FAFC] group-hover:text-[#14B8A6] transition-colors">
                  Spatial Breakdown Structure
                </h2>
                <p className="text-[11px] text-[#64748B]">
                  Organize site, buildings, floors, zones & rooms
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#64748B] group-hover:text-[#14B8A6] transition-colors" />
          </Link>

          <Link
            href={`/projects/${projectId}/work-packages`}
            className="p-4 rounded-xl bg-[#111C35]/60 hover:bg-[#111C35] border border-[#1E2E4E] hover:border-[#3B82F6]/50 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/20 flex items-center justify-center text-[#3B82F6]">
                <ListTree className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xs font-semibold text-[#F8FAFC] group-hover:text-[#3B82F6] transition-colors">
                  Work Breakdown Structure
                </h2>
                <p className="text-[11px] text-[#64748B]">
                  Configure work packages & trade subdivisions
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#64748B] group-hover:text-[#3B82F6] transition-colors" />
          </Link>

          <Link
            href={`/projects/${projectId}/settings`}
            className="p-4 rounded-xl bg-[#111C35]/60 hover:bg-[#111C35] border border-[#1E2E4E] hover:border-[#8B5CF6]/50 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 flex items-center justify-center text-[#8B5CF6]">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xs font-semibold text-[#F8FAFC] group-hover:text-[#8B5CF6] transition-colors">
                  Project Settings & Metadata
                </h2>
                <p className="text-[11px] text-[#64748B]">
                  Edit stakeholders, standards, status & value
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#64748B] group-hover:text-[#8B5CF6] transition-colors" />
          </Link>
        </div>

        {/* Audit Activity Stream */}
        <div className="rounded-xl bg-[#111C35] border border-[#1E2E4E] p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E2E4E] pb-3">
            <h2 className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#14B8A6]" />
              <span>Project Audit Stream & Governance Activity</span>
            </h2>
            <span className="text-[11px] text-[#64748B]">Real-time tenant audit log</span>
          </div>

          {recentActivity.length > 0 ? (
            <div className="divide-y divide-[#1E2E4E]/60">
              {recentActivity.map((event: any) => (
                <div key={event.id} className="py-2.5 flex items-start justify-between gap-4 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-[#14B8A6] shrink-0" />
                    <div>
                      <span className="font-mono text-[11px] text-[#CBD5E1] bg-[#070C16] px-2 py-0.5 rounded border border-[#1E2E4E]">
                        {event.eventType}
                      </span>
                      {event.user && (
                        <span className="text-[#94A3B8] ml-2 text-[11px]">
                          by <strong className="text-[#F8FAFC]">{event.user.fullName}</strong> ({event.user.email})
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] text-[#64748B] font-mono shrink-0">
                    {new Date(event.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-[#64748B] space-y-1">
              <Clock className="w-5 h-5 mx-auto text-[#64748B]/60 mb-2" />
              <p>No recent project audit events recorded yet.</p>
              <p className="text-[11px] text-[#475569]">Events will appear automatically as configuration changes occur.</p>
            </div>
          )}
        </div>

        {/* Planned Commercial Modules Roadmap */}
        <div className="rounded-xl bg-[#111C35] border border-[#1E2E4E] p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E2E4E] pb-3">
            <div>
              <h2 className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#14B8A6]" />
                <span>Quantity Surveying & Commercial Modules (Approved Scope)</span>
              </h2>
              <p className="text-xs text-[#94A3B8]">
                12 Core QS Modules scheduled across future phases with deterministic calculation engines.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { code: 'QS-01', title: 'Quantity Takeoff', phase: 'Phase 4', standard: 'ES-01' },
              { code: 'QS-02', title: 'Cost Estimation', phase: 'Phase 4', standard: 'SLS 573' },
              { code: 'QS-03', title: 'BOQ Generation', phase: 'Phase 5', standard: 'CIDA' },
              { code: 'QS-04', title: 'Budget Planning', phase: 'Phase 5', standard: 'Cost Model' },
              { code: 'QS-05', title: 'Tender Management', phase: 'Phase 6', standard: 'Procurement' },
              { code: 'QS-06', title: 'Contract Administration', phase: 'Phase 6', standard: 'ES-03' },
              { code: 'QS-07', title: 'Procurement Management', phase: 'Phase 7', standard: 'Supply Chain' },
              { code: 'QS-08', title: 'Cost Control & Monitoring', phase: 'Phase 7', standard: 'EVM' },
              { code: 'QS-09', title: 'Interim Valuation', phase: 'Phase 8', standard: 'Payment Cert.' },
              { code: 'QS-10', title: 'Variation Management', phase: 'Phase 8', standard: 'Claims' },
              { code: 'QS-11', title: 'Risk & Value Eng.', phase: 'Phase 9', standard: 'VE Matrix' },
              { code: 'QS-12', title: 'Final Account', phase: 'Phase 9', standard: 'Closeout' },
            ].map((mod) => (
              <div
                key={mod.code}
                className="p-3.5 rounded-lg bg-[#070C16]/60 border border-[#1E2E4E] space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#14B8A6] bg-[#14B8A6]/10 px-1.5 py-0.5 rounded border border-[#14B8A6]/20">
                    {mod.code}
                  </span>
                  <span className="text-[10px] font-mono text-[#F59E0B] bg-[#F59E0B]/10 px-1.5 py-0.5 rounded border border-[#F59E0B]/20">
                    {mod.phase}
                  </span>
                </div>
                <div className="text-xs font-semibold text-[#CBD5E1] truncate">{mod.title}</div>
                <div className="text-[10px] text-[#64748B]">Standard: {mod.standard}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
