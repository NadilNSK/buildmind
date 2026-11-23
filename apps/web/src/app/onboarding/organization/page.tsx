'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, ArrowRight, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { useOrganization } from '@/context/organization-context';
import { useAuth } from '@/context/auth-context';
import { CurrencyCode } from '@buildmind/shared-types';

export default function OnboardingOrganizationPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { createOrganization, isLoading } = useOrganization();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [country, setCountry] = useState('LK');
  const [defaultCurrency, setDefaultCurrency] = useState<CurrencyCode>(CurrencyCode.LKR);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    // Auto-generate slug from name if not manually modified
    const autoSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
    setSlug(autoSlug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Organization name is required');
      return;
    }

    if (!slug.trim()) {
      setError('Organization slug is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await createOrganization({
        name: name.trim(),
        slug: slug.trim(),
        country,
        defaultCurrency,
      });

      router.push('/projects');
    } catch (err: any) {
      setError(err?.message || 'Failed to create organization. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1220] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-[#0D9488] to-[#14B8A6] text-white shadow-lg shadow-[#14B8A6]/20 mb-2">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-[#F8FAFC]">Create Your Organization</h1>
          <p className="text-xs text-[#94A3B8]">
            Set up an isolated enterprise tenant for your QS firm, commercial team, or project consultancy.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-[#111C35] border border-[#1E2E4E] p-6 shadow-xl space-y-6">
          {error && (
            <div className="p-3.5 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 flex items-start gap-2.5 text-xs text-[#EF4444]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                Organization Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={handleNameChange}
                placeholder="e.g. Apex Commercial Surveyors"
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#070C16] border border-[#1E2E4E] text-[#F8FAFC] text-xs focus:outline-none focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                Workspace Slug / URL Identifier
              </label>
              <div className="flex items-center rounded-lg bg-[#070C16] border border-[#1E2E4E] px-3.5 py-2.5 text-xs text-[#64748B] focus-within:border-[#14B8A6] focus-within:ring-1 focus-within:ring-[#14B8A6]">
                <span className="font-mono text-[11px] mr-1">buildmind.ai/</span>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="apex-surveyors"
                  className="bg-transparent text-[#F8FAFC] text-xs font-mono focus:outline-none w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Country
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#070C16] border border-[#1E2E4E] text-[#F8FAFC] text-xs focus:outline-none focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6]"
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
                  value={defaultCurrency}
                  onChange={(e) => setDefaultCurrency(e.target.value as CurrencyCode)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#070C16] border border-[#1E2E4E] text-[#F8FAFC] text-xs focus:outline-none focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6]"
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

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="w-full py-2.5 px-4 rounded-lg bg-[#14B8A6] hover:bg-[#0D9488] text-[#070C16] font-semibold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-60 shadow-lg shadow-[#14B8A6]/20 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Provisioning Organization...</span>
                  </>
                ) : (
                  <>
                    <span>Create Organization & Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="border-t border-[#1E2E4E] pt-4 flex items-center justify-between text-xs text-[#94A3B8]">
            <div className="flex items-center gap-1.5 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#14B8A6]" />
              <span>Multi-Tenant RBAC Active</span>
            </div>
            <Link href="/organizations" className="text-[#14B8A6] hover:underline text-[11px]">
              View Existing Organizations
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
