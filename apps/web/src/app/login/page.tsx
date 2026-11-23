'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthCard } from '../../components/auth/AuthCard';
import { useAuth } from '../../context/auth-context';
import { Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { sanitizeReturnUrl } from '../../middleware';

const REMEMBERED_EMAIL_KEY = 'buildmind_remembered_email';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Restore remembered email preference if set
  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBERED_EMAIL_KEY);
      if (saved) {
        setEmail(saved);
        setRememberEmail(true);
      }
    } catch {
      // Storage access may be restricted
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError(null);

    if (!email || !email.includes('@')) {
      setValidationError('Please enter a valid email address');
      return;
    }
    if (!password) {
      setValidationError('Password is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await login({ email: email.trim().toLowerCase(), password });

      // Handle remembered email
      try {
        if (rememberEmail) {
          localStorage.setItem(REMEMBERED_EMAIL_KEY, email.trim().toLowerCase());
        } else {
          localStorage.removeItem(REMEMBERED_EMAIL_KEY);
        }
      } catch {
        // Ignore local storage errors
      }

      // Safe returnUrl redirection
      const returnUrl = searchParams.get('returnUrl');
      const destination = sanitizeReturnUrl(returnUrl);
      router.push(destination);
    } catch {
      // Error handled by AuthContext state
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Commercial Workspace Sign In"
      subtitle="Access your Quantity Surveying project accounts and measurement sheets"
      error={validationError || error}
      footer={
        <p>
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="text-[#14B8A6] font-medium hover:underline focus:outline-none focus:ring-1 focus:ring-[#14B8A6] rounded"
          >
            Create an organization account
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
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
            placeholder="surveyor@commercial.lk"
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#0E172B] border border-[#1E2E4E] text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6] transition-colors"
          />
        </div>

        {/* Password Field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block text-xs font-medium text-[#CBD5E1]">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-[#14B8A6] hover:underline focus:outline-none focus:ring-1 focus:ring-[#14B8A6] rounded"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
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
        </div>

        {/* Remember Email Option */}
        <div className="flex items-center">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-[#94A3B8]">
            <input
              type="checkbox"
              checked={rememberEmail}
              onChange={(e) => setRememberEmail(e.target.checked)}
              className="w-4 h-4 rounded border-[#1E2E4E] bg-[#0E172B] text-[#14B8A6] focus:ring-[#14B8A6] accent-[#14B8A6]"
            />
            <span>Remember my email on this device</span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-2 py-2.5 px-4 rounded-lg bg-[#14B8A6] hover:bg-[#0D9488] text-[#0B1220] font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#14B8A6]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:ring-offset-2 focus:ring-offset-[#0B1220]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <span>Sign In to BuildMind</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthCard title="Commercial Workspace Sign In" subtitle="Loading sign in interface...">
          <div className="flex items-center justify-center py-12 text-xs text-[#94A3B8]">
            <Loader2 className="w-6 h-6 animate-spin text-[#14B8A6]" />
          </div>
        </AuthCard>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
