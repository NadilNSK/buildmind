'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import {
  Users,
  UserPlus,
  ShieldCheck,
  MoreVertical,
  CheckCircle2,
  AlertTriangle,
  Mail,
  ArrowLeft,
  Trash2,
  Ban,
  Check,
  Loader2,
} from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api-client';
import { useOrganization } from '@/context/organization-context';
import { OrganizationRole, MembershipStatus } from '@buildmind/shared-types';

interface MemberItem {
  id: string;
  userId: string;
  role: OrganizationRole;
  status: MembershipStatus;
  createdAt: string;
  user: {
    id: string;
    email: string;
    fullName: string;
  };
}

const AVAILABLE_ROLES: OrganizationRole[] = [
  OrganizationRole.ORGANIZATION_OWNER,
  OrganizationRole.ORGANIZATION_ADMIN,
  OrganizationRole.COMMERCIAL_DIRECTOR,
  OrganizationRole.SENIOR_QS,
  OrganizationRole.QS_ENGINEER,
  OrganizationRole.ESTIMATOR,
  OrganizationRole.PROJECT_MANAGER,
  OrganizationRole.AUDITOR,
  OrganizationRole.VIEWER,
];

export default function OrganizationMembersPage() {
  const params = useParams();
  const organizationId = params.organizationId as string;
  const { hasPermission } = useOrganization();

  const [members, setMembers] = useState<MemberItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const canManageMembers = hasPermission('organization.manage_members');

  const loadMembers = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient<MemberItem[]>(`/organizations/${organizationId}/members`);
      setMembers(data);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load team members';
      setMessage({ type: 'error', text: msg });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      void loadMembers();
    }
  }, [organizationId]);

  const handleRoleChange = async (membershipId: string, newRole: OrganizationRole) => {
    try {
      setActionLoading(membershipId);
      setMessage(null);

      await apiClient(`/organizations/${organizationId}/members/${membershipId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      });

      setMessage({ type: 'success', text: 'Member role updated successfully' });
      await loadMembers();
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to update member role';
      setMessage({ type: 'error', text: msg });
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusToggle = async (membershipId: string, currentStatus: MembershipStatus) => {
    const newStatus =
      currentStatus === MembershipStatus.ACTIVE
        ? MembershipStatus.SUSPENDED
        : MembershipStatus.ACTIVE;

    try {
      setActionLoading(membershipId);
      setMessage(null);

      await apiClient(`/organizations/${organizationId}/members/${membershipId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });

      setMessage({
        type: 'success',
        text: `Member status updated to ${newStatus}`,
      });
      await loadMembers();
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to update member status';
      setMessage({ type: 'error', text: msg });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveMember = async (membershipId: string, memberName: string) => {
    const confirmRemove = window.confirm(
      `Are you sure you want to remove ${memberName} from this organization? All assigned project access will be revoked.`,
    );
    if (!confirmRemove) return;

    try {
      setActionLoading(membershipId);
      setMessage(null);

      await apiClient(`/organizations/${organizationId}/members/${membershipId}`, {
        method: 'DELETE',
      });

      setMessage({ type: 'success', text: `${memberName} has been removed from the organization` });
      await loadMembers();
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to remove member';
      setMessage({ type: 'error', text: msg });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
          <Link href="/organizations" className="hover:text-[#14B8A6] flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Organizations</span>
          </Link>
          <span>/</span>
          <span className="text-[#F8FAFC]">Team Management</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#F8FAFC]">Team Members & RBAC</h1>
            <p className="text-xs text-[#94A3B8]">
              Manage organization roles, member access, and invitations across commercial operations.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/organizations/${organizationId}/invitations`}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#14B8A6] hover:bg-[#0D9488] text-[#070C16] text-xs font-semibold transition-colors shadow-sm shadow-[#14B8A6]/20"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Invite New Member</span>
            </Link>
          </div>
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

        {/* Members Table */}
        <div className="rounded-xl bg-[#111C35] border border-[#1E2E4E] overflow-hidden shadow-xl">
          <div className="p-4 border-b border-[#1E2E4E] flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#F8FAFC]">
              <Users className="w-4 h-4 text-[#14B8A6]" />
              <span>Active Members ({members.length})</span>
            </div>
            <Link
              href={`/organizations/${organizationId}/invitations`}
              className="text-xs text-[#14B8A6] hover:underline flex items-center gap-1"
            >
              <Mail className="w-3 h-3" />
              <span>View Pending Invitations</span>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#070C16] text-[#94A3B8] border-b border-[#1E2E4E] text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Joined</th>
                  {canManageMembers && <th className="px-4 py-3 font-semibold text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2E4E]">
                {members.map((m) => {
                  const isOwner = m.role === OrganizationRole.ORGANIZATION_OWNER;
                  const isActionActive = actionLoading === m.id;

                  return (
                    <tr key={m.id} className="hover:bg-[#0E172B]/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-[#F8FAFC]">{m.user.fullName}</div>
                        <div className="text-[11px] text-[#64748B]">{m.user.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        {canManageMembers ? (
                          <select
                            disabled={isActionActive}
                            value={m.role}
                            onChange={(e) =>
                              void handleRoleChange(m.id, e.target.value as OrganizationRole)
                            }
                            className="px-2.5 py-1 rounded bg-[#070C16] border border-[#1E2E4E] text-[#F8FAFC] text-[11px] font-mono focus:outline-none focus:border-[#14B8A6] disabled:opacity-50"
                          >
                            {AVAILABLE_ROLES.map((r) => (
                              <option key={r} value={r}>
                                {r.replace('ORGANIZATION_', '')}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded bg-[#1E2E4E] text-[#CBD5E1] text-[11px] font-mono">
                            {m.role.replace('ORGANIZATION_', '')}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            m.status === MembershipStatus.ACTIVE
                              ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30'
                              : 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              m.status === MembershipStatus.ACTIVE ? 'bg-[#10B981]' : 'bg-[#EF4444]'
                            }`}
                          />
                          {m.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#94A3B8] text-[11px]">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </td>
                      {canManageMembers && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Suspend / Activate toggle */}
                            <button
                              onClick={() => void handleStatusToggle(m.id, m.status)}
                              disabled={isActionActive}
                              title={
                                m.status === MembershipStatus.ACTIVE ? 'Suspend member' : 'Reactivate member'
                              }
                              className={`p-1.5 rounded hover:bg-[#1E2E4E] transition-colors disabled:opacity-50 cursor-pointer ${
                                m.status === MembershipStatus.ACTIVE
                                  ? 'text-[#F59E0B]'
                                  : 'text-[#10B981]'
                              }`}
                            >
                              {m.status === MembershipStatus.ACTIVE ? (
                                <Ban className="w-3.5 h-3.5" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {/* Remove member */}
                            <button
                              onClick={() => void handleRemoveMember(m.id, m.user.fullName)}
                              disabled={isActionActive}
                              title="Remove from organization"
                              className="p-1.5 rounded text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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
