'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AuthCard } from '../../components/auth/AuthCard';
import { apiClient, ApiError } from '../../lib/api-client';
import { Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function ResendVerificationPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !email.includes('@')) {
      setError('Please provide a valid work email address');
      return;
    }

    try {
      setIsSubmitting(true);
      await apiClient('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      setIsSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Unable to resend verification link';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <AuthCard
        title="Verification Link Sent"
        subtitle="If an unverified account exists, instructions have been dispatched"
      >
        <div className="text-center py-4 space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="text-sm text-[#CBD5E1] leading-relaxed">
            A fresh verification link has been dispatched to <strong className="text-[#14B8A6]">{email}</strong>.
          </p>
          <div className="p-3.5 rounded-lg bg-[#0E172B] border border-[#1E2E4E] text-xs text-[#94A3B8]">
            In development mode, verification messages are held in the local development queue.
          </div>
          <div className="pt-2">
            <Link
              href="/login"
              className="w-full py-2.5 px-4 rounded-lg bg-[#14B8A6] hover:bg-[#0D9488] text-[#0B1220] font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#14B8A6]/20"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Resend Verification Email"
      subtitle="Request a fresh verification link for your unverified account"
      error={error}
      footer={
        <Link
          href="/login"
          className="text-xs text-[#14B8A6] hover:underline flex items-center justify-center gap-1.5 focus:outline-none"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
            Registered Email Address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="surveyor@commercial.lk"
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#0E172B] border border-[#1E2E4E] text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6] transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-2 py-2.5 px-4 rounded-lg bg-[#14B8A6] hover:bg-[#0D9488] text-[#0B1220] font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#14B8A6]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:ring-offset-2 focus:ring-offset-[#0B1220]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Dispatching Link...</span>
            </>
          ) : (
            <span>Send Verification Link</span>
          )}
        </button>
      </form>
    </AuthCard>
  );
}
