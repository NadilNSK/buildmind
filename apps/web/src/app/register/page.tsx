'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthCard } from '../../components/auth/AuthCard';
import { PasswordStrengthIndicator } from '../../components/auth/PasswordStrengthIndicator';
import { useAuth } from '../../context/auth-context';
import { Eye, EyeOff, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { registerSchema } from '@buildmind/validation';

export default function RegisterPage() {
  const router = useRouter();
  const { register, error, clearError } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError(null);

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    // Client-side validation against shared Zod schema
    const validationResult = registerSchema.safeParse({
      fullName,
      email,
      password,
    });

    if (!validationResult.success) {
      const firstIssue = validationResult.error.issues[0]?.message || 'Invalid form input';
      setValidationError(firstIssue);
      return;
    }

    try {
      setIsSubmitting(true);
      await register({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      setIsRegistered(true);
    } catch {
      // Error handled by AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isRegistered) {
    return (
      <AuthCard
        title="Account Registered Successfully"
        subtitle="Verification email dispatched to your inbox"
      >
        <div className="text-center py-4 space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="text-sm text-[#CBD5E1] leading-relaxed">
            Welcome to BuildMind AI. A verification link has been sent to{' '}
            <strong className="text-[#14B8A6]">{email}</strong>.
          </p>
          <div className="p-3.5 rounded-lg bg-[#0E172B] border border-[#1E2E4E] text-xs text-[#94A3B8]">
            In development mode, verification messages are held in the secure local delivery queue.
            You can verify immediately or proceed to the workspace.
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-2.5 px-4 rounded-lg bg-[#14B8A6] hover:bg-[#0D9488] text-[#0B1220] font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#14B8A6]/20"
            >
              <span>Continue to Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              href="/resend-verification"
              className="text-xs text-[#94A3B8] hover:text-[#14B8A6] py-1 transition-colors"
            >
              Need to resend verification email?
            </Link>
          </div>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Create Commercial Account"
      subtitle="Register an enterprise surveyor account for construction management"
      error={validationError || error}
      footer={
        <p>
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-[#14B8A6] font-medium hover:underline focus:outline-none focus:ring-1 focus:ring-[#14B8A6] rounded"
          >
            Sign in to existing account
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label htmlFor="fullName" className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
            Full Name & Title
          </label>
          <input
            id="fullName"
            type="text"
            autoComplete="name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Kavinda Perera, Senior QS"
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#0E172B] border border-[#1E2E4E] text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6] transition-colors"
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
            Work Email Address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="k.perera@commercial.lk"
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#0E172B] border border-[#1E2E4E] text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6] transition-colors"
          />
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
            Create Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
          <PasswordStrengthIndicator password={password} />
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
            Confirm Password
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

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-3 py-2.5 px-4 rounded-lg bg-[#14B8A6] hover:bg-[#0D9488] text-[#0B1220] font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#14B8A6]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:ring-offset-2 focus:ring-offset-[#0B1220]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Creating Account...</span>
            </>
          ) : (
            <>
              <span>Create Account</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </AuthCard>
  );
}
