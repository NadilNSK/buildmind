'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { useAuth } from '@/context/auth-context';
import { apiClient, ApiError } from '@/lib/api-client';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';
import { passwordSchema } from '@buildmind/validation';
import {
  Lock,
  LogOut,
  Shield,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Monitor,
  Smartphone,
} from 'lucide-react';

export default function SecuritySettingsPage() {
  const { user, logout, logoutAll, isLoading } = useAuth();

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);

  // Session state
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);
  const [sessionSuccess, setSessionSuccess] = useState<string | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (newPassword !== confirmPassword) {
      setPassError('New passwords do not match');
      return;
    }

    const validationResult = passwordSchema.safeParse(newPassword);
    if (!validationResult.success) {
      setPassError(validationResult.error.issues[0]?.message || 'Password does not meet requirements');
      return;
    }

    try {
      setIsChangingPass(true);
      await apiClient('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      setPassSuccess('Password changed successfully. Other active sessions have been invalidated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to change password';
      setPassError(msg);
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleLogoutAll = async () => {
    if (confirm('Are you sure you want to sign out of all devices and active browsers?')) {
      try {
        setIsLoggingOutAll(true);
        await logoutAll();
      } catch (err) {
        console.error('Logout all error:', err);
      } finally {
        setIsLoggingOutAll(false);
      }
    }
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-[#1E2E4E] pb-4">
          <div>
            <h1 className="text-2xl font-bold text-[#F8FAFC]">Security & Sessions</h1>
            <p className="text-xs text-[#94A3B8]">Manage your authentication credentials and session states</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/settings/profile"
              className="px-3 py-1.5 rounded-lg bg-[#111C35] hover:bg-[#182745] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#1E2E4E] text-xs font-medium transition-colors"
            >
              Profile
            </Link>
            <span className="px-3 py-1.5 rounded-lg bg-[#14B8A6] text-[#0B1220] text-xs font-semibold">
              Security & Sessions
            </span>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="p-6 rounded-xl bg-[#111C35] border border-[#1E2E4E] space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-[#1E2E4E]">
            <div className="w-8 h-8 rounded-lg bg-[#14B8A6]/10 border border-[#14B8A6]/20 flex items-center justify-center text-[#14B8A6]">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#F8FAFC]">Change Password</h2>
              <p className="text-xs text-[#94A3B8]">Update your account credentials using Argon2id protection</p>
            </div>
          </div>

          {passError && (
            <div className="p-3.5 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 text-xs text-[#FCA5A5] flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
              <span>{passError}</span>
            </div>
          )}

          {passSuccess && (
            <div className="p-3.5 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30 text-xs text-[#6EE7B7] flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
              <span>{passSuccess}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2 rounded-lg bg-[#0E172B] border border-[#1E2E4E] text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2 rounded-lg bg-[#0E172B] border border-[#1E2E4E] text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6] transition-colors"
              />
              <PasswordStrengthIndicator password={newPassword} />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2 rounded-lg bg-[#0E172B] border border-[#1E2E4E] text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isChangingPass}
              className="py-2.5 px-4 rounded-lg bg-[#14B8A6] hover:bg-[#0D9488] text-[#0B1220] font-semibold text-xs flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isChangingPass ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </form>
        </div>

        {/* Active Sessions & Logout Card */}
        <div className="p-6 rounded-xl bg-[#111C35] border border-[#1E2E4E] space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-[#1E2E4E]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/20 flex items-center justify-center text-[#3B82F6]">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#F8FAFC]">Active Sessions & Devices</h2>
                <p className="text-xs text-[#94A3B8]">Review and terminate browser sessions across all devices</p>
              </div>
            </div>
            <div className="px-2.5 py-1 rounded bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/25 text-xs font-medium">
              Current Device Active
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[#0E172B] border border-[#1E2E4E] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Monitor className="w-5 h-5 text-[#14B8A6]" />
              <div>
                <div className="text-xs font-semibold text-[#F8FAFC]">This Browser Session</div>
                <div className="text-[11px] text-[#64748B]">Authenticated via Secure HttpOnly Cookie</div>
              </div>
            </div>
            <button
              onClick={() => void logout()}
              className="px-3 py-1.5 rounded-lg bg-[#1E2F4C] hover:bg-[#2C436B] text-[#CBD5E1] text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out Current Device</span>
            </button>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <div className="text-xs text-[#94A3B8]">
              Need to terminate access everywhere? Revoking all sessions forces re-authentication on every device.
            </div>
            <button
              onClick={handleLogoutAll}
              disabled={isLoggingOutAll}
              className="px-4 py-2 rounded-lg bg-[#EF4444]/15 hover:bg-[#EF4444]/25 text-[#F87171] border border-[#EF4444]/30 text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isLoggingOutAll ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Revoking Sessions...</span>
                </>
              ) : (
                <>
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out All Devices</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
