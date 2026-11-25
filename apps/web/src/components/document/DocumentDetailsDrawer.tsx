'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Download,
  Edit2,
  Archive,
  RotateCcw,
  ShieldCheck,
  Check,
  Clock,
  Layers,
  FolderTree,
  User,
  Hash,
  HardDrive,
  AlertCircle,
  Loader2,
  Save,
  GitBranch,
  GitCompare,
  Upload,
} from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api-client';
import {
  DocumentDetails,
  DocumentCategory,
  DocumentDiscipline,
  DocumentVersionSummary,
} from '@buildmind/shared-types';
import { NewRevisionModal } from './NewRevisionModal';
import { RevisionCompareModal } from './RevisionCompareModal';
import { ReviewDecisionModal } from './ReviewDecisionModal';

interface DocumentDetailsDrawerProps {
  projectId: string;
  documentId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  canEdit?: boolean;
  canArchive?: boolean;
  canDownload?: boolean;
  canUploadRevision?: boolean;
  canApprove?: boolean;
  canPublish?: boolean;
}

export function DocumentDetailsDrawer({
  projectId,
  documentId,
  isOpen,
  onClose,
  onUpdated,
  canEdit = true,
  canArchive = true,
  canDownload = true,
  canUploadRevision = true,
  canApprove = true,
  canPublish = true,
}: DocumentDetailsDrawerProps) {
  const [doc, setDoc] = useState<DocumentDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Revision Modals State
  const [isNewRevisionOpen, setIsNewRevisionOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedReviewVersion, setSelectedReviewVersion] = useState<DocumentVersionSummary | null>(null);

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editReference, setEditReference] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState<DocumentCategory>(DocumentCategory.OTHER);
  const [editDiscipline, setEditDiscipline] = useState<DocumentDiscipline>(DocumentDiscipline.GENERAL);

  // Link Management state
  const [isManagingLinks, setIsManagingLinks] = useState(false);
  const [spatialNodes, setSpatialNodes] = useState<Array<{ id: string; name: string; nodeType: string }>>([]);
  const [workPackages, setWorkPackages] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [selectedSpatialIds, setSelectedSpatialIds] = useState<string[]>([]);
  const [selectedWorkPackageIds, setSelectedWorkPackageIds] = useState<string[]>([]);

  // Fetch document details
  useEffect(() => {
    if (!isOpen || !documentId) {
      setDoc(null);
      setIsEditing(false);
      setIsManagingLinks(false);
      return;
    }

    let mounted = true;
    async function loadDetails() {
      try {
        setLoading(true);
        setError(null);
        const data = await apiClient<DocumentDetails>(
          `/projects/${projectId}/documents/${documentId}`,
        );
        if (mounted) {
          setDoc(data);
          setEditTitle(data.title);
          setEditReference(data.reference);
          setEditDescription(data.description || '');
          setEditCategory(data.category as DocumentCategory);
          setEditDiscipline(data.discipline as DocumentDiscipline);
          setSelectedSpatialIds(data.spatialLinks?.map((s) => s.spatialNodeId) || []);
          setSelectedWorkPackageIds(data.workPackageLinks?.map((w) => w.workPackageId) || []);
        }
      } catch (err: unknown) {
        if (mounted) {
          const msg = err instanceof ApiError ? err.message : 'Failed to load document details';
          setError(msg);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadDetails();
    return () => {
      mounted = false;
    };
  }, [isOpen, documentId, projectId]);

  // Fetch project nodes when entering link management mode
  const openLinkManager = async () => {
    try {
      setActionLoading(true);
      const [spatialRes, wbsRes] = await Promise.all([
        apiClient<any[]>(`/projects/${projectId}/spatial-nodes`).catch(() => []),
        apiClient<any[]>(`/projects/${projectId}/work-packages`).catch(() => []),
      ]);
      setSpatialNodes(spatialRes.map((n) => ({ id: n.id, name: n.name, nodeType: n.nodeType })));
      setWorkPackages(wbsRes.map((w) => ({ id: w.id, name: w.name, code: w.code })));
      setIsManagingLinks(true);
    } catch {
      setError('Failed to load project hierarchy for linking');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveMetadata = async () => {
    if (!doc) return;
    try {
      setActionLoading(true);
      setError(null);
      const updated = await apiClient<DocumentDetails>(
        `/projects/${projectId}/documents/${doc.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            title: editTitle.trim(),
            reference: editReference.trim() || undefined,
            description: editDescription.trim() || null,
            category: editCategory,
            discipline: editDiscipline,
          }),
        },
      );
      setDoc(updated);
      setIsEditing(false);
      onUpdated();
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to update metadata';
      setError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveLinks = async () => {
    if (!doc) return;
    try {
      setActionLoading(true);
      setError(null);
      const updated = await apiClient<DocumentDetails>(
        `/projects/${projectId}/documents/${doc.id}/links`,
        {
          method: 'PUT',
          body: JSON.stringify({
            spatialNodeIds: selectedSpatialIds,
            workPackageIds: selectedWorkPackageIds,
          }),
        },
      );
      setDoc(updated);
      setIsManagingLinks(false);
      onUpdated();
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to update document links';
      setError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchiveToggle = async () => {
    if (!doc) return;
    try {
      setActionLoading(true);
      setError(null);
      const endpoint = doc.archivedAt
        ? `/projects/${projectId}/documents/${doc.id}/restore`
        : `/projects/${projectId}/documents/${doc.id}/archive`;

      const updated = await apiClient<DocumentDetails>(endpoint, {
        method: 'POST',
      });
      setDoc(updated);
      onUpdated();
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to toggle archive status';
      setError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!doc) return;
    try {
      const { downloadUrl } = await apiClient<{ downloadUrl: string }>(
        `/projects/${projectId}/documents/${doc.id}/download-url`,
      );
      window.open(downloadUrl, '_blank');
    } catch {
      // Fallback to direct stream download
      window.open(`/api/v1/projects/${projectId}/documents/${doc.id}/download`, '_blank');
    }
  };

  const handleDownloadVersion = async (versionId: string) => {
    if (!doc) return;
    try {
      const { downloadUrl } = await apiClient<{ downloadUrl: string }>(
        `/projects/${projectId}/documents/${doc.id}/versions/${versionId}/download-url`,
      );
      window.open(downloadUrl, '_blank');
    } catch {
      window.open(`/api/v1/projects/${projectId}/documents/${doc.id}/versions/${versionId}/download`, '_blank');
    }
  };

  const handleSubmitVersion = async (versionId: string) => {
    if (!doc) return;
    try {
      setActionLoading(true);
      await apiClient(`/projects/${projectId}/documents/${doc.id}/versions/${versionId}/submit`, {
        method: 'POST',
      });
      const updated = await apiClient<DocumentDetails>(`/projects/${projectId}/documents/${doc.id}`);
      setDoc(updated);
      onUpdated();
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Failed to submit version');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestReview = async (versionId: string) => {
    if (!doc) return;
    try {
      setActionLoading(true);
      await apiClient(`/projects/${projectId}/documents/${doc.id}/versions/${versionId}/request-review`, {
        method: 'POST',
        body: JSON.stringify({ comments: 'Submitted for formal engineering review' }),
      });
      const updated = await apiClient<DocumentDetails>(`/projects/${projectId}/documents/${doc.id}`);
      setDoc(updated);
      onUpdated();
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Failed to request review');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublishVersion = async (versionId: string) => {
    if (!doc) return;
    try {
      setActionLoading(true);
      await apiClient(`/projects/${projectId}/documents/${doc.id}/versions/${versionId}/publish`, {
        method: 'POST',
      });
      const updated = await apiClient<DocumentDetails>(`/projects/${projectId}/documents/${doc.id}`);
      setDoc(updated);
      onUpdated();
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Failed to publish version');
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-[#0D1527] border-l border-[#1E2E4E] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-[#1E2E4E] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#14B8A6]" />
            <span className="text-sm font-bold text-[#F8FAFC]">Document Details</span>
            {doc?.archivedAt && (
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-[#EF4444]/20 text-[#EF4444] font-semibold">
                Archived
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-[#94A3B8] hover:text-[#F8FAFC] p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 flex items-center gap-2 text-xs text-[#EF4444]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading || !doc ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-2 text-xs text-[#94A3B8]">
              <Loader2 className="w-6 h-6 animate-spin text-[#14B8A6]" />
              <span>Loading document details...</span>
            </div>
          ) : isEditing ? (
            /* Edit Metadata Form */
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider">
                Edit Document Metadata
              </h3>

              <div>
                <label className="block text-[11px] font-semibold text-[#94A3B8] mb-1">Title</label>
                <input
                  type="text"
                  data-testid="input-edit-title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-[#111C35] border border-[#1E2E4E] text-[#F8FAFC] focus:outline-none focus:border-[#14B8A6]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#94A3B8] mb-1">Reference</label>
                <input
                  type="text"
                  value={editReference}
                  onChange={(e) => setEditReference(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-[#111C35] border border-[#1E2E4E] text-[#F8FAFC] focus:outline-none focus:border-[#14B8A6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#94A3B8] mb-1">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as DocumentCategory)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-[#111C35] border border-[#1E2E4E] text-[#F8FAFC] focus:outline-none focus:border-[#14B8A6]"
                  >
                    {Object.values(DocumentCategory).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#94A3B8] mb-1">Discipline</label>
                  <select
                    value={editDiscipline}
                    onChange={(e) => setEditDiscipline(e.target.value as DocumentDiscipline)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-[#111C35] border border-[#1E2E4E] text-[#F8FAFC] focus:outline-none focus:border-[#14B8A6]"
                  >
                    {Object.values(DocumentDiscipline).map((disc) => (
                      <option key={disc} value={disc}>
                        {disc.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#94A3B8] mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-[#111C35] border border-[#1E2E4E] text-[#F8FAFC] focus:outline-none focus:border-[#14B8A6] resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={actionLoading}
                  className="flex-1 px-3 py-2 text-xs font-semibold rounded-lg bg-[#111C35] hover:bg-[#1E2E4E] text-[#94A3B8]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  data-testid="btn-save-metadata"
                  onClick={handleSaveMetadata}
                  disabled={actionLoading || !editTitle.trim()}
                  className="flex-1 px-3 py-2 text-xs font-semibold rounded-lg bg-[#14B8A6] hover:bg-[#0D9488] text-[#0D1527] font-bold flex items-center justify-center gap-1.5"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          ) : isManagingLinks ? (
            /* Manage Links View */
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider">
                Manage Project Hierarchy Links
              </h3>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#14B8A6]">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Spatial Nodes (SBS)</span>
                </div>
                <div className="max-h-40 overflow-y-auto rounded-lg bg-[#111C35] border border-[#1E2E4E] p-2 space-y-1">
                  {spatialNodes.length === 0 ? (
                    <p className="text-[10px] text-[#64748B] italic">No spatial nodes defined</p>
                  ) : (
                    spatialNodes.map((n) => (
                      <label key={n.id} className="flex items-center gap-2 text-xs text-[#94A3B8] hover:text-[#F8FAFC] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedSpatialIds.includes(n.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedSpatialIds([...selectedSpatialIds, n.id]);
                            else setSelectedSpatialIds(selectedSpatialIds.filter((id) => id !== n.id));
                          }}
                          className="rounded border-[#1E2E4E] text-[#14B8A6]"
                        />
                        <span>{n.name} <span className="text-[10px] text-[#64748B]">({n.nodeType})</span></span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#38BDF8]">
                  <FolderTree className="w-3.5 h-3.5" />
                  <span>Work Packages (WBS)</span>
                </div>
                <div className="max-h-40 overflow-y-auto rounded-lg bg-[#111C35] border border-[#1E2E4E] p-2 space-y-1">
                  {workPackages.length === 0 ? (
                    <p className="text-[10px] text-[#64748B] italic">No work packages defined</p>
                  ) : (
                    workPackages.map((w) => (
                      <label key={w.id} className="flex items-center gap-2 text-xs text-[#94A3B8] hover:text-[#F8FAFC] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedWorkPackageIds.includes(w.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedWorkPackageIds([...selectedWorkPackageIds, w.id]);
                            else setSelectedWorkPackageIds(selectedWorkPackageIds.filter((id) => id !== w.id));
                          }}
                          className="rounded border-[#1E2E4E] text-[#38BDF8]"
                        />
                        <span><span className="font-mono text-[10px] text-[#38BDF8]">[{w.code}]</span> {w.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsManagingLinks(false)}
                  disabled={actionLoading}
                  className="flex-1 px-3 py-2 text-xs font-semibold rounded-lg bg-[#111C35] hover:bg-[#1E2E4E] text-[#94A3B8]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  data-testid="btn-save-links"
                  onClick={handleSaveLinks}
                  disabled={actionLoading}
                  className="flex-1 px-3 py-2 text-xs font-semibold rounded-lg bg-[#14B8A6] hover:bg-[#0D9488] text-[#0D1527] font-bold flex items-center justify-center gap-1.5"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Links</span>
                </button>
              </div>
            </div>
          ) : (
            /* Read-Only Details View */
            <div className="space-y-5">
              {/* Main Title & Reference */}
              <div className="p-3.5 rounded-xl bg-[#111C35] border border-[#1E2E4E]">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[11px] font-bold text-[#14B8A6] px-2 py-0.5 rounded bg-[#14B8A6]/10 border border-[#14B8A6]/20">
                    {doc.reference}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#1E2E4E] text-[#94A3B8]">
                    {doc.fileFormat}
                  </span>
                </div>
                <h2 className="text-sm font-bold text-[#F8FAFC] leading-snug">{doc.title}</h2>
                <p className="text-[11px] text-[#64748B] mt-0.5 truncate">{doc.originalFilename}</p>
                {doc.description && (
                  <p className="text-xs text-[#94A3B8] mt-2.5 pt-2 border-t border-[#1E2E4E]/60">
                    {doc.description}
                  </p>
                )}
              </div>

              {/* Core Attributes Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-[#111C35]/60 border border-[#1E2E4E]/60 space-y-0.5">
                  <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider block">
                    Category
                  </span>
                  <span className="text-[#F8FAFC] font-medium">{doc.category.replace(/_/g, ' ')}</span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#111C35]/60 border border-[#1E2E4E]/60 space-y-0.5">
                  <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider block">
                    Discipline
                  </span>
                  <span className="text-[#F8FAFC] font-medium">{doc.discipline.replace(/_/g, ' ')}</span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#111C35]/60 border border-[#1E2E4E]/60 space-y-0.5">
                  <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider block">
                    File Size
                  </span>
                  <span className="text-[#F8FAFC] font-medium">
                    {(Number(doc.fileSizeBytes) / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#111C35]/60 border border-[#1E2E4E]/60 space-y-0.5">
                  <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider block">
                    Antivirus Status
                  </span>
                  <span
                    className={`font-semibold text-xs flex items-center gap-1 ${
                      doc.securityScanStatus === 'CLEAN'
                        ? 'text-[#10B981]'
                        : doc.securityScanStatus === 'FLAGGED'
                        ? 'text-[#EF4444]'
                        : 'text-[#F59E0B]'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {doc.securityScanStatus === 'NOT_SCANNED' || doc.securityScanStatus === 'UNSCANNED'
                      ? 'Not Scanned (Local Dev)'
                      : doc.securityScanStatus}
                  </span>
                </div>
              </div>

              {/* Revision Control & History Section */}
              <div className="space-y-3 p-3.5 rounded-xl bg-[#111C35] border border-[#1E2E4E]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#F8FAFC]">
                    <GitBranch className="w-4 h-4 text-[#14B8A6]" />
                    <span>Revision History</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#1E2E4E] text-[#94A3B8] font-mono">
                      {doc.versions?.length || 0}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {doc.versions && doc.versions.length >= 2 && (
                      <button
                        type="button"
                        data-testid="btn-compare-revisions"
                        onClick={() => setIsCompareOpen(true)}
                        className="px-2 py-1 text-[11px] font-semibold rounded bg-[#0D1527] hover:bg-[#1E2E4E] text-[#38BDF8] border border-[#1E2E4E] transition-colors flex items-center gap-1"
                      >
                        <GitCompare className="w-3 h-3" />
                        <span>Compare</span>
                      </button>
                    )}
                    {canUploadRevision && !doc.archivedAt && (
                      <button
                        type="button"
                        data-testid="btn-upload-revision"
                        onClick={() => setIsNewRevisionOpen(true)}
                        className="px-2 py-1 text-[11px] font-semibold rounded bg-[#14B8A6]/10 hover:bg-[#14B8A6]/20 text-[#14B8A6] border border-[#14B8A6]/30 transition-colors flex items-center gap-1"
                      >
                        <Upload className="w-3 h-3" />
                        <span>New Revision</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {doc.versions && doc.versions.length > 0 ? (
                    doc.versions.map((v) => {
                      const isCurrentPublished = doc.currentPublishedVersionId === v.id;
                      return (
                        <div
                          key={v.id}
                          className={`p-2.5 rounded-lg border text-xs space-y-1.5 ${
                            isCurrentPublished
                              ? 'bg-[#14B8A6]/10 border-[#14B8A6]/40'
                              : 'bg-[#0D1527] border-[#1E2E4E]/60'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-[#1E2E4E] text-[#F8FAFC]">
                                Rev {v.revisionCode}
                              </span>
                              <span className="text-[10px] text-[#64748B]">v{v.versionNumber}</span>
                              {isCurrentPublished && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30">
                                  Published
                                </span>
                              )}
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                v.workflowStatus === 'PUBLISHED'
                                  ? 'bg-[#10B981]/20 text-[#10B981]'
                                  : v.workflowStatus === 'SUPERSEDED'
                                  ? 'bg-[#64748B]/20 text-[#94A3B8]'
                                  : v.workflowStatus === 'APPROVED'
                                  ? 'bg-[#06B6D4]/20 text-[#06B6D4]'
                                  : v.workflowStatus === 'UNDER_REVIEW'
                                  ? 'bg-[#3B82F6]/20 text-[#3B82F6]'
                                  : v.workflowStatus === 'SUBMITTED'
                                  ? 'bg-[#8B5CF6]/20 text-[#8B5CF6]'
                                  : 'bg-[#F59E0B]/20 text-[#F59E0B]'
                              }`}
                            >
                              {v.workflowStatus.replace(/_/g, ' ')}
                            </span>
                          </div>

                          {v.changeNote && (
                            <p className="text-[11px] text-[#94A3B8] italic">{v.changeNote}</p>
                          )}

                          <div className="flex items-center justify-between pt-1 border-t border-[#1E2E4E]/40 text-[10px] text-[#64748B]">
                            <span>
                              {v.uploadedBy ? v.uploadedBy.fullName : 'System'} • {new Date(v.createdAt).toLocaleDateString()}
                            </span>

                            <div className="flex items-center gap-1.5">
                              {canDownload && (
                                <button
                                  type="button"
                                  onClick={() => handleDownloadVersion(v.id)}
                                  className="text-[#94A3B8] hover:text-[#14B8A6] p-0.5"
                                  title="Download this version"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {v.workflowStatus === 'DRAFT' && (
                                <button
                                  type="button"
                                  data-testid={`btn-submit-v${v.versionNumber}`}
                                  onClick={() => handleSubmitVersion(v.id)}
                                  disabled={actionLoading}
                                  className="px-1.5 py-0.5 rounded bg-[#8B5CF6]/20 text-[#A78BFA] hover:bg-[#8B5CF6]/30 font-semibold"
                                >
                                  Submit
                                </button>
                              )}

                              {v.workflowStatus === 'SUBMITTED' && (
                                <button
                                  type="button"
                                  data-testid={`btn-req-review-v${v.versionNumber}`}
                                  onClick={() => handleRequestReview(v.id)}
                                  disabled={actionLoading}
                                  className="px-1.5 py-0.5 rounded bg-[#3B82F6]/20 text-[#60A5FA] hover:bg-[#3B82F6]/30 font-semibold"
                                >
                                  Request Review
                                </button>
                              )}

                              {v.workflowStatus === 'UNDER_REVIEW' && canApprove && (
                                <button
                                  type="button"
                                  data-testid={`btn-review-v${v.versionNumber}`}
                                  onClick={() => {
                                    setSelectedReviewVersion(v);
                                    setIsReviewModalOpen(true);
                                  }}
                                  className="px-1.5 py-0.5 rounded bg-[#06B6D4]/20 text-[#22D3EE] hover:bg-[#06B6D4]/30 font-semibold"
                                >
                                  Review
                                </button>
                              )}

                              {v.workflowStatus === 'APPROVED' && canPublish && (
                                <button
                                  type="button"
                                  data-testid={`btn-publish-v${v.versionNumber}`}
                                  onClick={() => handlePublishVersion(v.id)}
                                  disabled={actionLoading}
                                  className="px-1.5 py-0.5 rounded bg-[#10B981]/20 text-[#34D399] hover:bg-[#10B981]/30 font-semibold"
                                >
                                  Publish
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-[11px] text-[#64748B] italic">No revision history found</p>
                  )}
                </div>
              </div>

              {/* Linked Spatial Breakdown (SBS) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-[#F8FAFC]">
                    <Layers className="w-4 h-4 text-[#14B8A6]" />
                    <span>Linked Spatial Nodes (SBS)</span>
                  </div>
                  {canEdit && (
                    <button
                      data-testid="btn-manage-spatial"
                      onClick={openLinkManager}
                      className="text-[11px] text-[#14B8A6] hover:underline"
                    >
                      Manage
                    </button>
                  )}
                </div>
                <div className="rounded-lg bg-[#111C35] border border-[#1E2E4E] p-2.5">
                  {doc.spatialLinks && doc.spatialLinks.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {doc.spatialLinks.map((sl) => (
                        <span
                          key={sl.id}
                          className="px-2 py-0.5 text-[11px] rounded bg-[#14B8A6]/10 text-[#14B8A6] border border-[#14B8A6]/20 font-medium"
                        >
                          {sl.spatialNode.name}{' '}
                          <span className="text-[10px] text-[#64748B]">
                            ({sl.spatialNode.nodeType})
                          </span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-[#64748B] italic">No spatial nodes linked</p>
                  )}
                </div>
              </div>

              {/* Linked Work Breakdown (WBS) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-[#F8FAFC]">
                    <FolderTree className="w-4 h-4 text-[#38BDF8]" />
                    <span>Linked Work Packages (WBS)</span>
                  </div>
                  {canEdit && (
                    <button
                      data-testid="btn-manage-wbs"
                      onClick={openLinkManager}
                      className="text-[11px] text-[#38BDF8] hover:underline"
                    >
                      Manage
                    </button>
                  )}
                </div>
                <div className="rounded-lg bg-[#111C35] border border-[#1E2E4E] p-2.5">
                  {doc.workPackageLinks && doc.workPackageLinks.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {doc.workPackageLinks.map((wl) => (
                        <span
                          key={wl.id}
                          className="px-2 py-0.5 text-[11px] rounded bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/20 font-medium"
                        >
                          <span className="font-mono text-[10px] mr-1">[{wl.workPackage.code}]</span>
                          {wl.workPackage.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-[#64748B] italic">No work packages linked</p>
                  )}
                </div>
              </div>

              {/* Security & Cryptographic Integrity Card */}
              <div className="p-3.5 rounded-lg bg-[#111C35] border border-[#1E2E4E] space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#F8FAFC]">
                  <Hash className="w-4 h-4 text-[#A855F7]" />
                  <span>Integrity & Storage Verification</span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div>
                    <span className="text-[#64748B] block text-[10px] uppercase">SHA-256 Checksum</span>
                    <span className="font-mono text-[#A855F7] text-[10px] break-all">
                      {doc.checksumSha256}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block text-[10px] uppercase">Uploaded By</span>
                    <span className="text-[#94A3B8]">
                      {doc.uploadedBy ? `${doc.uploadedBy.fullName} (${doc.uploadedBy.email})` : 'System User'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block text-[10px] uppercase">Upload Date</span>
                    <span className="text-[#94A3B8]">
                      {new Date(doc.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        {doc && !isEditing && !isManagingLinks && (
          <div className="p-4 border-t border-[#1E2E4E] flex items-center justify-between gap-2 bg-[#0A1020]">
            <div className="flex items-center gap-2">
              {canArchive && (
                <button
                  data-testid="btn-archive-drawer"
                  onClick={handleArchiveToggle}
                  disabled={actionLoading}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 ${
                    doc.archivedAt
                      ? 'border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981] hover:bg-[#10B981]/20'
                      : 'border-[#EF4444]/30 bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20'
                  }`}
                  title={doc.archivedAt ? 'Restore document' : 'Archive document'}
                >
                  {doc.archivedAt ? <RotateCcw className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                  <span>{doc.archivedAt ? 'Restore' : 'Archive'}</span>
                </button>
              )}

              {canEdit && (
                <button
                  data-testid="btn-edit-metadata"
                  onClick={() => setIsEditing(true)}
                  disabled={actionLoading}
                  className="px-3 py-2 text-xs font-semibold rounded-lg bg-[#111C35] hover:bg-[#1E2E4E] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#1E2E4E] transition-colors flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Metadata</span>
                </button>
              )}
            </div>

            {canDownload && (
              <button
                data-testid="btn-download-drawer"
                onClick={handleDownload}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#14B8A6] hover:bg-[#0D9488] text-[#0D1527] font-bold transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            )}
          </div>
        )}

        {/* New Revision Modal */}
        {doc && (
          <NewRevisionModal
            projectId={projectId}
            documentId={doc.id}
            documentTitle={doc.title}
            currentRevisionCode={doc.currentRevisionCode || undefined}
            isOpen={isNewRevisionOpen}
            onClose={() => setIsNewRevisionOpen(false)}
            onSuccess={async () => {
              const updated = await apiClient<DocumentDetails>(`/projects/${projectId}/documents/${doc.id}`);
              setDoc(updated);
              onUpdated();
            }}
          />
        )}

        {/* Compare Revisions Modal */}
        {doc && doc.versions && (
          <RevisionCompareModal
            projectId={projectId}
            documentId={doc.id}
            versions={doc.versions}
            isOpen={isCompareOpen}
            onClose={() => setIsCompareOpen(false)}
          />
        )}

        {/* Review Decision Modal */}
        {doc && selectedReviewVersion && (
          <ReviewDecisionModal
            projectId={projectId}
            documentId={doc.id}
            versionId={selectedReviewVersion.id}
            revisionCode={selectedReviewVersion.revisionCode}
            documentTitle={doc.title}
            isOpen={isReviewModalOpen}
            onClose={() => {
              setIsReviewModalOpen(false);
              setSelectedReviewVersion(null);
            }}
            onSuccess={async () => {
              const updated = await apiClient<DocumentDetails>(`/projects/${projectId}/documents/${doc.id}`);
              setDoc(updated);
              onUpdated();
            }}
          />
        )}
      </div>
    </div>
  );
}
