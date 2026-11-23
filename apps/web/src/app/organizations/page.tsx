'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import {
  Building2,
  Plus,
  Users,
  Settings,
  FolderKanban,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useOrganization } from '@/context/organization-context';

export default function OrganizationsPage() {
  const router = useRouter();
  const {
    organizations,
    currentOrganization,
    selectOrganization,
    isLoading,
  } = useOrganization();

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#F8FAFC]">Organizations Directory</h1>
            <p className="text-xs text-[#94A3B8]">
              Switch workspaces, manage team members, and configure tenant settings.
            </p>
          </div>
          <Link
            href="/onboarding/organization"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#14B8A6] hover:bg-[#0D9488] text-[#070C16] text-xs font-semibold transition-colors shadow-sm shadow-[#14B8A6]/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Organization</span>
          </Link>
        </div>

        {/* Organizations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {organizations.map((org) => {
            const isCurrent = org.id === currentOrganization?.id;
            return (
              <div
                key={org.id}
                className={`p-5 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-[#111C35] border-[#14B8A6]/60 shadow-lg shadow-[#14B8A6]/5'
                    : 'bg-[#0E172B]/60 hover:bg-[#111C35]/80 border-[#1E2E4E]'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#070C16] border border-[#1E2E4E] flex items-center justify-center text-[#14B8A6]">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
                        <span>{org.name}</span>
                        {isCurrent && (
                          <span className="flex items-center gap-1 text-[10px] text-[#14B8A6] bg-[#14B8A6]/10 px-2 py-0.5 rounded-full border border-[#14B8A6]/30">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Active
                          </span>
                        )}
                      </h2>
                      <div className="text-[11px] font-mono text-[#64748B]">
                        {org.slug} • {org.country} • {org.defaultCurrency}
                      </div>
                    </div>
                  </div>

                  {org.currentUserRole && (
                    <span className="text-[10px] font-mono bg-[#1E2E4E] text-[#CBD5E1] px-2 py-0.5 rounded">
                      {org.currentUserRole.replace('ORGANIZATION_', '')}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 py-3 border-y border-[#1E2E4E]/60 text-xs text-[#94A3B8] my-3">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#14B8A6]" />
                    <span>{org.memberCount ?? 1} Members</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FolderKanban className="w-3.5 h-3.5 text-[#14B8A6]" />
                    <span>{org.projectCount ?? 0} Projects</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/organizations/${org.id}/members`}
                      className="px-2.5 py-1.5 rounded-md bg-[#070C16] hover:bg-[#1E2E4E] text-[#CBD5E1] transition-colors flex items-center gap-1"
                    >
                      <Users className="w-3 h-3" />
                      <span>Team</span>
                    </Link>
                    <Link
                      href={`/organizations/${org.id}/settings`}
                      className="px-2.5 py-1.5 rounded-md bg-[#070C16] hover:bg-[#1E2E4E] text-[#CBD5E1] transition-colors flex items-center gap-1"
                    >
                      <Settings className="w-3 h-3" />
                      <span>Settings</span>
                    </Link>
                  </div>

                  {!isCurrent ? (
                    <button
                      onClick={() => void selectOrganization(org.id)}
                      className="px-3 py-1.5 rounded-md bg-[#14B8A6]/10 hover:bg-[#14B8A6]/20 text-[#14B8A6] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>Switch</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => router.push('/projects')}
                      className="px-3 py-1.5 rounded-md bg-[#14B8A6] text-[#070C16] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>Enter Workspace</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {organizations.length === 0 && !isLoading && (
          <div className="p-12 rounded-xl bg-[#070C16] border border-[#16223B] text-center space-y-4">
            <Building2 className="w-10 h-10 text-[#64748B] mx-auto" />
            <h3 className="text-sm font-semibold text-[#F8FAFC]">No Organizations Found</h3>
            <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
              You are not yet a member of any organization. Create your first workspace to start collaborating.
            </p>
            <Link
              href="/onboarding/organization"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#14B8A6] text-[#070C16] text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Organization</span>
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
