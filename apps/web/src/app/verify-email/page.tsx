'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AuthCard } from '../../components/auth/AuthCard';
import { apiClient, ApiError } from '../../lib/api-client';
import { Loader2, CheckCircle2, AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const performVerification = useCallback(async (tokenToVerify: string) => {
    try {
      setStatus('verifying');
      setErrorMessage(null);

      await apiClient('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token: tokenToVerify.trim() }),
      });

      setStatus('success');
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Verification failed or token expired';
      setErrorMessage(msg);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
      void performVerification(tokenParam);
    }
  }, [searchParams, performVerification]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token) {
      void performVerification(token);
    }
  };

  return (
    <AuthCard
      title="Verify Account Email"
      subtitle="Confirming your work email address for BuildMind access"
    >
      {status === 'verifying' && (
        <div className="text-center py-8 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#14B8A6] mx-auto" />
          <p className="text-sm text-[#CBD5E1]">Validating security verification token...</p>
        </div>
      )}

      {status === 'success' && (
        <div className="text-center py-4 space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-semibold text-[#F8FAFC]">Email Verified Successfully</h2>
          <p className="text-sm text-[#94A3B8]">
            Your email address has been confirmed. You now have full access to project workspaces and commercial reporting.
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="w-full py-2.5 px-4 rounded-lg bg-[#14B8A6] hover:bg-[#0D9488] text-[#0B1220] font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#14B8A6]/20"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="text-center py-4 space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-semibold text-[#F8FAFC]">Verification Token Expired or Invalid</h2>
          <p className="text-sm text-[#FCA5A5]">{errorMessage}</p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/resend-verification"
              className="w-full py-2.5 px-4 rounded-lg bg-[#14B8A6] hover:bg-[#0D9488] text-[#0B1220] font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#14B8A6]/20"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Request New Verification Email</span>
            </Link>
            <Link
              href="/login"
              className="text-xs text-[#94A3B8] hover:text-[#14B8A6] py-1 transition-colors"
            >
              Return to Sign In
            </Link>
          </div>
        </div>
      )}

      {status === 'idle' && (
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div>
            <label htmlFor="token" className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
              Paste Verification Token
            </label>
            <input
              id="token"
              type="text"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste security token from email"
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#0E172B] border border-[#1E2E4E] text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6] transition-colors font-mono"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-lg bg-[#14B8A6] hover:bg-[#0D9488] text-[#0B1220] font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#14B8A6]/20 transition-all focus:outline-none"
          >
            <span>Verify Token</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}
    </AuthCard>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <AuthCard title="Verify Account Email" subtitle="Loading verification interface...">
          <div className="flex items-center justify-center py-12 text-xs text-[#94A3B8]">
            <Loader2 className="w-6 h-6 animate-spin text-[#14B8A6]" />
          </div>
        </AuthCard>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
