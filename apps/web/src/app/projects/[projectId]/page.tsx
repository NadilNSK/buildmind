'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import {
  FolderKanban,
  Users,
  UserPlus,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Ruler,
  Calculator,
  FileSpreadsheet,
  Coins,
  ShieldCheck,
  Trash2,
  Loader2,
  Tag,
} from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api-client';
import { useOrganization } from '@/context/organization-context';
import {
  ProjectSummary,
  ProjectStatus,
  MeasurementStandard,
  ContractStandard,
} from '@buildmind/shared-types';

interface ProjectMemberItem {
  id: string;
  projectId: string;
  userId: string;
  role?: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    fullName: string;
  };
}

interface OrgMemberOption {
  id: string;
  userId: string;
  role: string;
  user: {
    id: string;
    email: string;
    fullName: string;
  };
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { currentOrganization, hasPermission } = useOrganization();

  const [project, setProject] = useState<any | null>(null);
  const [members, setMembers] = useState<ProjectMemberItem[]>([]);
  const [orgMembers, setOrgMembers] = useState<OrgMemberOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [memberRole, setMemberRole] = useState('MEMBER');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const canManageAccess = hasPermission('projects.manage_access');

  const loadProjectData = async () => {
    try {
      setIsLoading(true);
      const [projData, membersData] = await Promise.all([
        apiClient<any>(`/projects/${projectId}`),
        apiClient<ProjectMemberItem[]>(`/projects/${projectId}/members`),
      ]);

      setProject(projData);
      setMembers(membersData);

      // Also load organization members if user can manage access
      if (currentOrganization?.id) {
        const allOrgMembers = await apiClient<OrgMemberOption[]>(
          `/organizations/${currentOrganization.id}/members`,
        );
        setOrgMembers(allOrgMembers);
        const unassigned = allOrgMembers.filter(
          (om) => !membersData.some((pm) => pm.userId === om.userId),
        );
        if (unassigned.length > 0) {
          setSelectedUserId(unassigned[0].userId);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load project details';
      setMessage({ type: 'error', text: msg });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      void loadProjectData();
    }
  }, [projectId, currentOrganization?.id]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    try {
      setIsAddingMember(true);
      setMessage(null);

      await apiClient(`/projects/${projectId}/members`, {
        method: 'POST',
        body: JSON.stringify({ userId: selectedUserId, role: memberRole }),
      });

      setMessage({ type: 'success', text: 'Member assigned to project successfully' });
      await loadProjectData();
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to add member to project';
      setMessage({ type: 'error', text: msg });
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async (targetUserId: string, memberName: string) => {
    const confirmRemove = window.confirm(
      `Remove ${memberName} from this project? They will no longer have access to this project's takeoff, estimates, or contracts.`,
    );
    if (!confirmRemove) return;

    try {
      setActionLoading(targetUserId);
      setMessage(null);

      await apiClient(`/projects/${projectId}/members/${targetUserId}`, {
        method: 'DELETE',
      });

      setMessage({ type: 'success', text: `${memberName} removed from project` });
      await loadProjectData();
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to remove member from project';
      setMessage({ type: 'error', text: msg });
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading && !project) {
    return (
      <AppShell>
        <div className="py-16 flex flex-col items-center justify-center space-y-3 text-xs text-[#94A3B8]">
          <Loader2 className="w-6 h-6 animate-spin text-[#14B8A6]" />
          <span>Loading project workspace...</span>
        </div>
      </AppShell>
    );
  }

  const unassignedOrgMembers = orgMembers.filter(
    (om) => !members.some((pm) => pm.userId === om.userId),
  );

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
          <Link href="/projects" className="hover:text-[#14B8A6] flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Projects</span>
          </Link>
          <span>/</span>
          <span className="text-[#F8FAFC] font-mono">{project?.code}</span>
        </div>

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
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Project Header Banner */}
        <div className="p-6 rounded-2xl bg-[#111C35] border border-[#1E2E4E] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-mono bg-[#14B8A6]/15 text-[#14B8A6] px-2.5 py-1 rounded border border-[#14B8A6]/30 font-bold">
                {project?.code}
              </span>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-[#070C16] text-[#CBD5E1] border border-[#1E2E4E]">
                {project?.status}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[#F8FAFC]">{project?.name}</h1>
            {project?.description && (
              <p className="text-xs text-[#94A3B8] max-w-2xl leading-relaxed">
                {project.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap md:flex-col items-start md:items-end gap-2 text-xs text-[#94A3B8]">
            <div className="flex items-center gap-1.5 bg-[#070C16] px-3 py-1.5 rounded-lg border border-[#1E2E4E]">
              <span className="text-[#64748B]">Method:</span>
              <strong className="text-[#14B8A6] font-mono">{project?.measurementStandard}</strong>
            </div>
            {project?.contractStandard && (
              <div className="flex items-center gap-1.5 bg-[#070C16] px-3 py-1.5 rounded-lg border border-[#1E2E4E]">
                <span className="text-[#64748B]">Contract:</span>
                <strong className="text-[#F8FAFC] font-mono">{project.contractStandard}</strong>
              </div>
            )}
            <div className="text-[11px] text-[#64748B]">
              Currency: <strong className="text-[#CBD5E1]">{project?.currency}</strong>
            </div>
          </div>
        </div>

        {/* QS Fast Navigation Shortcuts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/takeoff"
            className="p-4 rounded-xl bg-[#0E172B]/70 hover:bg-[#111C35] border border-[#1E2E4E] hover:border-[#14B8A6]/50 transition-all text-xs flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-[#14B8A6] mb-2">
              <Ruler className="w-4 h-4" />
              <span className="font-mono text-[10px] text-[#64748B]">QS-01</span>
            </div>
            <span className="font-semibold text-[#F8FAFC]">Quantity Takeoff</span>
          </Link>

          <Link
            href="/estimation"
            className="p-4 rounded-xl bg-[#0E172B]/70 hover:bg-[#111C35] border border-[#1E2E4E] hover:border-[#14B8A6]/50 transition-all text-xs flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-[#14B8A6] mb-2">
              <Calculator className="w-4 h-4" />
              <span className="font-mono text-[10px] text-[#64748B]">QS-02</span>
            </div>
            <span className="font-semibold text-[#F8FAFC]">Cost Estimation</span>
          </Link>

          <Link
            href="/boq"
            className="p-4 rounded-xl bg-[#0E172B]/70 hover:bg-[#111C35] border border-[#1E2E4E] hover:border-[#14B8A6]/50 transition-all text-xs flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-[#14B8A6] mb-2">
              <FileSpreadsheet className="w-4 h-4" />
              <span className="font-mono text-[10px] text-[#64748B]">QS-03</span>
            </div>
            <span className="font-semibold text-[#F8FAFC]">BOQ Generation</span>
          </Link>

          <Link
            href="/budgets"
            className="p-4 rounded-xl bg-[#0E172B]/70 hover:bg-[#111C35] border border-[#1E2E4E] hover:border-[#14B8A6]/50 transition-all text-xs flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-[#14B8A6] mb-2">
              <Coins className="w-4 h-4" />
              <span className="font-mono text-[10px] text-[#64748B]">QS-04</span>
            </div>
            <span className="font-semibold text-[#F8FAFC]">Budget Planning</span>
          </Link>
        </div>

        {/* Project Member Grants */}
        <div className="rounded-xl bg-[#111C35] border border-[#1E2E4E] overflow-hidden shadow-xl space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E2E4E] pb-4">
            <div>
              <h2 className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#14B8A6]" />
                <span>Assigned Project Members ({members.length})</span>
              </h2>
              <p className="text-xs text-[#94A3B8]">
                Grant specific organization members access to this project workspace.
              </p>
            </div>
          </div>

          {canManageAccess && unassignedOrgMembers.length > 0 && (
            <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row items-end gap-3 pb-2">
              <div className="w-full sm:flex-1">
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Select Organization Member
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#070C16] border border-[#1E2E4E] text-[#F8FAFC] text-xs focus:outline-none focus:border-[#14B8A6]"
                >
                  {unassignedOrgMembers.map((om) => (
                    <option key={om.userId} value={om.userId}>
                      {om.user.fullName} ({om.user.email}) — {om.role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full sm:w-48">
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Project Role
                </label>
                <input
                  type="text"
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value)}
                  placeholder="e.g. LEAD_QS, ESTIMATOR"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#070C16] border border-[#1E2E4E] text-[#F8FAFC] text-xs font-mono focus:outline-none focus:border-[#14B8A6]"
                />
              </div>

              <button
                type="submit"
                disabled={isAddingMember || !selectedUserId}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-[#14B8A6] hover:bg-[#0D9488] text-[#070C16] font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60 cursor-pointer"
              >
                {isAddingMember ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <UserPlus className="w-3.5 h-3.5" />
                )}
                <span>Grant Project Access</span>
              </button>
            </form>
          )}

          {/* Members Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#070C16] text-[#94A3B8] border-b border-[#1E2E4E] text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Project Role</th>
                  <th className="px-4 py-3 font-semibold">Assigned On</th>
                  {canManageAccess && <th className="px-4 py-3 font-semibold text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2E4E]">
                {members.map((m) => {
                  const isAction = actionLoading === m.userId;
                  return (
                    <tr key={m.id} className="hover:bg-[#0E172B]/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-[#F8FAFC]">{m.user.fullName}</div>
                        <div className="text-[11px] text-[#64748B]">{m.user.email}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-[#14B8A6]">
                        {m.role || 'MEMBER'}
                      </td>
                      <td className="px-4 py-3 text-[#94A3B8] text-[11px]">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </td>
                      {canManageAccess && (
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => void handleRemoveMember(m.userId, m.user.fullName)}
                            disabled={isAction}
                            title="Revoke project access"
                            className="p-1.5 rounded text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
