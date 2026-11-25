'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { ProjectHeader } from '@/components/project/ProjectHeader';
import { ProjectNav } from '@/components/project/ProjectNav';
import { DocumentDetailsDrawer } from '@/components/document/DocumentDetailsDrawer';
import { DocumentUploadModal } from '@/components/document/DocumentUploadModal';
import {
  Compass,
  Upload,
  Search,
  Filter,
  Download,
  Eye,
  Layers,
  AlertCircle,
  Loader2,
  RefreshCw,
  GitBranch,
} from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api-client';
import { useOrganization } from '@/context/organization-context';
import {
  DrawingMetadataSummary,
  DocumentDiscipline,
  DrawingType,
  DocumentWorkflowStatus,
} from '@buildmind/shared-types';

export default function ProjectDrawingsPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { hasPermission } = useOrganization();

  // Project state
  const [project, setProject] = useState<any | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);

  // Drawings state
  const [drawings, setDrawings] = useState<DrawingMetadataSummary[]>([]);
  const [totalDrawings, setTotalDrawings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search state
  const [search, setSearch] = useState('');
  const [disciplineFilter, setDisciplineFilter] = useState<string>('');
  const [drawingTypeFilter, setDrawingTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Modals & Drawer
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Permissions
  const canUpload = hasPermission('drawings.upload') || hasPermission('documents.upload');
  const canDownload = hasPermission('documents.download');
  const canUpdate = hasPermission('documents.update');
  const canArchive = hasPermission('documents.archive');
  const canUploadRevision = hasPermission('documents.versions.upload');
  const canApprove = hasPermission('documents.approve');
  const canPublish = hasPermission('documents.publish');

  // Load project details
  useEffect(() => {
    let mounted = true;
    async function loadProject() {
      try {
        setProjectLoading(true);
        const data = await apiClient<any>(`/projects/${projectId}`);
        if (mounted) setProject(data);
      } catch (err) {
        console.error('Failed to load project header', err);
      } finally {
        if (mounted) setProjectLoading(false);
      }
    }
    void loadProject();
    return () => {
      mounted = false;
    };
  }, [projectId]);

  // Load Drawings
  const loadDrawings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const query = new URLSearchParams();
      if (search.trim()) query.set('search', search.trim());
      if (disciplineFilter) query.set('discipline', disciplineFilter);
      if (drawingTypeFilter) query.set('drawingType', drawingTypeFilter);
      if (statusFilter) query.set('status', statusFilter);

      const qs = query.toString();
      const endpoint = `/projects/${projectId}/drawings${qs ? `?${qs}` : ''}`;
      const res = await apiClient<{ items: DrawingMetadataSummary[]; total: number }>(endpoint);

      setDrawings(res.items || []);
      setTotalDrawings(res.total || 0);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load drawings';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [projectId, search, disciplineFilter, drawingTypeFilter, statusFilter]);

  useEffect(() => {
    void loadDrawings();
  }, [loadDrawings]);

  const handleDownloadDrawing = async (documentId: string) => {
    try {
      const { downloadUrl } = await apiClient<{ downloadUrl: string }>(
        `/projects/${projectId}/documents/${documentId}/download-url`,
      );
      window.open(downloadUrl, '_blank');
    } catch {
      window.open(`/api/v1/projects/${projectId}/documents/${documentId}/download`, '_blank');
    }
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Project Header & Navigation */}
        <ProjectHeader project={project} loading={projectLoading} />
        <ProjectNav projectId={projectId} drawingCount={totalDrawings} />

        {/* Action Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#F8FAFC] tracking-tight flex items-center gap-2">
              <Compass className="w-5 h-5 text-[#14B8A6]" />
              <span>Drawing Register</span>
            </h1>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Formal engineering drawing register tracking disciplines, sheet sizes, scales, and active revisions
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => void loadDrawings()}
              disabled={loading}
              className="p-2 rounded-lg bg-[#111C35] hover:bg-[#1E2E4E] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#1E2E4E] transition-colors"
              title="Refresh Drawings"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {canUpload && (
              <button
                data-testid="btn-upload-drawing"
                onClick={() => setIsUploadModalOpen(true)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#14B8A6] hover:bg-[#0D9488] text-[#0D1527] font-bold transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Drawing</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 rounded-xl bg-[#111C35]/60 border border-[#1E2E4E] flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              data-testid="input-drawing-search"
              placeholder="Search by drawing number, title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#0D1527] border border-[#1E2E4E] text-xs text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#14B8A6]"
            />
          </div>

          {/* Discipline Filter */}
          <select
            value={disciplineFilter}
            onChange={(e) => setDisciplineFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[#0D1527] border border-[#1E2E4E] text-xs text-[#F8FAFC] focus:outline-none focus:border-[#14B8A6]"
          >
            <option value="">All Disciplines</option>
            {Object.values(DocumentDiscipline).map((d) => (
              <option key={d} value={d}>
                {d.replace(/_/g, ' ')}
              </option>
            ))}
          </select>

          {/* Drawing Type Filter */}
          <select
            value={drawingTypeFilter}
            onChange={(e) => setDrawingTypeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[#0D1527] border border-[#1E2E4E] text-xs text-[#F8FAFC] focus:outline-none focus:border-[#14B8A6]"
          >
            <option value="">All Drawing Types</option>
            {Object.values(DrawingType).map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, ' ')}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[#0D1527] border border-[#1E2E4E] text-xs text-[#F8FAFC] focus:outline-none focus:border-[#14B8A6]"
          >
            <option value="">All Workflow Statuses</option>
            {Object.values(DocumentWorkflowStatus).map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center gap-2 text-xs text-[#EF4444]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Drawings Register Table */}
        <div className="rounded-xl border border-[#1E2E4E] bg-[#0D1527] overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#94A3B8] space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#14B8A6]" />
              <span className="text-xs">Loading drawing register...</span>
            </div>
          ) : drawings.length === 0 ? (
            <div className="py-16 text-center text-[#94A3B8] space-y-3">
              <Compass className="w-10 h-10 mx-auto text-[#64748B]" />
              <p className="text-sm font-semibold text-[#F8FAFC]">No drawings registered</p>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                Upload architectural, structural, or MEP drawings to populate the project drawing register.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs" data-testid="drawings-table">
                <thead className="bg-[#111C35] text-[11px] text-[#94A3B8] uppercase border-b border-[#1E2E4E]">
                  <tr>
                    <th className="py-3 px-4">Drawing Number</th>
                    <th className="py-3 px-4">Drawing Title</th>
                    <th className="py-3 px-4">Discipline</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Size & Scale</th>
                    <th className="py-3 px-4">Current Rev</th>
                    <th className="py-3 px-4">Workflow Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2E4E]/60 text-[#F8FAFC]">
                  {drawings.map((dwg) => (
                    <tr
                      key={dwg.id}
                      className="hover:bg-[#111C35]/50 transition-colors cursor-pointer group"
                      onClick={() => {
                        setSelectedDocumentId(dwg.documentId);
                        setIsDrawerOpen(true);
                      }}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-[#14B8A6]">
                        {dwg.drawingNumber}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#F8FAFC] max-w-xs truncate">
                        {dwg.drawingTitle}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#111C35] border border-[#1E2E4E] text-[#94A3B8]">
                          {dwg.discipline.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#94A3B8]">
                        {dwg.drawingType ? dwg.drawingType.replace(/_/g, ' ') : '—'}
                      </td>
                      <td className="py-3 px-4 text-[#94A3B8] font-mono text-[11px]">
                        {dwg.sheetSize || '—'} {dwg.declaredScale ? `(${dwg.declaredScale})` : ''}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#1E2E4E] text-[#F8FAFC]">
                          Rev {dwg.currentRevisionCode}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            dwg.workflowStatus === 'PUBLISHED'
                              ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30'
                              : dwg.workflowStatus === 'SUPERSEDED'
                              ? 'bg-[#64748B]/20 text-[#94A3B8]'
                              : dwg.workflowStatus === 'APPROVED'
                              ? 'bg-[#06B6D4]/20 text-[#06B6D4]'
                              : dwg.workflowStatus === 'UNDER_REVIEW'
                              ? 'bg-[#3B82F6]/20 text-[#3B82F6]'
                              : dwg.workflowStatus === 'SUBMITTED'
                              ? 'bg-[#8B5CF6]/20 text-[#8B5CF6]'
                              : 'bg-[#F59E0B]/20 text-[#F59E0B]'
                          }`}
                        >
                          {(dwg.workflowStatus || 'PUBLISHED').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td
                        className="py-3 px-4 text-right space-x-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDocumentId(dwg.documentId);
                            setIsDrawerOpen(true);
                          }}
                          className="p-1 rounded text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E2E4E] transition-colors"
                          title="View Drawing Details & Revisions"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canDownload && (
                          <button
                            type="button"
                            onClick={() => handleDownloadDrawing(dwg.documentId)}
                            className="p-1 rounded text-[#94A3B8] hover:text-[#14B8A6] hover:bg-[#1E2E4E] transition-colors"
                            title="Download Current Drawing"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Upload Modal */}
        <DocumentUploadModal
          projectId={projectId}
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onSuccess={() => void loadDrawings()}
        />

        {/* Details Drawer */}
        <DocumentDetailsDrawer
          projectId={projectId}
          documentId={selectedDocumentId}
          isOpen={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false);
            setSelectedDocumentId(null);
          }}
          onUpdated={() => void loadDrawings()}
          canEdit={canUpdate}
          canArchive={canArchive}
          canDownload={canDownload}
          canUploadRevision={canUploadRevision}
          canApprove={canApprove}
          canPublish={canPublish}
        />
      </div>
    </AppShell>
  );
}
