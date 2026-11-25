'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { ProjectHeader } from '@/components/project/ProjectHeader';
import { ProjectNav } from '@/components/project/ProjectNav';
import { DocumentUploadModal } from '@/components/document/DocumentUploadModal';
import { DocumentDetailsDrawer } from '@/components/document/DocumentDetailsDrawer';
import {
  FileText,
  Upload,
  Search,
  Filter,
  Download,
  Eye,
  Archive,
  RotateCcw,
  ShieldCheck,
  HardDrive,
  Layers,
  FolderTree,
  AlertCircle,
  Loader2,
  RefreshCw,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api-client';
import { useOrganization } from '@/context/organization-context';
import {
  DocumentSummary,
  DocumentCategory,
  DocumentDiscipline,
  DocumentFileFormat,
  StorageUsageSummary,
} from '@buildmind/shared-types';

export default function ProjectDocumentsPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { hasPermission } = useOrganization();

  // Project state
  const [project, setProject] = useState<any | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);

  // Documents list state
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Storage usage metrics state
  const [storageUsage, setStorageUsage] = useState<StorageUsageSummary | null>(null);

  // Filter & Search state
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [disciplineFilter, setDisciplineFilter] = useState<string>('');
  const [formatFilter, setFormatFilter] = useState<string>('');
  const [includeArchived, setIncludeArchived] = useState(false);

  // Modals & Drawer state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Permissions
  const canUpload = hasPermission('documents.upload');
  const canDownload = hasPermission('documents.download');
  const canUpdate = hasPermission('documents.update');
  const canArchive = hasPermission('documents.archive');
  const canViewStorage = hasPermission('documents.storage_usage');
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
      } catch {
        // Handled silently or shown in error state
      } finally {
        if (mounted) setProjectLoading(false);
      }
    }
    if (projectId) void loadProject();
    return () => {
      mounted = false;
    };
  }, [projectId]);

  // Load documents and storage usage
  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (categoryFilter) params.append('category', categoryFilter);
      if (disciplineFilter) params.append('discipline', disciplineFilter);
      if (formatFilter) params.append('fileFormat', formatFilter);
      if (includeArchived) params.append('includeArchived', 'true');

      const [docsRes, usageRes] = await Promise.all([
        apiClient<{ items: DocumentSummary[]; total: number }>(
          `/projects/${projectId}/documents?${params.toString()}`,
        ),
        canViewStorage
          ? apiClient<StorageUsageSummary>(`/projects/${projectId}/documents/storage-usage`).catch(
              () => null,
            )
          : Promise.resolve(null),
      ]);

      setDocuments(docsRes.items);
      setTotalDocuments(docsRes.total);
      if (usageRes) setStorageUsage(usageRes);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load documents';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [projectId, search, categoryFilter, disciplineFilter, formatFilter, includeArchived, canViewStorage]);

  useEffect(() => {
    if (projectId) {
      void loadDocuments();
    }
  }, [loadDocuments, projectId]);

  const handleOpenDetails = (docId: string) => {
    setSelectedDocumentId(docId);
    setIsDrawerOpen(true);
  };

  const handleDownload = async (doc: DocumentSummary) => {
    try {
      const { downloadUrl } = await apiClient<{ downloadUrl: string }>(
        `/projects/${projectId}/documents/${doc.id}/download-url`,
      );
      window.open(downloadUrl, '_blank');
    } catch {
      window.open(`/api/v1/projects/${projectId}/documents/${doc.id}/download`, '_blank');
    }
  };

  const handleArchiveToggle = async (doc: DocumentSummary) => {
    try {
      const endpoint = doc.archivedAt
        ? `/projects/${projectId}/documents/${doc.id}/restore`
        : `/projects/${projectId}/documents/${doc.id}/archive`;

      await apiClient(endpoint, { method: 'POST' });
      void loadDocuments();
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to update document status';
      setError(msg);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        {project && <ProjectHeader project={project} />}
        <ProjectNav projectId={projectId} documentCount={totalDocuments} />

        {error && (
          <div className="p-3.5 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 flex items-center gap-2.5 text-xs text-[#EF4444]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Top Header & Storage Summary */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#F8FAFC]">Document Control & Repository</h1>
            <p className="text-xs text-[#94A3B8] mt-1">
              Securely manage architectural drawings, engineering models, BOQs, specifications, and project records.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {canUpload && (
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#14B8A6] hover:bg-[#0D9488] text-[#0D1527] font-bold transition-all shadow-md flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Documents</span>
              </button>
            )}
          </div>
        </div>

        {/* Storage Usage Widget */}
        {storageUsage && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#0D1527] border border-[#1E2E4E] flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-[#14B8A6]/10 border border-[#14B8A6]/20 flex items-center justify-center text-[#14B8A6]">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider block">
                  Storage Utilized
                </span>
                <span className="text-base font-bold text-[#F8FAFC]">
                  {storageUsage.totalBytesFormatted}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0D1527] border border-[#1E2E4E] flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-[#38BDF8]/10 border border-[#38BDF8]/20 flex items-center justify-center text-[#38BDF8]">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider block">
                  Total Active Files
                </span>
                <span className="text-base font-bold text-[#F8FAFC]">
                  {storageUsage.totalDocuments}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0D1527] border border-[#1E2E4E] flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-[#A855F7]/10 border border-[#A855F7]/20 flex items-center justify-center text-[#A855F7]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider block">
                  Integrity & Security
                </span>
                <span className="text-sm font-bold text-[#A855F7] flex items-center gap-1">
                  <span>SHA-256 Verified</span>
                </span>
                <span className="text-[10px] text-[#94A3B8] block">
                  Antivirus: Local Dev Mode
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="p-4 rounded-xl bg-[#0D1527] border border-[#1E2E4E] flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex-1 flex items-center gap-2 relative">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, reference, or filename..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-[#111C35] border border-[#1E2E4E] text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#14B8A6]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg bg-[#111C35] border border-[#1E2E4E] text-[#F8FAFC] focus:outline-none focus:border-[#14B8A6]"
            >
              <option value="">All Categories</option>
              {Object.values(DocumentCategory).map((c) => (
                <option key={c} value={c}>
                  {c.replace(/_/g, ' ')}
                </option>
              ))}
            </select>

            <select
              value={disciplineFilter}
              onChange={(e) => setDisciplineFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg bg-[#111C35] border border-[#1E2E4E] text-[#F8FAFC] focus:outline-none focus:border-[#14B8A6]"
            >
              <option value="">All Disciplines</option>
              {Object.values(DocumentDiscipline).map((d) => (
                <option key={d} value={d}>
                  {d.replace(/_/g, ' ')}
                </option>
              ))}
            </select>

            <select
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg bg-[#111C35] border border-[#1E2E4E] text-[#F8FAFC] focus:outline-none focus:border-[#14B8A6]"
            >
              <option value="">All Formats</option>
              {Object.values(DocumentFileFormat).map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-2 text-xs text-[#94A3B8] px-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeArchived}
                onChange={(e) => setIncludeArchived(e.target.checked)}
                className="rounded border-[#1E2E4E] text-[#14B8A6]"
              />
              <span>Archived</span>
            </label>

            <button
              onClick={() => void loadDocuments()}
              className="p-2 text-xs rounded-lg bg-[#111C35] border border-[#1E2E4E] text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E2E4E] transition-colors"
              title="Refresh list"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Documents Table */}
        <div className="rounded-xl bg-[#0D1527] border border-[#1E2E4E] overflow-hidden shadow-lg">
          {loading && documents.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-3 text-xs text-[#94A3B8]">
              <Loader2 className="w-7 h-7 animate-spin text-[#14B8A6]" />
              <span>Loading documents...</span>
            </div>
          ) : documents.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center px-4">
              <div className="w-14 h-14 rounded-2xl bg-[#14B8A6]/10 border border-[#14B8A6]/20 flex items-center justify-center text-[#14B8A6] mb-4">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-[#F8FAFC] mb-1">No Documents Found</h3>
              <p className="text-xs text-[#64748B] max-w-sm mb-5">
                {search || categoryFilter || disciplineFilter || formatFilter
                  ? 'No documents matched the applied filters. Try clearing some filter options.'
                  : 'Start by uploading architectural drawings, structural sheets, or commercial specifications.'}
              </p>
              {canUpload && (
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#14B8A6] hover:bg-[#0D9488] text-[#0D1527] font-bold transition-all shadow flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload First Document</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1E2E4E] bg-[#0A1020]/70 text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                    <th className="py-3 px-4">Reference & Format</th>
                    <th className="py-3 px-4">Title / Filename</th>
                    <th className="py-3 px-4">Category & Discipline</th>
                    <th className="py-3 px-4">Size</th>
                    <th className="py-3 px-4">Hierarchy Links</th>
                    <th className="py-3 px-4">Uploaded By</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2E4E]/60 text-xs">
                  {documents.map((doc) => (
                    <tr
                      key={doc.id}
                      onClick={() => handleOpenDetails(doc.id)}
                      className={`hover:bg-[#111C35]/50 transition-colors cursor-pointer ${
                        doc.archivedAt ? 'opacity-60 bg-[#111C35]/20' : ''
                      }`}
                    >
                      {/* Reference & Format Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-[#14B8A6] px-2 py-0.5 rounded bg-[#14B8A6]/10 border border-[#14B8A6]/20">
                            {doc.reference}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#1E2E4E] text-[#94A3B8]">
                            {doc.fileFormat}
                          </span>
                        </div>
                      </td>

                      {/* Title & Filename */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleOpenDetails(doc.id)}
                          className="text-left group block max-w-xs sm:max-w-md truncate"
                        >
                          <span className="font-medium text-[#F8FAFC] group-hover:text-[#14B8A6] transition-colors truncate block">
                            {doc.title}
                          </span>
                          <span className="text-[10px] text-[#64748B] truncate block">
                            {doc.originalFilename}
                          </span>
                        </button>
                      </td>

                      {/* Category & Discipline */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div>
                          <span className="text-xs text-[#F8FAFC] font-medium block">
                            {doc.category.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[10px] text-[#94A3B8]">
                            {doc.discipline.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </td>

                      {/* Size */}
                      <td className="py-3 px-4 whitespace-nowrap text-[#94A3B8] font-mono text-[11px]">
                        {(Number(doc.fileSizeBytes) / (1024 * 1024)).toFixed(2)} MB
                      </td>

                      {/* Linked Nodes */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {(doc.spatialLinkCount ?? 0) > 0 && (
                            <span className="px-1.5 py-0.5 text-[10px] rounded bg-[#14B8A6]/10 text-[#14B8A6] flex items-center gap-1">
                              <Layers className="w-3 h-3" />
                              <span>{doc.spatialLinkCount} SBS</span>
                            </span>
                          )}
                          {(doc.workPackageLinkCount ?? 0) > 0 && (
                            <span className="px-1.5 py-0.5 text-[10px] rounded bg-[#38BDF8]/10 text-[#38BDF8] flex items-center gap-1">
                              <FolderTree className="w-3 h-3" />
                              <span>{doc.workPackageLinkCount} WBS</span>
                            </span>
                          )}
                          {(!doc.spatialLinkCount && !doc.workPackageLinkCount) && (
                            <span className="text-[10px] text-[#64748B] italic">Unlinked</span>
                          )}
                        </div>
                      </td>

                      {/* Uploaded By */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-xs text-[#94A3B8] block">
                          {doc.uploadedBy?.fullName || 'User'}
                        </span>
                        <span className="text-[10px] text-[#64748B]">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {canDownload && (
                            <button
                              onClick={() => void handleDownload(doc)}
                              className="p-1.5 text-[#94A3B8] hover:text-[#14B8A6] hover:bg-[#14B8A6]/10 rounded-lg transition-colors"
                              title="Download document"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenDetails(doc.id)}
                            className="p-1.5 text-[#94A3B8] hover:text-[#38BDF8] hover:bg-[#38BDF8]/10 rounded-lg transition-colors"
                            title="View details & links"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {canArchive && (
                            <button
                              onClick={() => void handleArchiveToggle(doc)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                doc.archivedAt
                                  ? 'text-[#10B981] hover:bg-[#10B981]/10'
                                  : 'text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#EF4444]/10'
                              }`}
                              title={doc.archivedAt ? 'Restore document' : 'Archive document'}
                            >
                              {doc.archivedAt ? (
                                <RotateCcw className="w-3.5 h-3.5" />
                              ) : (
                                <Archive className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
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
          onSuccess={() => void loadDocuments()}
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
          onUpdated={() => void loadDocuments()}
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
