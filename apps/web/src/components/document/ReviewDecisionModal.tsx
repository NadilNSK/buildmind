'use client';

import React, { useState } from 'react';
import { X, CheckCircle, XCircle, AlertCircle, Loader2, ClipboardCheck } from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api-client';
import { ReviewDecision } from '@buildmind/shared-types';

interface ReviewDecisionModalProps {
  projectId: string;
  documentId: string;
  versionId: string;
  revisionCode: string;
  documentTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReviewDecisionModal({
  projectId,
  documentId,
  versionId,
  revisionCode,
  documentTitle,
  isOpen,
  onClose,
  onSuccess,
}: ReviewDecisionModalProps) {
  const [decision, setDecision] = useState<ReviewDecision>(ReviewDecision.APPROVED);
  const [comments, setComments] = useState('');
  const [decisionNote, setDecisionNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      await apiClient(
        `/projects/${projectId}/documents/${documentId}/versions/${versionId}/review-decision`,
        {
          method: 'POST',
          body: JSON.stringify({
            decision,
            comments: comments.trim() || undefined,
            decisionNote: decisionNote.trim() || undefined,
          }),
        },
      );

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to record review decision';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-[#0D1527] border border-[#1E2E4E] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2E4E] bg-[#111C35]">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-[#14B8A6]" />
            <div>
              <h2 className="text-base font-bold text-[#F8FAFC]">Review Document Revision</h2>
              <p className="text-xs text-[#94A3B8]">
                {documentTitle} (Rev {revisionCode})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E2E4E] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-start gap-2 text-xs text-[#EF4444]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Decision Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-2">
              Select Decision <span className="text-[#EF4444]">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDecision(ReviewDecision.APPROVED)}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                  decision === ReviewDecision.APPROVED
                    ? 'border-[#10B981] bg-[#10B981]/15 text-[#10B981]'
                    : 'border-[#1E2E4E] bg-[#111C35] text-[#94A3B8] hover:border-[#10B981]/50'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                <span>Approve</span>
              </button>

              <button
                type="button"
                onClick={() => setDecision(ReviewDecision.CHANGES_REQUESTED)}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                  decision === ReviewDecision.CHANGES_REQUESTED
                    ? 'border-[#F59E0B] bg-[#F59E0B]/15 text-[#F59E0B]'
                    : 'border-[#1E2E4E] bg-[#111C35] text-[#94A3B8] hover:border-[#F59E0B]/50'
                }`}
              >
                <AlertCircle className="w-4 h-4" />
                <span>Changes</span>
              </button>

              <button
                type="button"
                onClick={() => setDecision(ReviewDecision.REJECTED)}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                  decision === ReviewDecision.REJECTED
                    ? 'border-[#EF4444] bg-[#EF4444]/15 text-[#EF4444]'
                    : 'border-[#1E2E4E] bg-[#111C35] text-[#94A3B8] hover:border-[#EF4444]/50'
                }`}
              >
                <XCircle className="w-4 h-4" />
                <span>Reject</span>
              </button>
            </div>
          </div>

          {/* Decision Note / Standard Compliance */}
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
              Standard Compliance / Decision Note
            </label>
            <input
              type="text"
              value={decisionNote}
              onChange={(e) => setDecisionNote(e.target.value)}
              placeholder="e.g. Complies with SLS 573 rules / Architectural schedule v2"
              disabled={loading}
              className="w-full px-3 py-2 rounded-lg bg-[#111C35] border border-[#1E2E4E] text-xs text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#14B8A6]"
            />
          </div>

          {/* Detailed Comments */}
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
              Review Comments & Feedback
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Enter review remarks, required modifications, or approval notes..."
              rows={3}
              disabled={loading}
              className="w-full px-3 py-2 rounded-lg bg-[#111C35] border border-[#1E2E4E] text-xs text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#14B8A6] resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1E2E4E]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#111C35] hover:bg-[#1E2E4E] text-[#94A3B8] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="btn-confirm-review-decision"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-[#14B8A6] hover:bg-[#0D9488] text-[#0D1527] font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  <span>Record Decision</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
