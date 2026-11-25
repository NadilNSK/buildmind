'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { ProjectHeader } from '@/components/project/ProjectHeader';
import { ProjectNav } from '@/components/project/ProjectNav';
import { ReviewDecisionModal } from '@/components/document/ReviewDecisionModal';
import {
  ClipboardCheck,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Loader2,
  RefreshCw,
  User,
  Eye,
} from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api-client';
import { useOrganization } from '@/context/organization-context';
import {
  DocumentReviewSummary,
  ReviewStatus,
  ReviewDecision,
} from '@buildmind/shared-types';

export default function ProjectReviewsPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { hasPermission } = useOrganization();

  // Project state
  const [project, setProject] = useState<any | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);

  // Reviews list state
  const [reviews, setReviews] = useState<DocumentReviewSummary[]>([]);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Review Decision Modal State
  const [selectedReview, setSelectedReview] = useState<DocumentReviewSummary | null>(null);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);

  // Permissions
  const canApprove = hasPermission('documents.approve');

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

  // Load Reviews
  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const query = new URLSearchParams();
      if (statusFilter) query.set('status', statusFilter);

      const qs = query.toString();
      const endpoint = `/projects/${projectId}/document-reviews${qs ? `?${qs}` : ''}`;
      const res = await apiClient<any>(endpoint);
      const items: DocumentReviewSummary[] = Array.isArray(res) ? res : res.items || [];

      setReviews(items);
      setTotalReviews(Array.isArray(res) ? res.length : res.total || items.length);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load document reviews';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [projectId, statusFilter]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Project Header & Navigation */}
        <ProjectHeader project={project} loading={projectLoading} />
        <ProjectNav projectId={projectId} reviewCount={totalReviews} />

        {/* Action Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#F8FAFC] tracking-tight flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-[#14B8A6]" />
              <span>Document Review Queue</span>
            </h1>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Review and approval workflow for submitted document and drawing revisions
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => void loadReviews()}
              disabled={loading}
              className="p-2 rounded-lg bg-[#111C35] hover:bg-[#1E2E4E] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#1E2E4E] transition-colors"
              title="Refresh Reviews"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 rounded-xl bg-[#111C35]/60 border border-[#1E2E4E] flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[#0D1527] border border-[#1E2E4E] text-xs text-[#F8FAFC] focus:outline-none focus:border-[#14B8A6]"
          >
            <option value="">All Review Statuses</option>
            {Object.values(ReviewStatus).map((s) => (
              <option key={s} value={s}>
                {s}
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

        {/* Reviews Queue Table */}
        <div className="rounded-xl border border-[#1E2E4E] bg-[#0D1527] overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#94A3B8] space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#14B8A6]" />
              <span className="text-xs">Loading review queue...</span>
            </div>
          ) : reviews.length === 0 ? (
            <div className="py-16 text-center text-[#94A3B8] space-y-3">
              <ClipboardCheck className="w-10 h-10 mx-auto text-[#64748B]" />
              <p className="text-sm font-semibold text-[#F8FAFC]">No pending reviews</p>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                When document revisions are submitted for engineering review, they will appear in this queue.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs" data-testid="reviews-table">
                <thead className="bg-[#111C35] text-[11px] text-[#94A3B8] uppercase border-b border-[#1E2E4E]">
                  <tr>
                    <th className="py-3 px-4">Document / Drawing</th>
                    <th className="py-3 px-4">Revision</th>
                    <th className="py-3 px-4">Requested By</th>
                    <th className="py-3 px-4">Assigned Reviewer</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Decision Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2E4E]/60 text-[#F8FAFC]">
                  {reviews.map((rev) => (
                    <tr key={rev.id} className="hover:bg-[#111C35]/50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-[#F8FAFC]">
                        {rev.version ? (
                          <div>
                            <span className="font-mono text-[#14B8A6] mr-2">
                              {rev.version.revisionCode}
                            </span>
                            <span>{rev.version.title || 'Revision Item'}</span>
                          </div>
                        ) : (
                          'Document Revision'
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#1E2E4E] text-[#F8FAFC]">
                          Rev {rev.version?.revisionCode || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#94A3B8]">
                        {rev.requestedBy?.fullName || 'System User'}
                      </td>
                      <td className="py-3 px-4 text-[#94A3B8]">
                        {rev.assignedReviewer?.fullName || 'Unassigned'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            rev.status === 'APPROVED'
                              ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30'
                              : rev.status === 'REJECTED'
                              ? 'bg-[#EF4444]/20 text-[#EF4444]'
                              : rev.status === 'CHANGES_REQUESTED'
                              ? 'bg-[#F59E0B]/20 text-[#F59E0B]'
                              : 'bg-[#3B82F6]/20 text-[#3B82F6]'
                          }`}
                        >
                          {rev.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#94A3B8]">
                        {rev.decidedAt
                          ? new Date(rev.decidedAt).toLocaleDateString()
                          : new Date(rev.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {rev.status === 'PENDING' && canApprove && (
                          <button
                            type="button"
                            data-testid={`btn-review-${rev.id}`}
                            onClick={() => {
                              setSelectedReview(rev);
                              setIsDecisionModalOpen(true);
                            }}
                            className="px-3 py-1 rounded-lg bg-[#06B6D4]/20 hover:bg-[#06B6D4]/30 text-[#22D3EE] text-xs font-bold transition-colors"
                          >
                            Review
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

        {/* Review Decision Modal */}
        {selectedReview && (
          <ReviewDecisionModal
            projectId={projectId}
            documentId={selectedReview.documentId || selectedReview.version?.documentId || ''}
            versionId={selectedReview.versionId || selectedReview.documentVersionId || ''}
            revisionCode={selectedReview.version?.revisionCode || '01'}
            documentTitle={selectedReview.version?.title || 'Document'}
            isOpen={isDecisionModalOpen}
            onClose={() => {
              setIsDecisionModalOpen(false);
              setSelectedReview(null);
            }}
            onSuccess={() => void loadReviews()}
          />
        )}
      </div>
    </AppShell>
  );
}
