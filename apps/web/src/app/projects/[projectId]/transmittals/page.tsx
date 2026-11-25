'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { ProjectHeader } from '@/components/project/ProjectHeader';
import { ProjectNav } from '@/components/project/ProjectNav';
import {
  SendHorizontal,
  Plus,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  FileText,
  AlertCircle,
  Loader2,
  RefreshCw,
  Users,
  Send,
  X,
  FileCheck,
} from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api-client';
import { useOrganization } from '@/context/organization-context';
import {
  TransmittalSummary,
  TransmittalStatus,
  IssuePurpose,
  DocumentSummary,
} from '@buildmind/shared-types';

export default function ProjectTransmittalsPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { hasPermission } = useOrganization();

  // Project state
  const [project, setProject] = useState<any | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);

  // Transmittals list state
  const [transmittals, setTransmittals] = useState<TransmittalSummary[]>([]);
  const [totalTransmittals, setTotalTransmittals] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [purposeFilter, setPurposeFilter] = useState<string>('');

  // Selected Transmittal Details Modal
  const [selectedTransmittal, setSelectedTransmittal] = useState<any | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Create Transmittal Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newReference, setNewReference] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newPurpose, setNewPurpose] = useState<IssuePurpose>(IssuePurpose.FOR_CONSTRUCTION);
  const [newNotes, setNewNotes] = useState('');
  const [recipients, setRecipients] = useState<
    Array<{ name: string; email: string; organization?: string; role?: string }>
  >([{ name: '', email: '', organization: '', role: '' }]);

  // Available document versions for linking
  const [availableDocs, setAvailableDocs] = useState<DocumentSummary[]>([]);
  const [selectedVersionIds, setSelectedVersionIds] = useState<string[]>([]);

  // Permissions
  const canCreate = hasPermission('transmittals.create');
  const canIssue = hasPermission('transmittals.issue');

  // Load project
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

  // Load Transmittals
  const loadTransmittals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const query = new URLSearchParams();
      if (statusFilter) query.set('status', statusFilter);
      if (purposeFilter) query.set('issuePurpose', purposeFilter);

      const qs = query.toString();
      const endpoint = `/projects/${projectId}/transmittals${qs ? `?${qs}` : ''}`;
      const res = await apiClient<{ items: TransmittalSummary[]; total: number }>(endpoint);

      setTransmittals(res.items || []);
      setTotalTransmittals(res.total || 0);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load transmittals';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [projectId, statusFilter, purposeFilter]);

  useEffect(() => {
    void loadTransmittals();
  }, [loadTransmittals]);

  // Open Details Modal
  const openDetails = async (transmittalId: string) => {
    try {
      setIsDetailsOpen(true);
      setDetailsLoading(true);
      const data = await apiClient<any>(`/projects/${projectId}/transmittals/${transmittalId}`);
      setSelectedTransmittal(data);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load transmittal details';
      setError(msg);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Issue Transmittal
  const handleIssueTransmittal = async (transmittalId: string) => {
    try {
      await apiClient(`/projects/${projectId}/transmittals/${transmittalId}/issue`, {
        method: 'POST',
      });
      void loadTransmittals();
      if (selectedTransmittal?.id === transmittalId) {
        const updated = await apiClient<any>(`/projects/${projectId}/transmittals/${transmittalId}`);
        setSelectedTransmittal(updated);
      }
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to issue transmittal';
      setError(msg);
    }
  };

  // Open Create Modal & load project documents
  const openCreateModal = async () => {
    setIsCreateOpen(true);
    setCreateError(null);
    setNewReference(`TRN-${Math.floor(1000 + Math.random() * 9000)}`);
    setNewSubject('');
    setNewNotes('');
    setRecipients([{ name: '', email: '', organization: '', role: '' }]);
    setSelectedVersionIds([]);

    try {
      const docsRes = await apiClient<{ items: DocumentSummary[] }>(
        `/projects/${projectId}/documents?limit=50`,
      );
      setAvailableDocs(docsRes.items || []);
    } catch {
      setAvailableDocs([]);
    }
  };

  const handleAddRecipient = () => {
    setRecipients([...recipients, { name: '', email: '', organization: '', role: '' }]);
  };

  const handleRemoveRecipient = (idx: number) => {
    setRecipients(recipients.filter((_, i) => i !== idx));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReference.trim() || !newSubject.trim()) {
      setCreateError('Reference and Subject are required');
      return;
    }
    const validRecipients = recipients.filter((r) => r.name.trim() && r.email.trim());
    if (validRecipients.length === 0) {
      setCreateError('At least one recipient with valid Name and Email is required');
      return;
    }

    try {
      setCreateLoading(true);
      setCreateError(null);

      await apiClient(`/projects/${projectId}/transmittals`, {
        method: 'POST',
        body: JSON.stringify({
          reference: newReference.trim(),
          subject: newSubject.trim(),
          issuePurpose: newPurpose,
          notes: newNotes.trim() || undefined,
          authorizedRecipients: validRecipients,
          recipients: validRecipients,
          versionIds: selectedVersionIds,
          items: selectedVersionIds.map((vId) => ({ documentVersionId: vId })),
        }),
      });

      setIsCreateOpen(false);
      void loadTransmittals();
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to create transmittal';
      setCreateError(msg);
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Project Header & Navigation */}
        <ProjectHeader project={project} loading={projectLoading} />
        <ProjectNav projectId={projectId} transmittalCount={totalTransmittals} />

        {/* Action Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#F8FAFC] tracking-tight flex items-center gap-2">
              <SendHorizontal className="w-5 h-5 text-[#14B8A6]" />
              <span>Document Transmittals</span>
            </h1>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Formal transmittal records for issuance of drawing packages, specs, and contract documents
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => void loadTransmittals()}
              disabled={loading}
              className="p-2 rounded-lg bg-[#111C35] hover:bg-[#1E2E4E] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#1E2E4E] transition-colors"
              title="Refresh Transmittals"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {canCreate && (
              <button
                data-testid="btn-create-transmittal"
                onClick={openCreateModal}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#14B8A6] hover:bg-[#0D9488] text-[#0D1527] font-bold transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>New Transmittal</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 rounded-xl bg-[#111C35]/60 border border-[#1E2E4E] flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[#0D1527] border border-[#1E2E4E] text-xs text-[#F8FAFC] focus:outline-none focus:border-[#14B8A6]"
          >
            <option value="">All Statuses</option>
            {Object.values(TransmittalStatus).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={purposeFilter}
            onChange={(e) => setPurposeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[#0D1527] border border-[#1E2E4E] text-xs text-[#F8FAFC] focus:outline-none focus:border-[#14B8A6]"
          >
            <option value="">All Issue Purposes</option>
            {Object.values(IssuePurpose).map((p) => (
              <option key={p} value={p}>
                {p.replace(/_/g, ' ')}
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

        {/* Transmittals Register Table */}
        <div className="rounded-xl border border-[#1E2E4E] bg-[#0D1527] overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#94A3B8] space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#14B8A6]" />
              <span className="text-xs">Loading transmittals...</span>
            </div>
          ) : transmittals.length === 0 ? (
            <div className="py-16 text-center text-[#94A3B8] space-y-3">
              <SendHorizontal className="w-10 h-10 mx-auto text-[#64748B]" />
              <p className="text-sm font-semibold text-[#F8FAFC]">No transmittals created</p>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                Create a formal transmittal record to distribute approved drawing and document versions to stakeholders.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs" data-testid="transmittals-table">
                <thead className="bg-[#111C35] text-[11px] text-[#94A3B8] uppercase border-b border-[#1E2E4E]">
                  <tr>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Sender</th>
                    <th className="py-3 px-4">Recipients</th>
                    <th className="py-3 px-4">Purpose</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2E4E]/60 text-[#F8FAFC]">
                  {transmittals.map((t) => (
                    <tr
                      key={t.id}
                      className="hover:bg-[#111C35]/50 transition-colors cursor-pointer group"
                      onClick={() => openDetails(t.id)}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-[#14B8A6]">{t.reference}</td>
                      <td className="py-3 px-4 font-semibold text-[#F8FAFC] max-w-xs truncate">
                        {t.subject}
                      </td>
                      <td className="py-3 px-4 text-[#94A3B8]">
                        {t.sender?.fullName || 'System User'}
                      </td>
                      <td className="py-3 px-4 text-[#94A3B8]">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-[#1E2E4E]">
                          {t.recipientsCount || t.authorizedRecipients?.length || 0} recipients
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#111C35] border border-[#1E2E4E] text-[#38BDF8]">
                          {t.issuePurpose.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#94A3B8]">
                        {t.issuedAt
                          ? new Date(t.issuedAt).toLocaleDateString()
                          : new Date(t.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            t.status === 'ISSUED'
                              ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30'
                              : t.status === 'CANCELLED'
                              ? 'bg-[#EF4444]/20 text-[#EF4444]'
                              : 'bg-[#F59E0B]/20 text-[#F59E0B]'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td
                        className="py-3 px-4 text-right space-x-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => openDetails(t.id)}
                          className="p-1 rounded text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E2E4E] transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {t.status === 'DRAFT' && canIssue && (
                          <button
                            type="button"
                            data-testid={`btn-issue-${t.reference}`}
                            onClick={() => handleIssueTransmittal(t.id)}
                            className="px-2 py-1 rounded bg-[#10B981]/20 hover:bg-[#10B981]/30 text-[#10B981] text-[10px] font-bold"
                            title="Issue Transmittal"
                          >
                            Issue
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

        {/* Transmittal Details Modal */}
        {isDetailsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="w-full max-w-2xl rounded-2xl bg-[#0D1527] border border-[#1E2E4E] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2E4E] bg-[#111C35]">
                <div className="flex items-center gap-2">
                  <SendHorizontal className="w-5 h-5 text-[#14B8A6]" />
                  <div>
                    <h2 className="text-base font-bold text-[#F8FAFC]">
                      {selectedTransmittal?.reference || 'Transmittal Details'}
                    </h2>
                    <p className="text-xs text-[#94A3B8]">{selectedTransmittal?.subject}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDetailsOpen(false)}
                  className="p-1 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E2E4E] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                {detailsLoading ? (
                  <div className="py-12 text-center text-[#94A3B8]">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#14B8A6]" />
                  </div>
                ) : selectedTransmittal ? (
                  <div className="space-y-4 text-xs">
                    {/* Status Badge & Purpose */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#111C35] border border-[#1E2E4E]">
                      <div>
                        <span className="text-[10px] text-[#64748B] uppercase block">Purpose</span>
                        <span className="text-xs font-semibold text-[#38BDF8]">
                          {selectedTransmittal.issuePurpose?.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#64748B] uppercase block">Status</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            selectedTransmittal.status === 'ISSUED'
                              ? 'bg-[#10B981]/20 text-[#10B981]'
                              : 'bg-[#F59E0B]/20 text-[#F59E0B]'
                          }`}
                        >
                          {selectedTransmittal.status}
                        </span>
                      </div>
                    </div>

                    {/* Recipients Section */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-[#F8FAFC]">
                        <Users className="w-4 h-4 text-[#14B8A6]" />
                        <span>Recipients List</span>
                      </div>
                      <div className="rounded-lg bg-[#111C35] border border-[#1E2E4E] divide-y divide-[#1E2E4E]">
                        {selectedTransmittal.recipients?.map((r: any, i: number) => (
                          <div key={i} className="p-2.5 flex items-center justify-between text-xs">
                            <div>
                              <span className="text-[#F8FAFC] font-semibold">{r.name}</span>
                              <span className="text-[#94A3B8] ml-2 text-[11px]">&lt;{r.email}&gt;</span>
                            </div>
                            <span className="text-[10px] text-[#64748B]">
                              {r.organization || 'External Partner'} {r.role ? `(${r.role})` : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Transmittal Items Snapshot */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-[#F8FAFC]">
                        <FileCheck className="w-4 h-4 text-[#14B8A6]" />
                        <span>Transmitted Documents ({selectedTransmittal.items?.length || 0})</span>
                      </div>
                      <div className="rounded-lg bg-[#111C35] border border-[#1E2E4E] divide-y divide-[#1E2E4E]">
                        {selectedTransmittal.items?.map((item: any) => (
                          <div key={item.id} className="p-3 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-[#F8FAFC]">
                                {item.documentTitle}
                              </span>
                              <span className="px-2 py-0.5 rounded font-mono font-bold bg-[#1E2E4E] text-[#14B8A6] text-[11px]">
                                Rev {item.revisionCode}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-[#64748B]">
                              <span>{item.filename}</span>
                              <span className="font-mono">{item.checksumSha256?.substring(0, 16)}...</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="p-4 border-t border-[#1E2E4E] flex items-center justify-between bg-[#111C35]">
                {selectedTransmittal?.status === 'DRAFT' && canIssue ? (
                  <button
                    onClick={() => handleIssueTransmittal(selectedTransmittal.id)}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#10B981] hover:bg-[#059669] text-[#0D1527] font-bold transition-colors flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Issue Transmittal</span>
                  </button>
                ) : (
                  <div />
                )}

                <button
                  onClick={() => setIsDetailsOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#1E2E4E] text-[#F8FAFC] hover:bg-[#2A3F6C] transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Transmittal Modal */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="w-full max-w-xl rounded-2xl bg-[#0D1527] border border-[#1E2E4E] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2E4E] bg-[#111C35]">
                <div>
                  <h2 className="text-base font-bold text-[#F8FAFC]">New Transmittal Record</h2>
                  <p className="text-xs text-[#94A3B8]">Create formal transmittal package and link document revisions</p>
                </div>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="p-1 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E2E4E] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
                {createError && (
                  <div className="p-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444]">
                    {createError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                      Reference <span className="text-[#EF4444]">*</span>
                    </label>
                    <input
                      type="text"
                      data-testid="input-transmittal-reference"
                      value={newReference}
                      onChange={(e) => setNewReference(e.target.value)}
                      required
                      className="w-full px-3 py-1.5 rounded-lg bg-[#111C35] border border-[#1E2E4E] text-xs text-[#F8FAFC] focus:outline-none focus:border-[#14B8A6]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                      Issue Purpose <span className="text-[#EF4444]">*</span>
                    </label>
                    <select
                      value={newPurpose}
                      onChange={(e) => setNewPurpose(e.target.value as IssuePurpose)}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#111C35] border border-[#1E2E4E] text-xs text-[#F8FAFC] focus:outline-none focus:border-[#14B8A6]"
                    >
                      {Object.values(IssuePurpose).map((p) => (
                        <option key={p} value={p}>
                          {p.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                    Subject <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="text"
                    data-testid="input-transmittal-subject"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="e.g. Architectural Elevation Drawing Package for Tender"
                    required
                    className="w-full px-3 py-1.5 rounded-lg bg-[#111C35] border border-[#1E2E4E] text-xs text-[#F8FAFC] focus:outline-none focus:border-[#14B8A6]"
                  />
                </div>

                {/* Recipients */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#F8FAFC]">Recipients</span>
                    <button
                      type="button"
                      onClick={handleAddRecipient}
                      className="text-[#14B8A6] text-[11px] hover:underline"
                    >
                      + Add Recipient
                    </button>
                  </div>
                  {recipients.map((r, i) => (
                    <div key={i} className="grid grid-cols-4 gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Name *"
                        value={r.name}
                        onChange={(e) => {
                          const copy = [...recipients];
                          copy[i].name = e.target.value;
                          setRecipients(copy);
                        }}
                        className="px-2 py-1 rounded bg-[#111C35] border border-[#1E2E4E] text-[#F8FAFC]"
                      />
                      <input
                        type="email"
                        placeholder="Email *"
                        value={r.email}
                        onChange={(e) => {
                          const copy = [...recipients];
                          copy[i].email = e.target.value;
                          setRecipients(copy);
                        }}
                        className="px-2 py-1 rounded bg-[#111C35] border border-[#1E2E4E] text-[#F8FAFC]"
                      />
                      <input
                        type="text"
                        placeholder="Org / Role"
                        value={r.organization}
                        onChange={(e) => {
                          const copy = [...recipients];
                          copy[i].organization = e.target.value;
                          setRecipients(copy);
                        }}
                        className="px-2 py-1 rounded bg-[#111C35] border border-[#1E2E4E] text-[#F8FAFC]"
                      />
                      {recipients.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRecipient(i)}
                          className="text-[#EF4444] text-[10px] hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Select Document Versions */}
                <div className="space-y-2">
                  <span className="font-semibold text-[#F8FAFC] block">
                    Select Document Revisions to Include
                  </span>
                  <div className="max-h-40 overflow-y-auto rounded-lg bg-[#111C35] border border-[#1E2E4E] p-2 space-y-1.5">
                    {availableDocs.length === 0 ? (
                      <p className="text-[11px] text-[#64748B] italic">No project documents available</p>
                    ) : (
                      availableDocs.map((doc) => {
                        const vId = doc.latestVersionId || doc.currentPublishedVersionId;
                        if (!vId) return null;
                        const isChecked = selectedVersionIds.includes(vId);
                        return (
                          <label
                            key={doc.id}
                            className="flex items-center gap-2 p-1 rounded hover:bg-[#1E2E4E]/40 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedVersionIds([...selectedVersionIds, vId]);
                                else setSelectedVersionIds(selectedVersionIds.filter((id) => id !== vId));
                              }}
                              className="rounded border-[#1E2E4E] text-[#14B8A6]"
                            />
                            <span className="font-mono text-[#14B8A6] font-bold text-[11px]">
                              [{doc.reference}]
                            </span>
                            <span className="text-[#F8FAFC] truncate flex-1">{doc.title}</span>
                            <span className="text-[10px] text-[#94A3B8]">
                              Rev {doc.currentRevisionCode || '01'}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1E2E4E]">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#111C35] hover:bg-[#1E2E4E] text-[#94A3B8]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    data-testid="btn-submit-transmittal"
                    disabled={createLoading}
                    className="px-5 py-2 text-xs font-semibold rounded-lg bg-[#14B8A6] hover:bg-[#0D9488] text-[#0D1527] font-bold"
                  >
                    {createLoading ? 'Creating...' : 'Create Transmittal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
