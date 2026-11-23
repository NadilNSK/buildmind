'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import {
  Mail,
  Send,
  UserPlus,
  RotateCw,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Users,
  Copy,
  Clock,
  Loader2,
} from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api-client';
import { useOrganization } from '@/context/organization-context';
import { OrganizationRole, InvitationStatus } from '@buildmind/shared-types';

interface InvitationItem {
  id: string;
  organizationId: string;
  email: string;
  role: OrganizationRole;
  status: InvitationStatus;
  invitedById: string;
  invitedBy?: {
    id: string;
    email: string;
    fullName: string;
  };
  expiresAt: string;
  acceptedAt?: string | null;
  createdAt: string;
}

const AVAILABLE_ROLES: OrganizationRole[] = [
  OrganizationRole.ORGANIZATION_ADMIN,
  OrganizationRole.COMMERCIAL_DIRECTOR,
  OrganizationRole.SENIOR_QS,
  OrganizationRole.QS_ENGINEER,
  OrganizationRole.ESTIMATOR,
  OrganizationRole.PROJECT_MANAGER,
  OrganizationRole.AUDITOR,
  OrganizationRole.VIEWER,
];

export default function OrganizationInvitationsPage() {
  const params = useParams();
  const organizationId = params.organizationId as string;
  const { hasPermission } = useOrganization();

  const [invitations, setInvitations] = useState<InvitationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [lastGeneratedLink, setLastGeneratedLink] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<OrganizationRole>(OrganizationRole.QS_ENGINEER);

  const canManage = hasPermission('organization.manage_members');

  const loadInvitations = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient<InvitationItem[]>(`/organizations/${organizationId}/invitations`);
      setInvitations(data);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load invitations';
      setMessage({ type: 'error', text: msg });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      void loadInvitations();
    }
  }, [organizationId]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setIsSending(true);
      setMessage(null);
      setLastGeneratedLink(null);

      const result = await apiClient<any>(`/organizations/${organizationId}/invitations`, {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), role }),
      });

      setMessage({ type: 'success', text: `Invitation dispatched to ${email}` });
      if (result.token) {
        const url = `${window.location.origin}/invitations/accept?token=${result.token}`;
        setLastGeneratedLink(url);
      }
      setEmail('');
      await loadInvitations();
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to send invitation';
      setMessage({ type: 'error', text: msg });
    } finally {
      setIsSending(false);
    }
  };

  const handleResend = async (invitationId: string) => {
    try {
      setActionLoading(invitationId);
      setMessage(null);

      const result = await apiClient<any>(
        `/organizations/${organizationId}/invitations/${invitationId}/resend`,
        { method: 'POST' },
      );

      setMessage({ type: 'success', text: 'Invitation resent successfully' });
      if (result.token) {
        const url = `${window.location.origin}/invitations/accept?token=${result.token}`;
        setLastGeneratedLink(url);
      }
      await loadInvitations();
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to resend invitation';
      setMessage({ type: 'error', text: msg });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevoke = async (invitationId: string) => {
    try {
      setActionLoading(invitationId);
      setMessage(null);

      await apiClient(`/organizations/${organizationId}/invitations/${invitationId}`, {
        method: 'DELETE',
      });

      setMessage({ type: 'success', text: 'Invitation revoked' });
      await loadInvitations();
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to revoke invitation';
      setMessage({ type: 'error', text: msg });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
          <Link
            href={`/organizations/${organizationId}/members`}
            className="hover:text-[#14B8A6] flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Team Members</span>
          </Link>
          <span>/</span>
          <span className="text-[#F8FAFC]">Invitations</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#F8FAFC]">Organization Invitations</h1>
            <p className="text-xs text-[#94A3B8]">
              Invite Quantity Surveyors, Commercial Directors, and team members to join this organization.
            </p>
          </div>
          <Link
            href={`/organizations/${organizationId}/members`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111C35] hover:bg-[#1E2E4E] text-[#CBD5E1] text-xs font-medium border border-[#1E2E4E] transition-colors"
          >
            <Users className="w-3.5 h-3.5" />
            <span>View Active Members</span>
          </Link>
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

        {/* Copy Invite Link Helper for local development & testing */}
        {lastGeneratedLink && (
          <div className="p-3.5 rounded-xl bg-[#14B8A6]/10 border border-[#14B8A6]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5 truncate">
              <span className="font-semibold text-[#14B8A6]">Direct Invitation Acceptance URL:</span>
              <div className="font-mono text-[11px] text-[#CBD5E1] truncate">{lastGeneratedLink}</div>
            </div>
            <button
              onClick={() => {
                void navigator.clipboard.writeText(lastGeneratedLink);
                alert('Copied invitation link to clipboard!');
              }}
              className="px-3 py-1.5 rounded bg-[#14B8A6] text-[#070C16] font-semibold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Link</span>
            </button>
          </div>
        )}

        {/* Invite Form */}
        {canManage && (
          <div className="rounded-xl bg-[#111C35] border border-[#1E2E4E] p-6 space-y-4">
            <h2 className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[#14B8A6]" />
              <span>Invite New Team Member</span>
            </h2>

            <form onSubmit={handleSendInvite} className="flex flex-col sm:flex-row items-end gap-3">
              <div className="w-full sm:flex-1">
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#64748B] absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="qs.surveyor@enterprise.lk"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-lg bg-[#070C16] border border-[#1E2E4E] text-[#F8FAFC] text-xs focus:outline-none focus:border-[#14B8A6]"
                  />
                </div>
              </div>

              <div className="w-full sm:w-60">
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Role Assignment
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as OrganizationRole)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#070C16] border border-[#1E2E4E] text-[#F8FAFC] text-xs focus:outline-none focus:border-[#14B8A6]"
                >
                  {AVAILABLE_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r.replace('ORGANIZATION_', '')}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={isSending}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-[#14B8A6] hover:bg-[#0D9488] text-[#070C16] font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60 cursor-pointer shadow-sm shadow-[#14B8A6]/20"
              >
                {isSending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Send Invitation</span>
              </button>
            </form>
          </div>
        )}

        {/* Invitations Table */}
        <div className="rounded-xl bg-[#111C35] border border-[#1E2E4E] overflow-hidden shadow-xl">
          <div className="p-4 border-b border-[#1E2E4E]">
            <h2 className="text-xs font-semibold text-[#F8FAFC]">
              Invitation History ({invitations.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#070C16] text-[#94A3B8] border-b border-[#1E2E4E] text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Expires</th>
                  <th className="px-4 py-3 font-semibold">Invited By</th>
                  {canManage && <th className="px-4 py-3 font-semibold text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2E4E]">
                {invitations.map((inv) => {
                  const isActionActive = actionLoading === inv.id;
                  const isPending = inv.status === InvitationStatus.PENDING;

                  return (
                    <tr key={inv.id} className="hover:bg-[#0E172B]/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-[#F8FAFC]">{inv.email}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-[#CBD5E1]">
                        {inv.role.replace('ORGANIZATION_', '')}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            inv.status === InvitationStatus.PENDING
                              ? 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30'
                              : inv.status === InvitationStatus.ACCEPTED
                              ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30'
                              : 'bg-[#64748B]/15 text-[#94A3B8] border border-[#64748B]/30'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#94A3B8] text-[11px]">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#64748B]" />
                          <span>{new Date(inv.expiresAt).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#94A3B8] text-[11px]">
                        {inv.invitedBy?.fullName || 'Admin'}
                      </td>
                      {canManage && (
                        <td className="px-4 py-3 text-right">
                          {isPending && (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => void handleResend(inv.id)}
                                disabled={isActionActive}
                                title="Resend invitation email"
                                className="p-1.5 rounded hover:bg-[#1E2E4E] text-[#14B8A6] transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                <RotateCw className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => void handleRevoke(inv.id)}
                                disabled={isActionActive}
                                title="Revoke invitation"
                                className="p-1.5 rounded hover:bg-[#1E2E4E] text-[#EF4444] transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
                {invitations.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-xs text-[#64748B]">
                      No invitations have been issued yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
