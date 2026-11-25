'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { ProjectHeader } from '@/components/project/ProjectHeader';
import { ProjectNav } from '@/components/project/ProjectNav';
import {
  Network,
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
  Layers,
  MapPin,
  X,
} from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api-client';
import { useOrganization } from '@/context/organization-context';
import { SpatialNodeType } from '@buildmind/shared-types';

interface SpatialNodeItem {
  id: string;
  projectId: string;
  parentNodeId?: string | null;
  nodeType: SpatialNodeType;
  name: string;
  code?: string | null;
  description?: string | null;
  displayOrder: number;
  status: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  childCount?: number;
  childNodes?: SpatialNodeItem[];
}

const NODE_TYPE_COLORS: Record<SpatialNodeType, { bg: string; text: string; border: string }> = {
  [SpatialNodeType.SITE]: { bg: 'bg-[#F59E0B]/10', text: 'text-[#F59E0B]', border: 'border-[#F59E0B]/30' },
  [SpatialNodeType.BUILDING]: { bg: 'bg-[#06B6D4]/10', text: 'text-[#06B6D4]', border: 'border-[#06B6D4]/30' },
  [SpatialNodeType.BLOCK]: { bg: 'bg-[#3B82F6]/10', text: 'text-[#3B82F6]', border: 'border-[#3B82F6]/30' },
  [SpatialNodeType.LEVEL]: { bg: 'bg-[#6366F1]/10', text: 'text-[#6366F1]', border: 'border-[#6366F1]/30' },
  [SpatialNodeType.ZONE]: { bg: 'bg-[#A855F7]/10', text: 'text-[#A855F7]', border: 'border-[#A855F7]/30' },
  [SpatialNodeType.ROOM]: { bg: 'bg-[#10B981]/10', text: 'text-[#10B981]', border: 'border-[#10B981]/30' },
  [SpatialNodeType.OTHER]: { bg: 'bg-[#64748B]/10', text: 'text-[#94A3B8]', border: 'border-[#64748B]/30' },
};

export default function SpatialHierarchyPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { currentOrganization, hasPermission } = useOrganization();

  const [project, setProject] = useState<any | null>(null);
  const [nodes, setNodes] = useState<SpatialNodeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [targetNode, setTargetNode] = useState<SpatialNodeItem | null>(null);
  const [parentNodeForCreate, setParentNodeForCreate] = useState<SpatialNodeItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form inputs
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formNodeType, setFormNodeType] = useState<SpatialNodeType>(SpatialNodeType.BUILDING);
  const [formDescription, setFormDescription] = useState('');
  const [formDisplayOrder, setFormDisplayOrder] = useState<number>(0);
  const [formParentId, setFormParentId] = useState<string | null>(null);

  const canManage = hasPermission('projects.spatial.manage');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [projData, nodesData] = await Promise.all([
        apiClient<any>(`/projects/${projectId}`),
        apiClient<SpatialNodeItem[]>(`/projects/${projectId}/spatial-nodes`),
      ]);
      setProject(projData);
      setNodes(nodesData);

      // Auto expand all nodes initially
      const initialExpanded: Record<string, boolean> = {};
      nodesData.forEach((n) => {
        initialExpanded[n.id] = true;
      });
      setExpandedNodes(initialExpanded);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load spatial breakdown';
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
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Build tree hierarchy from flat list
  const { rootNodes, nodeMap } = useMemo(() => {
    const map = new Map<string, SpatialNodeItem & { children: SpatialNodeItem[] }>();
    nodes.forEach((n) => {
      map.set(n.id, { ...n, children: [] });
    });

    const roots: (SpatialNodeItem & { children: SpatialNodeItem[] })[] = [];
    nodes.forEach((n) => {
      const nodeWithChildren = map.get(n.id)!;
      if (n.parentNodeId && map.has(n.parentNodeId)) {
        map.get(n.parentNodeId)!.children.push(nodeWithChildren);
      } else {
        roots.push(nodeWithChildren);
      }
    });

    return { rootNodes: roots, nodeMap: map };
  }, [nodes]);

  const openCreateModal = (parent?: SpatialNodeItem) => {
    setModalMode('create');
    setParentNodeForCreate(parent || null);
    setFormParentId(parent ? parent.id : null);
    setFormName('');
    setFormCode('');
    // Default child type heuristic
    if (parent) {
      if (parent.nodeType === SpatialNodeType.SITE) setFormNodeType(SpatialNodeType.BUILDING);
      else if (parent.nodeType === SpatialNodeType.BUILDING) setFormNodeType(SpatialNodeType.LEVEL);
      else if (parent.nodeType === SpatialNodeType.LEVEL) setFormNodeType(SpatialNodeType.ZONE);
      else if (parent.nodeType === SpatialNodeType.ZONE) setFormNodeType(SpatialNodeType.ROOM);
      else setFormNodeType(SpatialNodeType.ROOM);
    } else {
      setFormNodeType(SpatialNodeType.SITE);
    }
    setFormDescription('');
    setFormDisplayOrder(nodes.length);
    setMessage(null);
    setIsModalOpen(true);
  };

  const openEditModal = (node: SpatialNodeItem) => {
    setModalMode('edit');
    setTargetNode(node);
    setFormParentId(node.parentNodeId || null);
    setFormName(node.name);
    setFormCode(node.code || '');
    setFormNodeType(node.nodeType);
    setFormDescription(node.description || '');
    setFormDisplayOrder(node.displayOrder);
    setMessage(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setMessage({ type: 'error', text: 'Node name is required' });
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage(null);

      if (modalMode === 'create') {
        await apiClient(`/projects/${projectId}/spatial-nodes`, {
          method: 'POST',
          body: JSON.stringify({
            parentNodeId: formParentId,
            name: formName.trim(),
            code: formCode.trim() || undefined,
            nodeType: formNodeType,
            description: formDescription.trim() || undefined,
            displayOrder: Number(formDisplayOrder) || 0,
          }),
        });
        setMessage({ type: 'success', text: `Spatial node "${formName}" created successfully` });
      } else if (modalMode === 'edit' && targetNode) {
        await apiClient(`/projects/${projectId}/spatial-nodes/${targetNode.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            parentNodeId: formParentId,
            name: formName.trim(),
            code: formCode.trim() || undefined,
            nodeType: formNodeType,
            description: formDescription.trim() || undefined,
            displayOrder: Number(formDisplayOrder) || 0,
          }),
        });
        setMessage({ type: 'success', text: `Spatial node "${formName}" updated successfully` });
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

  const handleArchiveNode = async (node: SpatialNodeItem) => {
    const confirmDelete = window.confirm(
      `Archive spatial node "${node.name}" (${node.nodeType})? Any child nodes will also be archived from active views.`,
    );
    if (!confirmDelete) return;

    try {
      setMessage(null);
      await apiClient(`/projects/${projectId}/spatial-nodes/${node.id}`, {
        method: 'DELETE',
      });
      setMessage({ type: 'success', text: `Node "${node.name}" archived successfully` });
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to archive spatial node';
      setMessage({ type: 'error', text: msg });
    }
  };

  // Filter matching
  const matchesFilter = (node: SpatialNodeItem): boolean => {
    const term = searchTerm.toLowerCase().trim();
    const nameMatch = !term || node.name.toLowerCase().includes(term) || (node.code && node.code.toLowerCase().includes(term));
    const typeMatch = typeFilter === 'ALL' || node.nodeType === typeFilter;
    return Boolean(nameMatch && typeMatch);
  };

  // Render tree node recursive component
  const renderTreeNode = (node: SpatialNodeItem & { children: SpatialNodeItem[] }, depth = 0) => {
    const isExpanded = !!expandedNodes[node.id];
    const hasChildren = node.children && node.children.length > 0;
    const typeStyle = NODE_TYPE_COLORS[node.nodeType] || NODE_TYPE_COLORS.OTHER;
    const isVisible = matchesFilter(node) || node.children.some((c) => matchesFilter(c));

    if (!isVisible && (searchTerm || typeFilter !== 'ALL')) {
      return null;
    }

    return (
      <div key={node.id} className="space-y-1">
        <div
          className={`group flex items-center justify-between p-2.5 rounded-lg border transition-all ${
            depth === 0
              ? 'bg-[#111C35] border-[#1E2E4E] hover:border-[#14B8A6]/40'
              : 'bg-[#0B1220]/70 border-[#1E2E4E]/60 hover:border-[#14B8A6]/30'
          }`}
          style={{ marginLeft: `${depth * 20}px` }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {hasChildren ? (
              <button
                onClick={() => toggleExpand(node.id)}
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

            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-semibold ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}
            >
              {node.nodeType}
            </span>

            {node.code && (
              <span className="text-xs font-mono text-[#14B8A6] bg-[#14B8A6]/10 px-1.5 py-0.5 rounded border border-[#14B8A6]/20">
                {node.code}
              </span>
            )}

            <span className="text-xs font-semibold text-[#F8FAFC] truncate">{node.name}</span>

            {node.description && (
              <span className="text-[11px] text-[#64748B] truncate hidden md:inline">
                — {node.description}
              </span>
            )}

            {hasChildren && (
              <span className="text-[10px] font-mono text-[#64748B] bg-[#070C16] px-1.5 py-0.5 rounded border border-[#1E2E4E]">
                {node.children.length} {node.children.length === 1 ? 'child' : 'children'}
              </span>
            )}
          </div>

          {canManage && (
            <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => openCreateModal(node)}
                title="Add Child Spatial Node"
                className="p-1.5 rounded text-[#14B8A6] hover:bg-[#14B8A6]/10 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => openEditModal(node)}
                title="Edit Spatial Node"
                className="p-1.5 rounded text-[#CBD5E1] hover:bg-[#1E2E4E] transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => void handleArchiveNode(node)}
                title="Archive Spatial Node"
                className="p-1.5 rounded text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {node.children.map((child) =>
              renderTreeNode(child as SpatialNodeItem & { children: SpatialNodeItem[] }, depth + 1),
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
          spatialNodeCount={nodes.length}
        />

        {/* Toolbar & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#F8FAFC] flex items-center gap-2">
              <Network className="w-5 h-5 text-[#14B8A6]" />
              <span>Spatial Breakdown Structure (SBS)</span>
            </h2>
            <p className="text-xs text-[#94A3B8]">
              Hierarchical physical model of the project: Site &gt; Buildings &gt; Floors &gt; Zones &gt; Rooms.
            </p>
          </div>

          {canManage && (
            <button
              onClick={() => openCreateModal()}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#14B8A6] hover:bg-[#0D9488] text-[#070C16] text-xs font-semibold transition-colors shadow-sm shadow-[#14B8A6]/20 cursor-pointer self-start sm:self-auto"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Add Root Spatial Node</span>
            </button>
          )}
        </div>

        {/* Filter Bar */}
        <div className="rounded-xl bg-[#111C35] border border-[#1E2E4E] p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-80 relative">
            <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search spatial nodes by name or code..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#070C16] border border-[#1E2E4E] text-[#F8FAFC] text-xs focus:outline-none focus:border-[#14B8A6]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-[#94A3B8]">Node Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-[#070C16] border border-[#1E2E4E] text-[#F8FAFC] text-xs focus:outline-none focus:border-[#14B8A6]"
            >
              <option value="ALL">All Types</option>
              {Object.values(SpatialNodeType).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Spatial Hierarchy Tree View */}
        <div className="rounded-xl bg-[#111C35] border border-[#1E2E4E] p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E2E4E] pb-3 text-xs text-[#94A3B8]">
            <span>Spatial Node Hierarchy ({nodes.length} total active nodes)</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const all: Record<string, boolean> = {};
                  nodes.forEach((n) => (all[n.id] = true));
                  setExpandedNodes(all);
                }}
                className="text-[11px] text-[#14B8A6] hover:underline"
              >
                Expand All
              </button>
              <span>•</span>
              <button
                onClick={() => setExpandedNodes({})}
                className="text-[11px] text-[#64748B] hover:text-[#94A3B8]"
              >
                Collapse All
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3 text-xs text-[#94A3B8]">
              <Loader2 className="w-6 h-6 animate-spin text-[#14B8A6]" />
              <span>Loading spatial hierarchy...</span>
            </div>
          ) : rootNodes.length > 0 ? (
            <div className="space-y-2">
              {rootNodes.map((root) => renderTreeNode(root, 0))}
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-[#64748B] space-y-3">
              <Network className="w-8 h-8 mx-auto text-[#64748B]/50" />
              <div>
                <h3 className="font-semibold text-[#CBD5E1]">No Spatial Nodes Configured</h3>
                <p className="text-[11px] text-[#64748B] mt-1 max-w-sm mx-auto">
                  Create a root Site or Building node to begin mapping your physical project structure for smart selective takeoff and document tracking.
                </p>
              </div>
              {canManage && (
                <button
                  onClick={() => openCreateModal()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#14B8A6] text-[#070C16] text-xs font-semibold hover:bg-[#0D9488] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create First Node</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Create / Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-[#000000]/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl bg-[#111C35] border border-[#1E2E4E] shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#1E2E4E] pb-3">
                <h3 className="text-sm font-bold text-[#F8FAFC]">
                  {modalMode === 'create'
                    ? parentNodeForCreate
                      ? `Add Child Node to "${parentNodeForCreate.name}"`
                      : 'Add Root Spatial Node'
                    : `Edit Node "${targetNode?.name}"`}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-[#64748B] hover:text-[#F8FAFC] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#CBD5E1] mb-1">
                      Node Type *
                    </label>
                    <select
                      value={formNodeType}
                      onChange={(e) => setFormNodeType(e.target.value as SpatialNodeType)}
                      className="w-full px-3 py-2 rounded-lg bg-[#070C16] border border-[#1E2E4E] text-[#F8FAFC] text-xs focus:outline-none focus:border-[#14B8A6]"
                    >
                      {Object.values(SpatialNodeType).map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#CBD5E1] mb-1">
                      Node Code (Optional)
                    </label>
                    <input
                      type="text"
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                      placeholder="e.g. TWR-A, FL-01"
                      className="w-full px-3 py-2 rounded-lg bg-[#070C16] border border-[#1E2E4E] text-[#F8FAFC] text-xs font-mono focus:outline-none focus:border-[#14B8A6]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#CBD5E1] mb-1">
                    Node Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Residential Tower A, Level 01 Podium"
                    className="w-full px-3 py-2 rounded-lg bg-[#070C16] border border-[#1E2E4E] text-[#F8FAFC] text-xs focus:outline-none focus:border-[#14B8A6]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#CBD5E1] mb-1">
                    Parent Node
                  </label>
                  <select
                    value={formParentId || ''}
                    onChange={(e) => setFormParentId(e.target.value || null)}
                    className="w-full px-3 py-2 rounded-lg bg-[#070C16] border border-[#1E2E4E] text-[#F8FAFC] text-xs focus:outline-none focus:border-[#14B8A6]"
                  >
                    <option value="">(None - Root Node)</option>
                    {nodes
                      .filter((n) => modalMode !== 'edit' || n.id !== targetNode?.id)
                      .map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.name} ({n.nodeType})
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
                    placeholder="Details, boundaries, elevation notes..."
                    className="w-full px-3 py-2 rounded-lg bg-[#070C16] border border-[#1E2E4E] text-[#F8FAFC] text-xs focus:outline-none focus:border-[#14B8A6]"
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
                    disabled={isSubmitting || !formName.trim()}
                    className="px-4 py-2 rounded-lg bg-[#14B8A6] hover:bg-[#0D9488] text-[#070C16] text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{modalMode === 'create' ? 'Create Node' : 'Save Changes'}</span>
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
