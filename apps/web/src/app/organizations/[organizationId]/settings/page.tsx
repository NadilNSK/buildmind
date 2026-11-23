'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import {
  Building2,
  Users,
  Save,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  UserCheck,
  ShieldCheck,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api-client';
import { useOrganization } from '@/context/organization-context';
import {
  OrganizationSummary,
  OrganizationRole,
  CurrencyCode,
} from '@buildmind/shared-types';

interface MemberOption {
  id: string;
  userId: string;
  role: OrganizationRole;
  status: string;
  user: {
    id: string;
    email: string;
    fullName: string;
  };
}

export default function OrganizationSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const organizationId = params.organizationId as string;
  const { hasPermission, refreshOrganizations } = useOrganization();

  const [org, setOrg] = useState<OrganizationSummary | null>(null);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedNewOwner, setSelectedNewOwner] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [country, setCountry] = useState('LK');
  const [currency, setCurrency] = useState<CurrencyCode>(CurrencyCode.LKR);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [orgData, membersData] = await Promise.all([
          apiClient<OrganizationSummary>(`/organizations/${organizationId}`),
          apiClient<MemberOption[]>(`/organizations/${organizationId}/members`),
        ]);

        setOrg(orgData);
        setName(orgData.name);
        setSlug(orgData.slug);
        setCountry(orgData.country);
        setCurrency(orgData.defaultCurrency);
        setMembers(membersData);

        const otherMembers = membersData.filter(
          (m) => m.role !== OrganizationRole.ORGANIZATION_OWNER && m.status === 'ACTIVE',
        );
        if (otherMembers.length > 0) {
          setSelectedNewOwner(otherMembers[0].userId);
        }
      } catch (err: unknown) {
        const msg = err instanceof ApiError ? err.message : 'Failed to load organization settings';
        setMessage({ type: 'error', text: msg });
      } finally {
        setIsLoading(false);
      }
    }

    if (organizationId) {
      void loadData();
    }
  }, [organizationId]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setMessage(null);

      const updated = await apiClient<OrganizationSummary>(`/organizations/${organizationId}`, {
        method: 'PATCH',
        body: JSON.stringify({ name, slug, country, defaultCurrency: currency }),
      });

      setOrg(updated);
      await refreshOrganizations();
      setMessage({ type: 'success', text: 'Organization settings updated successfully' });
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to update organization';
      setMessage({ type: 'error', text: msg });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTransferOwnership = async () => {
    if (!selectedNewOwner) return;
    const confirmTransfer = window.confirm(
      'Are you sure you want to transfer ownership? You will be demoted to Organization Admin.',
    );
    if (!confirmTransfer) return;

    try {
      setIsTransferring(true);
      setMessage(null);

      await apiClient(`/organizations/${organizationId}/transfer-ownership`, {
        method: 'POST',
        body: JSON.stringify({ newOwnerUserId: selectedNewOwner }),
      });

      await refreshOrganizations();
      setMessage({
        type: 'success',
        text: 'Ownership transferred successfully. Your role is now Organization Admin.',
      });
      // Reload members to reflect role change
      const membersData = await apiClient<MemberOption[]>(`/organizations/${organizationId}/members`);
      setMembers(membersData);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Ownership transfer failed';
      setMessage({ type: 'error', text: msg });
    } finally {
      setIsTransferring(false);
    }
  };

  const handleDeleteOrganization = async () => {
    const confirmDelete = window.confirm(
      `DANGER: Are you sure you want to permanently delete "${org?.name}"? All projects, members, and data will be permanently deleted. This cannot be undone.`,
    );
    if (!confirmDelete) return;

    try {
      setIsDeleting(true);
      await apiClient(`/organizations/${organizationId}`, { method: 'DELETE' });
      await refreshOrganizations();
      router.push('/organizations');
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to delete organization';
      setMessage({ type: 'error', text: msg });
      setIsDeleting(false);
    }
  };

  const canUpdate = hasPermission('organization.update');
  const canTransfer = hasPermission('organization.transfer_ownership');
  const canDelete = hasPermission('organization.delete');

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
          <Link href="/organizations" className="hover:text-[#14B8A6] flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Organizations</span>
          </Link>
          <span>/</span>
          <span className="text-[#F8FAFC]">{org?.name || 'Settings'}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#F8FAFC]">Organization Settings</h1>
            <p className="text-xs text-[#94A3B8]">
              Manage organization parameters, ownership, and tenant-level configurations.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/organizations/${organizationId}/members`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111C35] hover:bg-[#1E2E4E] text-[#CBD5E1] text-xs font-medium border border-[#1E2E4E] transition-colors"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Team & Members</span>
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

        {/* General Details */}
        <div className="rounded-xl bg-[#111C35] border border-[#1E2E4E] p-6 space-y-4">
          <h2 className="text-sm font-semibold text-[#F8FAFC]">General Information</h2>

          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Organization Name
                </label>
                <input
                  type="text"
                  required
                  disabled={!canUpdate}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#070C16] border border-[#1E2E4E] text-[#F8FAFC] text-xs focus:outline-none focus:border-[#14B8A6] disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  URL Slug
                </label>
                <input
                  type="text"
                  required
                  disabled={!canUpdate}
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase())}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#070C16] border border-[#1E2E4E] text-[#F8FAFC] text-xs font-mono focus:outline-none focus:border-[#14B8A6] disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Country
                </label>
                <select
                  disabled={!canUpdate}
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#070C16] border border-[#1E2E4E] text-[#F8FAFC] text-xs focus:outline-none focus:border-[#14B8A6] disabled:opacity-60"
                >
                  <option value="LK">Sri Lanka (LK)</option>
                  <option value="AE">United Arab Emirates (AE)</option>
                  <option value="GB">United Kingdom (GB)</option>
                  <option value="SG">Singapore (SG)</option>
                  <option value="AU">Australia (AU)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Default Currency
                </label>
                <select
                  disabled={!canUpdate}
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#070C16] border border-[#1E2E4E] text-[#F8FAFC] text-xs focus:outline-none focus:border-[#14B8A6] disabled:opacity-60"
                >
                  <option value={CurrencyCode.LKR}>LKR (Sri Lankan Rupee)</option>
                  <option value={CurrencyCode.USD}>USD (US Dollar)</option>
                  <option value={CurrencyCode.AED}>AED (UAE Dirham)</option>
                  <option value={CurrencyCode.GBP}>GBP (British Pound)</option>
                  <option value={CurrencyCode.EUR}>EUR (Euro)</option>
                  <option value={CurrencyCode.SGD}>SGD (Singapore Dollar)</option>
                  <option value={CurrencyCode.AUD}>AUD (Australian Dollar)</option>
                </select>
              </div>
            </div>

            {canUpdate && (
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg bg-[#14B8A6] hover:bg-[#0D9488] text-[#070C16] font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-60"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Settings</span>
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Ownership Transfer (Owner Only) */}
        {canTransfer && (
          <div className="rounded-xl bg-[#111C35] border border-[#1E2E4E] p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-[#14B8A6]" />
                  <span>Transfer Organization Ownership</span>
                </h2>
                <p className="text-xs text-[#94A3B8] mt-1">
                  Designate another active organization member as the Organization Owner. You will transition to Organization Admin.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <select
                value={selectedNewOwner}
                onChange={(e) => setSelectedNewOwner(e.target.value)}
                className="w-full sm:w-80 px-3.5 py-2.5 rounded-lg bg-[#070C16] border border-[#1E2E4E] text-[#F8FAFC] text-xs focus:outline-none focus:border-[#14B8A6]"
              >
                {members
                  .filter((m) => m.role !== OrganizationRole.ORGANIZATION_OWNER && m.status === 'ACTIVE')
                  .map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.user.fullName} ({m.user.email}) — {m.role}
                    </option>
                  ))}
              </select>

              <button
                type="button"
                onClick={handleTransferOwnership}
                disabled={isTransferring || !selectedNewOwner}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-[#F59E0B]/10 hover:bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isTransferring ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <UserCheck className="w-3.5 h-3.5" />
                )}
                <span>Transfer Ownership</span>
              </button>
            </div>
          </div>
        )}

        {/* Danger Zone (Delete) */}
        {canDelete && (
          <div className="rounded-xl bg-[#EF4444]/5 border border-[#EF4444]/20 p-6 space-y-4">
            <h2 className="text-sm font-semibold text-[#EF4444] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Danger Zone</span>
            </h2>
            <p className="text-xs text-[#94A3B8]">
              Permanently delete this organization, including all commercial projects, drawings, BOQs, and audit logs. This action is irreversible.
            </p>
            <button
              type="button"
              onClick={handleDeleteOrganization}
              disabled={isDeleting}
              className="px-4 py-2 rounded-lg bg-[#EF4444] hover:bg-[#DC2626] text-white font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-60 cursor-pointer"
            >
              {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              <span>Delete Organization Permanently</span>
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
