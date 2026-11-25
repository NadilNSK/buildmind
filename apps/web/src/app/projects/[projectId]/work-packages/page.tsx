'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { ProjectHeader } from '@/components/project/ProjectHeader';
import { ProjectNav } from '@/components/project/ProjectNav';
import {
  ListTree,
  Plus,
  Search,
  ChevronRight,
  ChevronDown,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FolderPlus,
  X,
  Layers,
} from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api-client';
import { useOrganization } from '@/context/organization-context';

interface WorkPackageItem {
  id: string;
  projectId: string;
  parentPackageId?: string | null;
  code: string;
  name: string;
  description?: string | null;
  displayOrder: number;
  status: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  childCount?: number;
  childPackages?: WorkPackageItem[];
}

export default function WorkPackagesPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { currentOrganization, hasPermission } = useOrganization();

  const [project, setProject] = useState<any | null>(null);
  const [packages, setPackages] = useState<WorkPackageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedPackages, setExpandedPackages] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [targetPackage, setTargetPackage] = useState<WorkPackageItem | null>(null);
  const [parentPackageForCreate, setParentPackageForCreate] = useState<WorkPackageItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form inputs
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDisplayOrder, setFormDisplayOrder] = useState<number>(0);
  const [formParentId, setFormParentId] = useState<string | null>(null);

  const canManage = hasPermission('projects.wbs.manage');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [projData, packagesData] = await Promise.all([
        apiClient<any>(`/projects/${projectId}`),
        apiClient<WorkPackageItem[]>(`/projects/${projectId}/work-packages`),
      ]);
      setProject(projData);
      setPackages(packagesData);

      // Auto expand all packages initially
      const initialExpanded: Record<string, boolean> = {};
      packagesData.forEach((p) => {
        initialExpanded[p.id] = true;
      });
      setExpandedPackages(initialExpanded);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load work packages';
      setMessage({ type: 'error', text: msg });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      void loadData();
    }
  }, [projectId, currentOrganization?.id]);

  const toggleExpand = (id: string) => {
    setExpandedPackages((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Build tree hierarchy
  const { rootPackages, packageMap } = useMemo(() => {
    const map = new Map<string, WorkPackageItem & { children: WorkPackageItem[] }>();
    packages.forEach((p) => {
      map.set(p.id, { ...p, children: [] });
    });

    const roots: (WorkPackageItem & { children: WorkPackageItem[] })[] = [];
    packages.forEach((p) => {
      const pkgWithChildren = map.get(p.id)!;
      if (p.parentPackageId && map.has(p.parentPackageId)) {
        map.get(p.parentPackageId)!.children.push(pkgWithChildren);
      } else {
        roots.push(pkgWithChildren);
      }
    });

    return { rootPackages: roots, packageMap: map };
  }, [packages]);

  const openCreateModal = (parent?: WorkPackageItem) => {
    setModalMode('create');
    setParentPackageForCreate(parent || null);
    setFormParentId(parent ? parent.id : null);
    // Suggest code based on parent
    if (parent) {
      setFormCode(`${parent.code}.01`);
    } else {
      const nextNum = String(packages.filter((p) => !p.parentPackageId).length + 1).padStart(2, '0');
      setFormCode(nextNum);
    }
    setFormName('');
    setFormDescription('');
    setFormDisplayOrder(packages.length);
    setMessage(null);
    setIsModalOpen(true);
  };

  const openEditModal = (pkg: WorkPackageItem) => {
    setModalMode('edit');
    setTargetPackage(pkg);
    setFormParentId(pkg.parentPackageId || null);
    setFormCode(pkg.code);
    setFormName(pkg.name);
    setFormDescription(pkg.description || '');
    setFormDisplayOrder(pkg.displayOrder);
    setMessage(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim() || !formName.trim()) {
      setMessage({ type: 'error', text: 'Package code and name are required' });
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage(null);

      if (modalMode === 'create') {
        await apiClient(`/projects/${projectId}/work-packages`, {
          method: 'POST',
          body: JSON.stringify({
            parentPackageId: formParentId,
            code: formCode.trim(),
            name: formName.trim(),
            description: formDescription.trim() || undefined,
            displayOrder: Number(formDisplayOrder) || 0,
          }),
        });
        setMessage({ type: 'success', text: `Work package "${formCode} - ${formName}" created successfully` });
      } else if (modalMode === 'edit' && targetPackage) {
        await apiClient(`/projects/${projectId}/work-packages/${targetPackage.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            parentPackageId: formParentId,
            code: formCode.trim(),
            name: formName.trim(),
            description: formDescription.trim() || undefined,
            displayOrder: Number(formDisplayOrder) || 0,
          }),
        });
        setMessage({ type: 'success', text: `Work package "${formCode} - ${formName}" updated successfully` });
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Operation failed';
      setMessage({ type: 'error', text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchivePackage = async (pkg: WorkPackageItem) => {
    const confirmDelete = window.confirm(
      `Archive work package "${pkg.code} - ${pkg.name}"? Sub-packages will also be archived from active views.`,
    );
    if (!confirmDelete) return;

    try {
      setMessage(null);
      await apiClient(`/projects/${projectId}/work-packages/${pkg.id}`, {
        method: 'DELETE',
      });
      setMessage({ type: 'success', text: `Work package "${pkg.code}" archived successfully` });
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to archive work package';
      setMessage({ type: 'error', text: msg });
    }
  };

  const matchesFilter = (pkg: WorkPackageItem): boolean => {
    const term = searchTerm.toLowerCase().trim();
    return !term || pkg.code.toLowerCase().includes(term) || pkg.name.toLowerCase().includes(term);
  };

  const renderTreePackage = (pkg: WorkPackageItem & { children: WorkPackageItem[] }, depth = 0) => {
    const isExpanded = !!expandedPackages[pkg.id];
    const hasChildren = pkg.children && pkg.children.length > 0;
    const isVisible = matchesFilter(pkg) || pkg.children.some((c) => matchesFilter(c));

    if (!isVisible && searchTerm) {
      return null;
    }

    return (
      <div key={pkg.id} className="space-y-1">
        <div
          className={`group flex items-center justify-between p-2.5 rounded-lg border transition-all ${
            depth === 0
              ? 'bg-[#111C35] border-[#1E2E4E] hover:border-[#3B82F6]/40'
              : 'bg-[#0B1220]/70 border-[#1E2E4E]/60 hover:border-[#3B82F6]/30'
          }`}
          style={{ marginLeft: `${depth * 20}px` }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {hasChildren ? (
              <button
                onClick={() => toggleExpand(pkg.id)}
                className="p-1 rounded text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E2E4E]/60 transition-colors"
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <span className="w-5 text-center text-[#64748B] text-xs">•</span>
            )}

            <span className="text-xs font-mono font-bold text-[#3B82F6] bg-[#3B82F6]/10 px-2 py-0.5 rounded border border-[#3B82F6]/25">
              {pkg.code}
            </span>

            <span className="text-xs font-semibold text-[#F8FAFC] truncate">{pkg.name}</span>

            {pkg.description && (
              <span className="text-[11px] text-[#64748B] truncate hidden md:inline">
                — {pkg.description}
              </span>
            )}

            {hasChildren && (
              <span className="text-[10px] font-mono text-[#64748B] bg-[#070C16] px-1.5 py-0.5 rounded border border-[#1E2E4E]">
                {pkg.children.length} sub-packages
              </span>
            )}
          </div>

          {canManage && (
            <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => openCreateModal(pkg)}
                title="Add Sub-Package"
                className="p-1.5 rounded text-[#3B82F6] hover:bg-[#3B82F6]/10 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => openEditModal(pkg)}
                title="Edit Package"
                className="p-1.5 rounded text-[#CBD5E1] hover:bg-[#1E2E4E] transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => void handleArchivePackage(pkg)}
                title="Archive Package"
                className="p-1.5 rounded text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {pkg.children.map((child) =>
              renderTreePackage(child as WorkPackageItem & { children: WorkPackageItem[] }, depth + 1),
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-6xl mx-auto">
        {project && <ProjectHeader project={project} />}

        {message && (
          <div
            className={`p-3.5 rounded-lg border flex items-center gap-2.5 text-xs ${
              message.type === 'success'
                ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]'
                : 'bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444]'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <ProjectNav
          projectId={projectId}
          workPackageCount={packages.length}
        />

        {/* Toolbar & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#F8FAFC] flex items-center gap-2">
              <ListTree className="w-5 h-5 text-[#3B82F6]" />
              <span>Work Breakdown Structure (WBS)</span>
            </h2>
            <p className="text-xs text-[#94A3B8]">
              Hierarchical classification of project scope: Trade packages &gt; Work sections &gt; Detailed deliverables.
            </p>
          </div>

          {canManage && (
            <button
              onClick={() => openCreateModal()}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-semibold transition-colors shadow-sm shadow-[#3B82F6]/20 cursor-pointer self-start sm:self-auto"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Add Root Package</span>
            </button>
          )}
        </div>

        {/* Filter Bar */}
        <div className="rounded-xl bg-[#111C35] border border-[#1E2E4E] p-3 flex items-center justify-between">
          <div className="w-full sm:w-96 relative">
            <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search work packages by code or name..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#070C16] border border-[#1E2E4E] text-[#F8FAFC] text-xs focus:outline-none focus:border-[#3B82F6]"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
            <button
              onClick={() => {
                const all: Record<string, boolean> = {};
                packages.forEach((p) => (all[p.id] = true));
                setExpandedPackages(all);
              }}
              className="text-[11px] text-[#3B82F6] hover:underline"
            >
              Expand All
            </button>
            <span>•</span>
            <button
              onClick={() => setExpandedPackages({})}
              className="text-[11px] text-[#64748B] hover:text-[#94A3B8]"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* WBS Tree */}
        <div className="rounded-xl bg-[#111C35] border border-[#1E2E4E] p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E2E4E] pb-3 text-xs text-[#94A3B8]">
            <span>Work Breakdown Packages ({packages.length} active packages)</span>
            <span className="font-mono text-[11px] text-[#64748B]">SLS 573 / CESMM4 Aligned</span>
          </div>

          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3 text-xs text-[#94A3B8]">
              <Loader2 className="w-6 h-6 animate-spin text-[#3B82F6]" />
              <span>Loading work packages...</span>
            </div>
          ) : rootPackages.length > 0 ? (
            <div className="space-y-2">
              {rootPackages.map((root) => renderTreePackage(root, 0))}
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-[#64748B] space-y-3">
              <ListTree className="w-8 h-8 mx-auto text-[#64748B]/50" />
              <div>
                <h3 className="font-semibold text-[#CBD5E1]">No Work Packages Defined</h3>
                <p className="text-[11px] text-[#64748B] mt-1 max-w-sm mx-auto">
                  Create root work packages (e.g. "01 Substructure", "02 Superstructure") to structure your bill of quantities and cost estimates.
                </p>
              </div>
              {canManage && (
                <button
                  onClick={() => openCreateModal()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3B82F6] text-white text-xs font-semibold hover:bg-[#2563EB] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create First Package</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-[#000000]/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl bg-[#111C35] border border-[#1E2E4E] shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#1E2E4E] pb-3">
                <h3 className="text-sm font-bold text-[#F8FAFC]">
                  {modalMode === 'create'
                    ? parentPackageForCreate
                      ? `Add Sub-Package to "${parentPackageForCreate.code} - ${parentPackageForCreate.name}"`
                      : 'Add Root Work Package'
                    : `Edit Package "${targetPackage?.code}"`}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-[#64748B] hover:text-[#F8FAFC] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#CBD5E1] mb-1">
                      Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                      placeholder="01.01"
                      className="w-full px-3 py-2 rounded-lg bg-[#070C16] border border-[#1E2E4E] text-[#F8FAFC] text-xs font-mono focus:outline-none focus:border-[#3B82F6]"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold text-[#CBD5E1] mb-1">
                      Package Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Earthwork & Excavation"
                      className="w-full px-3 py-2 rounded-lg bg-[#070C16] border border-[#1E2E4E] text-[#F8FAFC] text-xs focus:outline-none focus:border-[#3B82F6]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#CBD5E1] mb-1">
                    Parent Package
                  </label>
                  <select
                    value={formParentId || ''}
                    onChange={(e) => setFormParentId(e.target.value || null)}
                    className="w-full px-3 py-2 rounded-lg bg-[#070C16] border border-[#1E2E4E] text-[#F8FAFC] text-xs focus:outline-none focus:border-[#3B82F6]"
                  >
                    <option value="">(None - Root Package)</option>
                    {packages
                      .filter((p) => modalMode !== 'edit' || p.id !== targetPackage?.id)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.code} — {p.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#CBD5E1] mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Trade breakdown, scope inclusions..."
                    className="w-full px-3 py-2 rounded-lg bg-[#070C16] border border-[#1E2E4E] text-[#F8FAFC] text-xs focus:outline-none focus:border-[#3B82F6]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1E2E4E]">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3 py-2 rounded-lg bg-[#070C16] hover:bg-[#1E2E4E] text-[#CBD5E1] text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !formCode.trim() || !formName.trim()}
                    className="px-4 py-2 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{modalMode === 'create' ? 'Create Package' : 'Save Changes'}</span>
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
