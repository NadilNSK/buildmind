'use client';

import React, { useState, useEffect } from 'react';
import { X, ArrowRight, CheckCircle2, AlertTriangle, Hash, Layers, FolderTree, Loader2, GitCompare } from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api-client';
import { DocumentVersionSummary, VersionComparisonDiff } from '@buildmind/shared-types';

interface RevisionCompareModalProps {
  projectId: string;
  documentId: string;
  versions: DocumentVersionSummary[];
  isOpen: boolean;
  onClose: () => void;
}

export function RevisionCompareModal({
  projectId,
  documentId,
  versions,
  isOpen,
  onClose,
}: RevisionCompareModalProps) {
  const [fromVersionId, setFromVersionId] = useState<string>('');
  const [toVersionId, setToVersionId] = useState<string>('');
  const [diff, setDiff] = useState<VersionComparisonDiff | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (versions.length >= 2) {
      // Default to comparing previous version to latest version
      setFromVersionId(versions[1].id);
      setToVersionId(versions[0].id);
    } else if (versions.length === 1) {
      setFromVersionId(versions[0].id);
      setToVersionId(versions[0].id);
    }
  }, [versions]);

  useEffect(() => {
    if (!isOpen || !fromVersionId || !toVersionId) return;

    let mounted = true;
    async function loadDiff() {
      try {
        setLoading(true);
        setError(null);
        const data = await apiClient<VersionComparisonDiff>(
          `/projects/${projectId}/documents/${documentId}/versions/compare?fromVersionId=${fromVersionId}&toVersionId=${toVersionId}`,
        );
        if (mounted) setDiff(data);
      } catch (err: unknown) {
        if (mounted) {
          const msg = err instanceof ApiError ? err.message : 'Failed to compare revisions';
          setError(msg);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadDiff();
    return () => {
      mounted = false;
    };
  }, [isOpen, fromVersionId, toVersionId, projectId, documentId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-2xl bg-[#0D1527] border border-[#1E2E4E] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2E4E] bg-[#111C35]">
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-[#14B8A6]" />
            <div>
              <h2 className="text-base font-bold text-[#F8FAFC]">Compare Document Revisions</h2>
              <p className="text-xs text-[#94A3B8]">Inspect metadata, file sizes, and cryptographic checksum differences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E2E4E] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selection Bar */}
        <div className="p-4 bg-[#111C35]/60 border-b border-[#1E2E4E] grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
              Base Revision (From)
            </label>
            <select
              value={fromVersionId}
              onChange={(e) => setFromVersionId(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-[#0D1527] border border-[#1E2E4E] text-xs text-[#F8FAFC] focus:outline-none focus:border-[#14B8A6]"
            >
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  Rev {v.revisionCode} (v{v.versionNumber}) — {v.workflowStatus}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
              Target Revision (To)
            </label>
            <select
              value={toVersionId}
              onChange={(e) => setToVersionId(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-[#0D1527] border border-[#1E2E4E] text-xs text-[#F8FAFC] focus:outline-none focus:border-[#14B8A6]"
            >
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  Rev {v.revisionCode} (v{v.versionNumber}) — {v.workflowStatus}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-[#94A3B8] space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#14B8A6]" />
              <span className="text-xs">Computing side-by-side diff...</span>
            </div>
          ) : error ? (
            <div className="p-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/20 text-xs text-[#EF4444]">
              {error}
            </div>
          ) : diff ? (
            <div className="space-y-4">
              {/* Checksum Equality Card */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  diff.isChecksumIdentical
                    ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]'
                    : 'bg-[#38BDF8]/10 border-[#38BDF8]/30 text-[#38BDF8]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {diff.isChecksumIdentical ? (
                    <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
                  ) : (
                    <Hash className="w-5 h-5 text-[#38BDF8]" />
                  )}
                  <div>
                    <h4 className="text-xs font-bold">
                      {diff.isChecksumIdentical
                        ? 'Identical Cryptographic Checksums'
                        : 'File Binary Content Modified'}
                    </h4>
                    <p className="text-[11px] opacity-80">
                      {diff.isChecksumIdentical
                        ? 'Both versions share identical SHA-256 hashes (metadata revision only)'
                        : `File payload has changed. Size delta: ${(diff.fileSizeDifferenceBytes / 1024).toFixed(1)} KB`}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-black/20">
                  {diff.fileSizeDifferenceBytes >= 0 ? `+${diff.fileSizeDifferenceBytes} B` : `${diff.fileSizeDifferenceBytes} B`}
                </span>
              </div>

              {/* Side by side comparison table */}
              <div className="rounded-xl border border-[#1E2E4E] overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-[#111C35] text-[11px] text-[#94A3B8] uppercase border-b border-[#1E2E4E]">
                    <tr>
                      <th className="py-2.5 px-3">Attribute</th>
                      <th className="py-2.5 px-3">
                        Rev {diff.fromVersion.revisionCode} (v{diff.fromVersion.versionNumber})
                      </th>
                      <th className="py-2.5 px-3">
                        Rev {diff.toVersion.revisionCode} (v{diff.toVersion.versionNumber})
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E2E4E] bg-[#0D1527]">
                    <tr>
                      <td className="py-2 px-3 text-[#64748B] font-semibold">Workflow Status</td>
                      <td className="py-2 px-3 text-[#F8FAFC]">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1E2E4E]">
                          {diff.fromVersion.workflowStatus}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-[#F8FAFC]">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#14B8A6]/20 text-[#14B8A6]">
                          {diff.toVersion.workflowStatus}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-[#64748B] font-semibold">File Size</td>
                      <td className="py-2 px-3 text-[#F8FAFC]">
                        {(Number(diff.fromVersion.fileSizeBytes) / 1024).toFixed(1)} KB
                      </td>
                      <td className="py-2 px-3 text-[#F8FAFC]">
                        {(Number(diff.toVersion.fileSizeBytes) / 1024).toFixed(1)} KB
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-[#64748B] font-semibold">SHA-256 Checksum</td>
                      <td className="py-2 px-3 font-mono text-[10px] text-[#94A3B8] truncate max-w-[140px]" title={diff.fromVersion.checksumSha256}>
                        {diff.fromVersion.checksumSha256.substring(0, 16)}...
                      </td>
                      <td className="py-2 px-3 font-mono text-[10px] text-[#94A3B8] truncate max-w-[140px]" title={diff.toVersion.checksumSha256}>
                        {diff.toVersion.checksumSha256.substring(0, 16)}...
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-[#64748B] font-semibold">Uploader</td>
                      <td className="py-2 px-3 text-[#F8FAFC]">
                        {diff.fromVersion.uploadedBy?.fullName || 'System User'}
                      </td>
                      <td className="py-2 px-3 text-[#F8FAFC]">
                        {diff.toVersion.uploadedBy?.fullName || 'System User'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-[#64748B] font-semibold">Created At</td>
                      <td className="py-2 px-3 text-[#94A3B8]">
                        {new Date(diff.fromVersion.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-2 px-3 text-[#94A3B8]">
                        {new Date(diff.toVersion.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Spatial Breakdown Differences */}
              {diff.spatialDifferences && (
                <div className="p-3 rounded-lg bg-[#111C35] border border-[#1E2E4E] space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#14B8A6]">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Spatial Breakdown (SBS) Links</span>
                  </div>
                  <div className="text-[11px] text-[#94A3B8]">
                    {diff.spatialDifferences.added.length === 0 && diff.spatialDifferences.removed.length === 0 ? (
                      <p className="text-[#64748B] italic">No spatial association changes between versions</p>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {diff.spatialDifferences.added.map((s: any) => (
                          <span key={s.id} className="px-1.5 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] text-[10px]">
                            + {s.name}
                          </span>
                        ))}
                        {diff.spatialDifferences.removed.map((s: any) => (
                          <span key={s.id} className="px-1.5 py-0.5 rounded bg-[#EF4444]/20 text-[#EF4444] text-[10px]">
                            - {s.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1E2E4E] flex justify-end bg-[#111C35]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#1E2E4E] text-[#F8FAFC] hover:bg-[#2A3F6C] transition-colors"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
}
