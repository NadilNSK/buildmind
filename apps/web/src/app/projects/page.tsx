'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import {
  FolderKanban,
  Plus,
  Search,
  Building2,
  Users,
  Compass,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api-client';
import { useOrganization } from '@/context/organization-context';
import {
  ProjectSummary,
  ProjectStatus,
  MeasurementStandard,
} from '@buildmind/shared-types';

export default function ProjectsPage() {
  const { currentOrganization, hasPermission } = useOrganization();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [error, setError] = useState<string | null>(null);

  const canCreate = hasPermission('projects.create');

  const loadProjects = async () => {
    if (!currentOrganization) {
      setProjects([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      let query = '';
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (params.toString()) query = `?${params.toString()}`;

      const data = await apiClient<ProjectSummary[]>(`/projects${query}`);
      setProjects(data);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load projects';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadProjects();
  }, [currentOrganization?.id, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void loadProjects();
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[#F8FAFC]">Projects Portfolio</h1>
              {currentOrganization && (
                <span className="text-xs font-mono text-[#14B8A6] bg-[#14B8A6]/10 px-2 py-0.5 rounded border border-[#14B8A6]/20">
                  {currentOrganization.name}
                </span>
              )}
            </div>
            <p className="text-xs text-[#94A3B8]">
              Manage construction projects, measurement standards (SLS 573 / CESMM4 / NRM2), and multi-tenant commercial data.
            </p>
          </div>

          {canCreate && (
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#14B8A6] hover:bg-[#0D9488] text-[#070C16] text-xs font-semibold transition-colors shadow-sm shadow-[#14B8A6]/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Project</span>
            </Link>
          )}
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 flex items-center gap-2.5 text-xs text-[#EF4444]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="rounded-xl bg-[#111C35] border border-[#1E2E4E] p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="w-full sm:w-80 relative">
            <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by code or name..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#070C16] border border-[#1E2E4E] text-[#F8FAFC] text-xs focus:outline-none focus:border-[#14B8A6]"
            />
          </form>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-[#94A3B8]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-[#070C16] border border-[#1E2E4E] text-[#F8FAFC] text-xs focus:outline-none focus:border-[#14B8A6]"
            >
              <option value="ALL">All Statuses</option>
              <option value={ProjectStatus.PLANNING}>Planning</option>
              <option value={ProjectStatus.TENDERING}>Tendering</option>
              <option value={ProjectStatus.ACTIVE}>Active</option>
              <option value={ProjectStatus.COMMERCIAL_CLOSEOUT}>Commercial Closeout</option>
              <option value={ProjectStatus.FINAL_ACCOUNT}>Final Account</option>
              <option value={ProjectStatus.ARCHIVED}>Archived</option>
            </select>
          </div>
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2 text-xs text-[#94A3B8]">
            <Loader2 className="w-6 h-6 animate-spin text-[#14B8A6]" />
            <span>Loading projects portfolio...</span>
          </div>
        ) : projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((p: any) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="group p-5 rounded-xl bg-[#111C35]/80 hover:bg-[#111C35] border border-[#1E2E4E] hover:border-[#14B8A6]/60 transition-all shadow-md flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono bg-[#14B8A6]/15 text-[#14B8A6] px-2 py-0.5 rounded border border-[#14B8A6]/30">
                        {p.code}
                      </span>
                      <h2 className="text-sm font-bold text-[#F8FAFC] mt-1.5 group-hover:text-[#14B8A6] transition-colors">
                        {p.name}
                      </h2>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1E2E4E] text-[#CBD5E1]">
                      {p.status}
                    </span>
                  </div>

                  {p.description && (
                    <p className="text-xs text-[#94A3B8] line-clamp-2">{p.description}</p>
                  )}
                </div>

                <div className="pt-4 mt-3 border-t border-[#1E2E4E]/60 flex items-center justify-between text-xs text-[#64748B]">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-[#94A3B8]">
                      Method: <strong className="text-[#CBD5E1] font-mono">{p.measurementStandard}</strong>
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-[#94A3B8]">
                      <Users className="w-3 h-3 text-[#14B8A6]" />
                      <span>{p.memberCount ?? 1}</span>
                    </span>
                  </div>

                  <span className="text-[11px] font-mono text-[#CBD5E1]">{p.currency}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-12 rounded-xl bg-[#070C16] border border-[#16223B] text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#111C35] border border-[#1E2E4E] flex items-center justify-center mx-auto text-[#14B8A6]">
              <FolderKanban className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-[#F8FAFC]">No Projects in this Organization</h3>
              <p className="text-xs text-[#64748B] max-w-md mx-auto">
                No projects matched your criteria. Create your first commercial project to begin quantity takeoff, BOQ generation, and cost control.
              </p>
            </div>
            {canCreate && (
              <Link
                href="/projects/new"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#14B8A6] text-[#070C16] text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Project</span>
              </Link>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
