'use client';

import React, { useState, useRef } from 'react';
import { X, Upload, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api-client';

interface NewRevisionModalProps {
  projectId: string;
  documentId: string;
  documentTitle: string;
  currentRevisionCode?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewRevisionModal({
  projectId,
  documentId,
  documentTitle,
  currentRevisionCode,
  isOpen,
  onClose,
  onSuccess,
}: NewRevisionModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [revisionCode, setRevisionCode] = useState('');
  const [title, setTitle] = useState('');
  const [changeNote, setChangeNote] = useState('');
  const [declaredScale, setDeclaredScale] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (!title) {
        setTitle(selected.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload as the new revision.');
      return;
    }
    if (!revisionCode.trim()) {
      setError('Revision code is required (e.g. 02, 03, B, P02).');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('revisionCode', revisionCode.trim());
      if (title.trim()) formData.append('title', title.trim());
      if (changeNote.trim()) formData.append('changeNote', changeNote.trim());
      if (declaredScale.trim()) formData.append('declaredScale', declaredScale.trim());

      await apiClient(`/projects/${projectId}/documents/${documentId}/versions`, {
        method: 'POST',
        body: formData,
      });

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to upload new revision';
      setError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-[#0D1527] border border-[#1E2E4E] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2E4E] bg-[#111C35]">
          <div>
            <h2 className="text-base font-bold text-[#F8FAFC]">Upload New Revision</h2>
            <p className="text-xs text-[#94A3B8] mt-0.5 truncate max-w-md">
              {documentTitle} {currentRevisionCode ? `(Current: Rev ${currentRevisionCode})` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
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

          {/* File Picker */}
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
              Select Replacement File <span className="text-[#EF4444]">*</span>
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                file
                  ? 'border-[#14B8A6] bg-[#14B8A6]/5'
                  : 'border-[#1E2E4E] hover:border-[#14B8A6]/50 bg-[#111C35]/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              {file ? (
                <div className="flex items-center justify-center gap-2 text-xs text-[#14B8A6] font-medium">
                  <FileText className="w-4 h-4" />
                  <span className="truncate max-w-xs">{file.name}</span>
                  <span className="text-[10px] text-[#64748B]">
                    ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5 py-1">
                  <Upload className="w-6 h-6 text-[#94A3B8]" />
                  <p className="text-xs text-[#F8FAFC] font-medium">Click to choose file</p>
                  <p className="text-[10px] text-[#64748B]">PDF, DWG, DXF, XLSX, DOCX up to 500MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Revision Code */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
                Revision Code <span className="text-[#EF4444]">*</span>
              </label>
              <input
                type="text"
                data-testid="input-revision-code"
                value={revisionCode}
                onChange={(e) => setRevisionCode(e.target.value)}
                placeholder="e.g. 02, 03, B, P02"
                required
                disabled={isUploading}
                className="w-full px-3 py-2 rounded-lg bg-[#111C35] border border-[#1E2E4E] text-xs text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#14B8A6]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
                Declared Scale (Optional)
              </label>
              <input
                type="text"
                value={declaredScale}
                onChange={(e) => setDeclaredScale(e.target.value)}
                placeholder="e.g. 1:100, 1:50"
                disabled={isUploading}
                className="w-full px-3 py-2 rounded-lg bg-[#111C35] border border-[#1E2E4E] text-xs text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#14B8A6]"
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
              Revision Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Descriptive title for this revision"
              disabled={isUploading}
              className="w-full px-3 py-2 rounded-lg bg-[#111C35] border border-[#1E2E4E] text-xs text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#14B8A6]"
            />
          </div>

          {/* Change Note */}
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
              Change Note / Revision Summary
            </label>
            <textarea
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
              placeholder="Describe modifications, RFI references, or specification changes..."
              rows={3}
              disabled={isUploading}
              className="w-full px-3 py-2 rounded-lg bg-[#111C35] border border-[#1E2E4E] text-xs text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#14B8A6] resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1E2E4E]">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#111C35] hover:bg-[#1E2E4E] text-[#94A3B8] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="btn-submit-revision"
              disabled={isUploading || !file || !revisionCode.trim()}
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-[#14B8A6] hover:bg-[#0D9488] text-[#0D1527] font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Uploading Revision...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Revision</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
