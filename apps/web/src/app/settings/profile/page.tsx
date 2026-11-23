'use client';

import React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { useAuth } from '@/context/auth-context';
import {
  User,
  Mail,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Building2,
  Lock,
} from 'lucide-react';

export default function ProfileSettingsPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
          <div className="h-8 bg-[#111C35] rounded-lg w-1/3" />
          <div className="h-64 bg-[#111C35] rounded-xl" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-[#1E2E4E] pb-4">
          <div>
            <h1 className="text-2xl font-bold text-[#F8FAFC]">Account & Profile</h1>
            <p className="text-xs text-[#94A3B8]">Manage your professional quantity surveyor identity</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-[#14B8A6] text-[#0B1220] text-xs font-semibold">
              Profile
            </span>
            <Link
              href="/settings/security"
              className="px-3 py-1.5 rounded-lg bg-[#111C35] hover:bg-[#182745] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#1E2E4E] text-xs font-medium transition-colors"
            >
              Security & Sessions
            </Link>
          </div>
        </div>

        {/* Profile Card */}
        <div className="p-6 rounded-xl bg-[#111C35] border border-[#1E2E4E] space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-[#1E2E4E]">
            <div className="w-16 h-16 rounded-full bg-[#1E2F4C] border-2 border-[#14B8A6] flex items-center justify-center text-xl font-bold text-[#14B8A6]">
              {user?.fullName?.charAt(0) || 'QS'}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#F8FAFC]">{user?.fullName || 'Surveyor'}</h2>
              <p className="text-xs text-[#94A3B8] font-mono">{user?.role || 'QS_ENGINEER'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="p-4 rounded-lg bg-[#0E172B] border border-[#1E2E4E]">
              <div className="flex items-center gap-2 text-xs text-[#64748B] mb-1">
                <User className="w-3.5 h-3.5 text-[#14B8A6]" />
                <span>Full Name</span>
              </div>
              <div className="text-sm font-medium text-[#F8FAFC]">{user?.fullName}</div>
            </div>

            {/* Email Address & Verification Badge */}
            <div className="p-4 rounded-lg bg-[#0E172B] border border-[#1E2E4E]">
              <div className="flex items-center justify-between text-xs text-[#64748B] mb-1">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#14B8A6]" />
                  <span>Work Email</span>
                </div>
                {user?.isEmailVerified ? (
                  <span className="flex items-center gap-1 text-[11px] text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/20">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Verified</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] text-[#F59E0B] bg-[#F59E0B]/10 px-2 py-0.5 rounded border border-[#F59E0B]/20">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Unverified</span>
                  </span>
                )}
              </div>
              <div className="text-sm font-medium text-[#F8FAFC]">{user?.email}</div>
              {!user?.isEmailVerified && (
                <div className="mt-2 text-xs">
                  <Link href="/resend-verification" className="text-[#14B8A6] hover:underline">
                    Resend verification link
                  </Link>
                </div>
              )}
            </div>

            {/* Account Role */}
            <div className="p-4 rounded-lg bg-[#0E172B] border border-[#1E2E4E]">
              <div className="flex items-center gap-2 text-xs text-[#64748B] mb-1">
                <Shield className="w-3.5 h-3.5 text-[#14B8A6]" />
                <span>System Role</span>
              </div>
              <div className="text-sm font-medium text-[#F8FAFC]">{user?.role}</div>
            </div>

            {/* Account Created */}
            <div className="p-4 rounded-lg bg-[#0E172B] border border-[#1E2E4E]">
              <div className="flex items-center gap-2 text-xs text-[#64748B] mb-1">
                <Calendar className="w-3.5 h-3.5 text-[#14B8A6]" />
                <span>Account Created</span>
              </div>
              <div className="text-sm font-medium text-[#F8FAFC]">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active'}
              </div>
            </div>
          </div>
        </div>

        {/* Commercial Notice */}
        <div className="p-4 rounded-xl bg-[#111C35] border border-[#1E2E4E] flex items-start gap-3">
          <Building2 className="w-4 h-4 text-[#14B8A6] shrink-0 mt-0.5" />
          <div className="text-xs text-[#94A3B8] leading-relaxed">
            Multi-tenant organization membership and professional commercial roles (Commercial Director, Senior QS, Estimator, Auditor) are managed in Phase 2C.
          </div>
        </div>
      </div>
    </AppShell>
  );
}
