'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthCard } from '../../components/auth/AuthCard';
import { PasswordStrengthIndicator } from '../../components/auth/PasswordStrengthIndicator';
import { apiClient, ApiError } from '../../lib/api-client';
import { Eye, EyeOff, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { passwordSchema } from '@buildmind/validation';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReset, setIsReset] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Password reset token is missing from URL');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const validationResult = passwordSchema.safeParse(newPassword);
    if (!validationResult.success) {
      setError(validationResult.error.issues[0]?.message || 'Password does not meet requirements');
      return;
    }

    try {
      setIsSubmitting(true);
      await apiClient('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: token.trim(),
          newPassword,
        }),
      });

      setIsReset(true);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Password reset failed';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isReset) {
    return (
      <AuthCard
        title="Password Reset Complete"
        subtitle="Your new credentials have been safely established"
      >
        <div className="text-center py-4 space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="text-sm text-[#CBD5E1] leading-relaxed">
            Your password has been securely updated. All active sessions have been invalidated for your protection.
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="w-full py-2.5 px-4 rounded-lg bg-[#14B8A6] hover:bg-[#0D9488] text-[#0B1220] font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#14B8A6]/20"
            >
              <span>Sign In with New Password</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Set New Password"
      subtitle="Establish a new secure password for your BuildMind account"
      error={error}
      footer={
        <Link href="/login" className="text-xs text-[#14B8A6] hover:underline focus:outline-none">
          Remember your password? Sign In
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Token input if not in URL */}
        {!searchParams.get('token') && (
          <div>
            <label htmlFor="token" className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
              Reset Token
            </label>
            <input
              id="token"
              type="text"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste security reset token"
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#0E172B] border border-[#1E2E4E] text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6] transition-colors font-mono"
            />
          </div>
        )}

        {/* New Password */}
        <div>
          <label htmlFor="newPassword" className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
            New Password
          </label>
          <div className="relative">
            <input
              id="newPassword"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 pr-10 rounded-lg bg-[#0E172B] border border-[#1E2E4E] text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6] transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#CBD5E1] focus:outline-none"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <PasswordStrengthIndicator password={newPassword} />
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••••••"
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#0E172B] border border-[#1E2E4E] text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6] transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-3 py-2.5 px-4 rounded-lg bg-[#14B8A6] hover:bg-[#0D9488] text-[#0B1220] font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#14B8A6]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:ring-offset-2 focus:ring-offset-[#0B1220]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Updating Password...</span>
            </>
          ) : (
            <span>Update Password</span>
          )}
        </button>
      </form>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthCard title="Set New Password" subtitle="Loading password reset interface...">
          <div className="flex items-center justify-center py-12 text-xs text-[#94A3B8]">
            <Loader2 className="w-6 h-6 animate-spin text-[#14B8A6]" />
          </div>
        </AuthCard>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
