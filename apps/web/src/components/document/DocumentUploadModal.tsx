'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Trash2,
  Layers,
  FolderTree,
} from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api-client';
import {
  DocumentCategory,
  DocumentDiscipline,
  DocumentFileFormat,
} from '@buildmind/shared-types';

interface DocumentUploadModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface SpatialOption {
  id: string;
  name: string;
  nodeType: string;
}

interface WorkPackageOption {
  id: string;
  name: string;
  code: string;
}

export function DocumentUploadModal({
  projectId,
  isOpen,
  onClose,
  onSuccess,
}: DocumentUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [reference, setReference] = useState('');
  const [category, setCategory] = useState<DocumentCategory>(DocumentCategory.ARCHITECTURAL_DRAWING);
  const [discipline, setDiscipline] = useState<DocumentDiscipline>(DocumentDiscipline.ARCHITECTURE);
  const [description, setDescription] = useState('');
  const [selectedSpatialNodeIds, setSelectedSpatialNodeIds] = useState<string[]>([]);
  const [selectedWorkPackageIds, setSelectedWorkPackageIds] = useState<string[]>([]);

  // Project link options
  const [spatialNodes, setSpatialNodes] = useState<SpatialOption[]>([]);
  const [workPackages, setWorkPackages] = useState<WorkPackageOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Upload progress and state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState<'idle' | 'initiating' | 'uploading' | 'verifying' | 'completed' | 'error'>('idle');
  const [progressPercent, setProgressPercent] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch project nodes when modal opens
  useEffect(() => {
    if (!isOpen) return;

    // Reset fields on modal open
    setSelectedFile(null);
    setTitle('');
    setReference('');
    setDescription('');
    setCategory(DocumentCategory.ARCHITECTURAL_DRAWING);
    setDiscipline(DocumentDiscipline.ARCHITECTURE);
    setSelectedSpatialNodeIds([]);
    setSelectedWorkPackageIds([]);
    setErrorMessage(null);
    setIsUploading(false);
    setProgressPercent(0);
    setUploadStep('idle');

    let mounted = true;
    async function fetchProjectNodes() {
      try {
        setLoadingOptions(true);
        const [spatialRes, wbsRes] = await Promise.all([
          apiClient<any[]>(`/projects/${projectId}/spatial-nodes`).catch(() => []),
          apiClient<any[]>(`/projects/${projectId}/work-packages`).catch(() => []),
        ]);
        if (mounted) {
          setSpatialNodes(spatialRes.map((n) => ({ id: n.id, name: n.name, nodeType: n.nodeType })));
          setWorkPackages(wbsRes.map((w) => ({ id: w.id, name: w.name, code: w.code })));
        }
      } finally {
        if (mounted) setLoadingOptions(false);
      }
    }

    void fetchProjectNodes();
    return () => {
      mounted = false;
    };
  }, [isOpen, projectId]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setErrorMessage(null);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setErrorMessage(null);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  async function calculateSha256(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage('Please select a file to upload');
      return;
    }

    try {
      setIsUploading(true);
      setErrorMessage(null);
      setProgressPercent(10);
      setUploadStep('initiating');

      // 1. Calculate SHA-256 of file
      const sha256 = await calculateSha256(selectedFile);
      setProgressPercent(30);

      // 2. Initiate upload session
      const session = await apiClient<any>(`/projects/${projectId}/documents/upload-sessions`, {
        method: 'POST',
        body: JSON.stringify({
          declaredFilename: selectedFile.name,
          declaredMimeType: selectedFile.type || 'application/octet-stream',
          declaredSizeBytes: selectedFile.size,
          category,
          discipline,
          reference: reference.trim() || undefined,
          title: title.trim() || selectedFile.name,
          description: description.trim() || undefined,
          spatialNodeIds: selectedSpatialNodeIds,
          workPackageIds: selectedWorkPackageIds,
        }),
      });

      setProgressPercent(50);
      setUploadStep('uploading');

      // 3. Upload file to quarantine via multipart form
      const formData = new FormData();
      formData.append('file', selectedFile);

      await apiClient(`/projects/${projectId}/documents/upload-sessions/${session.id}/file`, {
        method: 'POST',
        body: formData,
      });

      setProgressPercent(80);
      setUploadStep('verifying');

      // 4. Complete upload session
      await apiClient(`/projects/${projectId}/documents/upload-sessions/complete`, {
        method: 'POST',
        body: JSON.stringify({
          sessionId: session.id,
          checksumSha256: sha256,
          title: title.trim() || selectedFile.name,
          reference: reference.trim() || undefined,
          description: description.trim() || undefined,
          category,
          discipline,
          spatialNodeIds: selectedSpatialNodeIds,
          workPackageIds: selectedWorkPackageIds,
        }),
      });

      setProgressPercent(100);
      setUploadStep('completed');

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 600);
    } catch (err: unknown) {
      setUploadStep('error');
      const msg = err instanceof ApiError ? err.message : 'Upload failed. Please check file format and size.';
      setErrorMessage(msg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0D1527] border border-[#1E2E4E] rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#1E2E4E] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Upload className="w-5 h-5 text-[#14B8A6]" />
            <h2 className="text-sm font-bold text-[#F8FAFC]">Upload Project Document</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="text-[#94A3B8] hover:text-[#F8FAFC] transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <input
            id="file-upload-input"
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept=".pdf,.png,.jpg,.jpeg,.tiff,.tif,.docx,.xlsx,.csv,.txt,.ifc,.dwg,.dxf"
          />

          {errorMessage && (
            <div className="p-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 flex items-center gap-2 text-xs text-[#EF4444]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Drag & Drop Zone */}
          {!selectedFile ? (
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-[#1E2E4E] hover:border-[#14B8A6]/50 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-[#111C35]/50 group"
              onClick={() => document.getElementById('file-upload-input')?.click()}
            >
              <div className="w-12 h-12 rounded-full bg-[#14B8A6]/10 border border-[#14B8A6]/20 flex items-center justify-center text-[#14B8A6] mb-3 group-hover:scale-105 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-[#F8FAFC] mb-1">
                Drag and drop your document here, or <span className="text-[#14B8A6]">browse</span>
              </p>
              <p className="text-[11px] text-[#64748B]">
                Supported: PDF, DWG, DXF, IFC, PNG, JPG, TIFF, DOCX, XLSX, CSV (Max 500 MB)
              </p>
            </div>
          ) : (
            <div className="p-3.5 rounded-lg bg-[#111C35] border border-[#1E2E4E] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#14B8A6]/10 flex items-center justify-center text-[#14B8A6]">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#F8FAFC]">{selectedFile.name}</p>
                  <p className="text-[10px] text-[#64748B]">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type || 'Standard'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                disabled={isUploading}
                className="text-[#94A3B8] hover:text-[#EF4444] transition-colors p-1"
                title="Remove file"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Metadata Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">
                Document Title *
              </label>
              <input
                type="text"
                required
                data-testid="input-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Architectural Ground Floor Plan"
                className="w-full px-3 py-2 text-xs rounded-lg bg-[#111C35] border border-[#1E2E4E] text-[#F8FAFC] focus:outline-none focus:border-[#14B8A6]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">
                Document Reference / Code
              </label>
              <input
                type="text"
                data-testid="input-reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. DOC-ARCH-001 (auto-generated if empty)"
                className="w-full px-3 py-2 text-xs rounded-lg bg-[#111C35] border border-[#1E2E4E] text-[#F8FAFC] focus:outline-none focus:border-[#14B8A6]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">
                Category *
              </label>
              <select
                data-testid="select-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as DocumentCategory)}
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
              <label className="block text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">
                Discipline *
              </label>
              <select
                data-testid="select-discipline"
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value as DocumentDiscipline)}
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
            <label className="block text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">
              Description & Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes or revision details regarding this file..."
              className="w-full px-3 py-2 text-xs rounded-lg bg-[#111C35] border border-[#1E2E4E] text-[#F8FAFC] focus:outline-none focus:border-[#14B8A6] resize-none"
            />
          </div>

          {/* Spatial Node & Work Package Link Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5 text-[#14B8A6]" />
                <span>Link Spatial Breakdown (SBS)</span>
              </div>
              <div className="max-h-28 overflow-y-auto rounded-lg bg-[#111C35] border border-[#1E2E4E] p-2 space-y-1">
                {loadingOptions ? (
                  <div className="text-[10px] text-[#64748B] flex items-center gap-1 py-1">
                    <Loader2 className="w-3 h-3 animate-spin text-[#14B8A6]" />
                    <span>Loading nodes...</span>
                  </div>
                ) : spatialNodes.length === 0 ? (
                  <p className="text-[10px] text-[#64748B] italic">No spatial nodes defined yet</p>
                ) : (
                  spatialNodes.map((node) => (
                    <label
                      key={node.id}
                      className="flex items-center gap-2 text-xs text-[#94A3B8] hover:text-[#F8FAFC] cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSpatialNodeIds.includes(node.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSpatialNodeIds([...selectedSpatialNodeIds, node.id]);
                          } else {
                            setSelectedSpatialNodeIds(selectedSpatialNodeIds.filter((id) => id !== node.id));
                          }
                        }}
                        className="rounded border-[#1E2E4E] text-[#14B8A6] focus:ring-0"
                      />
                      <span>
                        {node.name} <span className="text-[10px] text-[#64748B]">({node.nodeType})</span>
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                <FolderTree className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>Link Work Breakdown (WBS)</span>
              </div>
              <div className="max-h-28 overflow-y-auto rounded-lg bg-[#111C35] border border-[#1E2E4E] p-2 space-y-1">
                {loadingOptions ? (
                  <div className="text-[10px] text-[#64748B] flex items-center gap-1 py-1">
                    <Loader2 className="w-3 h-3 animate-spin text-[#38BDF8]" />
                    <span>Loading packages...</span>
                  </div>
                ) : workPackages.length === 0 ? (
                  <p className="text-[10px] text-[#64748B] italic">No work packages defined yet</p>
                ) : (
                  workPackages.map((pkg) => (
                    <label
                      key={pkg.id}
                      className="flex items-center gap-2 text-xs text-[#94A3B8] hover:text-[#F8FAFC] cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedWorkPackageIds.includes(pkg.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedWorkPackageIds([...selectedWorkPackageIds, pkg.id]);
                          } else {
                            setSelectedWorkPackageIds(selectedWorkPackageIds.filter((id) => id !== pkg.id));
                          }
                        }}
                        className="rounded border-[#1E2E4E] text-[#38BDF8] focus:ring-0"
                      />
                      <span>
                        <span className="font-mono text-[10px] text-[#38BDF8] mr-1">[{pkg.code}]</span>
                        {pkg.name}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Progress Indicator */}
          {isUploading && (
            <div className="p-3 rounded-lg bg-[#111C35] border border-[#1E2E4E] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#94A3B8] capitalize flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#14B8A6]" />
                  {uploadStep}...
                </span>
                <span className="font-mono text-[#14B8A6]">{progressPercent}%</span>
              </div>
              <div className="w-full h-1.5 bg-[#1E2E4E] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#14B8A6] to-[#38BDF8] transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="pt-3 border-t border-[#1E2E4E] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#111C35] hover:bg-[#1E2E4E] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="btn-submit-upload"
              disabled={isUploading || !selectedFile}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#14B8A6] hover:bg-[#0D9488] text-[#0D1527] font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload & Register</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
