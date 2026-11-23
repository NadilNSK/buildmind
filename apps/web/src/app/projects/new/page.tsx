'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import {
  FolderKanban,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Compass,
} from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api-client';
import { useOrganization } from '@/context/organization-context';
import {
  MeasurementStandard,
  ContractStandard,
  ProjectStatus,
  CurrencyCode,
} from '@buildmind/shared-types';

export default function NewProjectPage() {
  const router = useRouter();
  const { currentOrganization } = useOrganization();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [country, setCountry] = useState(currentOrganization?.country || 'LK');
  const [measurementStandard, setMeasurementStandard] = useState<MeasurementStandard>(
    MeasurementStandard.SLS_573,
  );
  const [contractStandard, setContractStandard] = useState<ContractStandard>(
    ContractStandard.CIDA_SBD_01,
  );
  const [currency, setCurrency] = useState<CurrencyCode>(
    currentOrganization?.defaultCurrency || CurrencyCode.LKR,
  );
  const [status, setStatus] = useState<ProjectStatus>(ProjectStatus.PLANNING);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      setError('Project code and name are required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const created = await apiClient<any>('/projects', {
        method: 'POST',
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          name: name.trim(),
          description: description.trim() || undefined,
          country,
          measurementStandard,
          contractStandard,
          currency,
          status,
        }),
      });

      router.push(`/projects/${created.id}`);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to create project';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
          <Link href="/projects" className="hover:text-[#14B8A6] flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Projects</span>
          </Link>
          <span>/</span>
          <span className="text-[#F8FAFC]">New Project</span>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-[#F8FAFC]">Create Commercial Project</h1>
          <p className="text-xs text-[#94A3B8]">
            Configure project standards, contract conditions, and commercial parameters.
          </p>
        </div>

        <div className="rounded-xl bg-[#111C35] border border-[#1E2E4E] p-6 shadow-xl space-y-6">
          {error && (
            <div className="p-3.5 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 flex items-center gap-2.5 text-xs text-[#EF4444]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Project Code *
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="PRJ-CMB-001"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#070C16] border border-[#1E2E4E] text-[#F8FAFC] text-xs font-mono focus:outline-none focus:border-[#14B8A6]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Colombo Financial Tower Phase 1"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#070C16] border border-[#1E2E4E] text-[#F8FAFC] text-xs focus:outline-none focus:border-[#14B8A6]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                Description (Optional)
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Scope of works, employer specifications, location details..."
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#070C16] border border-[#1E2E4E] text-[#F8FAFC] text-xs focus:outline-none focus:border-[#14B8A6]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Measurement Standard (ES-01)
                </label>
                <select
                  value={measurementStandard}
                  onChange={(e) => setMeasurementStandard(e.target.value as MeasurementStandard)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#070C16] border border-[#1E2E4E] text-[#F8FAFC] text-xs focus:outline-none focus:border-[#14B8A6]"
                >
                  <option value={MeasurementStandard.SLS_573}>
                    SLS 573:1999 (Sri Lanka Standard Building Works)
                  </option>
                  <option value={MeasurementStandard.CESMM4}>
                    CESMM4 (Civil Engineering Standard Method)
                  </option>
                  <option value={MeasurementStandard.NRM2}>
                    RICS NRM2 (Detailed Measurement)
                  </option>
                  <option value={MeasurementStandard.SMM7}>
                    SMM7 (Standard Method 7)
                  </option>
                  <option value={MeasurementStandard.POMI}>
                    POMI (Principles of Measurement Int.)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Contract Standard (ES-03)
                </label>
                <select
                  value={contractStandard}
                  onChange={(e) => setContractStandard(e.target.value as ContractStandard)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#070C16] border border-[#1E2E4E] text-[#F8FAFC] text-xs focus:outline-none focus:border-[#14B8A6]"
                >
                  <option value={ContractStandard.CIDA_SBD_01}>
                    CIDA SBD 01 (Major Works &gt; LKR 100M - Sri Lanka)
                  </option>
                  <option value={ContractStandard.CIDA_SBD_02}>
                    CIDA SBD 02 (Minor Works &lt; LKR 100M - Sri Lanka)
                  </option>
                  <option value={ContractStandard.CIDA_SBD_03}>
                    CIDA SBD 03 (Design &amp; Build - Sri Lanka)
                  </option>
                  <option value={ContractStandard.FIDIC_RED}>
                    FIDIC Red Book (Conditions of Contract)
                  </option>
                  <option value={ContractStandard.FIDIC_YELLOW}>
                    FIDIC Yellow Book (Plant &amp; Design-Build)
                  </option>
                  <option value={ContractStandard.JCT}>
                    JCT Standard Building Contract
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#070C16] border border-[#1E2E4E] text-[#F8FAFC] text-xs focus:outline-none focus:border-[#14B8A6]"
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

              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Project Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#070C16] border border-[#1E2E4E] text-[#F8FAFC] text-xs focus:outline-none focus:border-[#14B8A6]"
                >
                  <option value={ProjectStatus.PLANNING}>Planning</option>
                  <option value={ProjectStatus.TENDERING}>Tendering</option>
                  <option value={ProjectStatus.ACTIVE}>Active</option>
                  <option value={ProjectStatus.COMMERCIAL_CLOSEOUT}>Commercial Closeout</option>
                  <option value={ProjectStatus.FINAL_ACCOUNT}>Final Account</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-[#1E2E4E]">
              <Link
                href="/projects"
                className="px-4 py-2.5 rounded-lg bg-[#070C16] hover:bg-[#111C35] text-[#CBD5E1] text-xs font-medium border border-[#1E2E4E] transition-colors"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-lg bg-[#14B8A6] hover:bg-[#0D9488] text-[#070C16] font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-60 cursor-pointer shadow-lg shadow-[#14B8A6]/20"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Provisioning Project...</span>
                  </>
                ) : (
                  <>
                    <span>Create Project</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
