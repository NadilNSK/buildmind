'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { ProjectHeader } from '@/components/project/ProjectHeader';
import { ProjectNav } from '@/components/project/ProjectNav';
import {
  Settings,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Building2,
  Calendar,
  Coins,
  ShieldAlert,
  Trash2,
  Archive,
} from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api-client';
import { useOrganization } from '@/context/organization-context';
import {
  ProjectType,
  ProjectStatus,
  MeasurementStandard,
  UnitSystem,
  ContractStandard,
  CurrencyCode,
} from '@buildmind/shared-types';

const ALLOWED_STATUS_MAP: Record<ProjectStatus, ProjectStatus[]> = {
  [ProjectStatus.PLANNING]: [
    ProjectStatus.PLANNING,
    ProjectStatus.DESIGN,
    ProjectStatus.TENDERING,
    ProjectStatus.CANCELLED,
  ],
  [ProjectStatus.DESIGN]: [
    ProjectStatus.DESIGN,
    ProjectStatus.TENDERING,
    ProjectStatus.PRE_CONSTRUCTION,
    ProjectStatus.CANCELLED,
  ],
  [ProjectStatus.TENDERING]: [
    ProjectStatus.TENDERING,
    ProjectStatus.PRE_CONSTRUCTION,
    ProjectStatus.CANCELLED,
  ],
  [ProjectStatus.PRE_CONSTRUCTION]: [
    ProjectStatus.PRE_CONSTRUCTION,
    ProjectStatus.UNDER_CONSTRUCTION,
    ProjectStatus.ACTIVE,
    ProjectStatus.CANCELLED,
  ],
  [ProjectStatus.UNDER_CONSTRUCTION]: [
    ProjectStatus.UNDER_CONSTRUCTION,
    ProjectStatus.ON_HOLD,
    ProjectStatus.COMMERCIAL_CLOSEOUT,
    ProjectStatus.FINAL_ACCOUNT,
    ProjectStatus.CANCELLED,
  ],
  [ProjectStatus.ACTIVE]: [
    ProjectStatus.ACTIVE,
    ProjectStatus.ON_HOLD,
    ProjectStatus.COMMERCIAL_CLOSEOUT,
    ProjectStatus.FINAL_ACCOUNT,
    ProjectStatus.CANCELLED,
  ],
  [ProjectStatus.ON_HOLD]: [
    ProjectStatus.ON_HOLD,
    ProjectStatus.UNDER_CONSTRUCTION,
    ProjectStatus.ACTIVE,
    ProjectStatus.CANCELLED,
  ],
  [ProjectStatus.COMMERCIAL_CLOSEOUT]: [
    ProjectStatus.COMMERCIAL_CLOSEOUT,
    ProjectStatus.FINAL_ACCOUNT,
    ProjectStatus.CANCELLED,
  ],
  [ProjectStatus.FINAL_ACCOUNT]: [
    ProjectStatus.FINAL_ACCOUNT,
    ProjectStatus.COMPLETED,
    ProjectStatus.CANCELLED,
  ],
  [ProjectStatus.COMPLETED]: [
    ProjectStatus.COMPLETED,
    ProjectStatus.ARCHIVED,
  ],
  [ProjectStatus.CANCELLED]: [
    ProjectStatus.CANCELLED,
    ProjectStatus.ARCHIVED,
  ],
  [ProjectStatus.ARCHIVED]: [
    ProjectStatus.ARCHIVED,
    ProjectStatus.PLANNING,
  ],
};

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { currentOrganization, hasPermission } = useOrganization();

  const [project, setProject] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [projectType, setProjectType] = useState<ProjectType>(ProjectType.COMMERCIAL);
  const [location, setLocation] = useState('');
  const [country, setCountry] = useState('LK');
  const [clientName, setClientName] = useState('');
  const [contractorName, setContractorName] = useState('');
  const [consultantName, setConsultantName] = useState('');
  const [projectManager, setProjectManager] = useState('');
  const [startDate, setStartDate] = useState('');
  const [expectedCompletionDate, setExpectedCompletionDate] = useState('');
  const [actualCompletionDate, setActualCompletionDate] = useState('');
  const [estimatedContractValue, setEstimatedContractValue] = useState<string>('');
  const [currency, setCurrency] = useState<CurrencyCode>(CurrencyCode.LKR);
  const [measurementStandard, setMeasurementStandard] = useState<MeasurementStandard>(MeasurementStandard.SLS_573);
  const [measurementUnitSystem, setMeasurementUnitSystem] = useState<UnitSystem>(UnitSystem.METRIC);
  const [contractStandard, setContractStandard] = useState<ContractStandard | ''>('');
  const [status, setStatus] = useState<ProjectStatus>(ProjectStatus.PLANNING);

  const canEditSettings = hasPermission('projects.settings.edit');
  const canDeleteProject = hasPermission('projects.delete');

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient<any>(`/projects/${projectId}/settings`);
      setProject(data);
      setName(data.name || '');
      setDescription(data.description || '');
      setProjectType(data.projectType || ProjectType.COMMERCIAL);
      setLocation(data.location || '');
      setCountry(data.country || 'LK');
      setClientName(data.clientName || '');
      setContractorName(data.contractorName || '');
      setConsultantName(data.consultantName || '');
      setProjectManager(data.projectManager || '');
      setStartDate(data.startDate ? data.startDate.split('T')[0] : '');
      setExpectedCompletionDate(data.expectedCompletionDate ? data.expectedCompletionDate.split('T')[0] : '');
      setActualCompletionDate(data.actualCompletionDate ? data.actualCompletionDate.split('T')[0] : '');
      setEstimatedContractValue(data.estimatedContractValue || '');
      setCurrency(data.currency || CurrencyCode.LKR);
      setMeasurementStandard(data.measurementStandard || MeasurementStandard.SLS_573);
      setMeasurementUnitSystem(data.measurementUnitSystem || UnitSystem.METRIC);
      setContractStandard(data.contractStandard || '');
      setStatus(data.status || ProjectStatus.PLANNING);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load project settings';
      setMessage({ type: 'error', text: msg });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      void loadSettings();
    }
  }, [projectId, currentOrganization?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setMessage({ type: 'error', text: 'Project name is required' });
      return;
    }

    try {
      setIsSaving(true);
      setMessage(null);

      const updated = await apiClient<any>(`/projects/${projectId}/settings`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          projectType,
          location: location.trim() || undefined,
          country: country.trim() || undefined,
          clientName: clientName.trim() || undefined,
          contractorName: contractorName.trim() || undefined,
          consultantName: consultantName.trim() || undefined,
          projectManager: projectManager.trim() || undefined,
          startDate: startDate ? new Date(startDate).toISOString() : null,
          expectedCompletionDate: expectedCompletionDate ? new Date(expectedCompletionDate).toISOString() : null,
          actualCompletionDate: actualCompletionDate ? new Date(actualCompletionDate).toISOString() : null,
          estimatedContractValue: estimatedContractValue !== '' ? estimatedContractValue : null,
          currency,
          measurementStandard,
          measurementUnitSystem,
          contractStandard: contractStandard || undefined,
          status,
        }),
      });

      setProject(updated);
      setMessage({ type: 'success', text: 'Project settings and metadata updated successfully' });
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to update project settings';
      setMessage({ type: 'error', text: msg });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    const confirmation = window.prompt(
      `Type the project code "${project?.code}" to permanently delete this project:`,
    );
    if (confirmation !== project?.code) {
      if (confirmation !== null) {
        alert('Project code did not match. Deletion cancelled.');
      }
      return;
    }

    try {
      await apiClient(`/projects/${projectId}`, {
        method: 'DELETE',
      });
      router.push('/projects');
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to delete project';
      setMessage({ type: 'error', text: msg });
    }
  };

  if (isLoading && !project) {
    return (
      <AppShell>
        <div className="py-20 flex flex-col items-center justify-center space-y-3 text-xs text-[#94A3B8]">
          <Loader2 className="w-6 h-6 animate-spin text-[#14B8A6]" />
          <span>Loading project settings...</span>
        </div>
      </AppShell>
    );
  }

  const allowedStatuses = project ? ALLOWED_STATUS_MAP[project.status as ProjectStatus] || [project.status] : [];

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto">
        {project && <ProjectHeader project={project} />}

        {message && (
          <div
            className={`p-3.5 rounded-lg border flex items-center gap-2.5 text-xs ${
              message.type === 'success'
                ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]'
                : 'bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444]'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <ProjectNav projectId={projectId} />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: General & Identity */}
          <div className="rounded-xl bg-[#111C35] border border-[#1E2E4E] p-6 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-[#F8FAFC] border-b border-[#1E2E4E] pb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#14B8A6]" />
              <span>Project Identity & Classification</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Project Code (Immutable)
                </label>
                <input
                  type="text"
                  disabled
                  value={project?.code || ''}
                  className="w-full px-3 py-2 rounded-lg bg-[#070C16]/60 border border-[#1E2E4E] text-[#94A3B8] font-mono text-xs cursor-not-allowed"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  disabled={!canEditSettings}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#070C16] border border-[#1E2E4E] text-[#F8FAFC] text-xs focus:outline-none focus:border-[#14B8A6] disabled:opacity-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Project Type
                </label>
                <select
                  disabled={!canEditSettings}
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value as ProjectType)}
                  className="w-full px-3 py-2 rounded-lg bg-[#070C16] border border-[#1E2E4E] text-[#F8FAFC] text-xs focus:outline-none focus:border-[#14B8A6] disabled:opacity-50"
                >
                  {Object.values(ProjectType).map((pt) => (
                    <option key={pt} value={pt}>
                      {pt.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Location (City / Site)
                </label>
                <input
                  type="text"
                  disabled={!canEditSettings}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Colombo 03, Kollupitiya"
                  className="w-full px-3 py-2 rounded-lg bg-[#070C16] border border-[#1E2E4E] text-[#F8FAFC] text-xs focus:outline-none focus:border-[#14B8A6] disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Country Code
                </label>
                <input
                  type="text"
                  maxLength={2}
                  disabled={!canEditSettings}
                  value={country}
                  onChange={(e) => setCountry(e.target.value.toUpperCase())}
                  placeholder="LK"
                  className="w-full px-3 py-2 rounded-lg bg-[#070C16] border border-[#1E2E4E] text-[#F8FAFC] text-xs font-mono uppercase focus:outline-none focus:border-[#14B8A6] disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                Description
              </label>
              <textarea
                rows={3}
                disabled={!canEditSettings}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Scope of works, employer specifications, contractual parameters..."
                className="w-full px-3 py-2 rounded-lg bg-[#070C16] border border-[#1E2E4E] text-[#F8FAFC] text-xs focus:outline-none focus:border-[#14B8A6] disabled:opacity-50"
              />
            </div>
          </div>

          {/* Section 2: Stakeholders */}
          <div className="rounded-xl bg-[#111C35] border border-[#1E2E4E] p-6 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-[#F8FAFC] border-b border-[#1E2E4E] pb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#3B82F6]" />
              <span>Commercial Stakeholders & Governance</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Client / Employer
                </label>
                <input
                  type="text"
                  disabled={!canEditSettings}
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Urban Development Authority"
                  className="w-full px-3 py-2 rounded-lg bg-[#070C16] border border-[#1E2E4E] text-[#F8FAFC] text-xs focus:outline-none focus:border-[#3B82F6] disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Main Contractor
                </label>
                <input
                  type="text"
                  disabled={!canEditSettings}
                  value={contractorName}
                  onChange={(e) => setContractorName(e.target.value)}
                  placeholder="e.g. Maga Engineering (Pvt) Ltd"
                  className="w-full px-3 py-2 rounded-lg bg-[#070C16] border border-[#1E2E4E] text-[#F8FAFC] text-xs focus:outline-none focus:border-[#3B82F6] disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Consultant / Architect
                </label>
                <input
                  type="text"
                  disabled={!canEditSettings}
                  value={consultantName}
                  onChange={(e) => setConsultantName(e.target.value)}
                  placeholder="e.g. Central Engineering Consultancy Bureau"
                  className="w-full px-3 py-2 rounded-lg bg-[#070C16] border border-[#1E2E4E] text-[#F8FAFC] text-xs focus:outline-none focus:border-[#3B82F6] disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Project Manager / Lead QS
                </label>
                <input
                  type="text"
                  disabled={!canEditSettings}
                  value={projectManager}
                  onChange={(e) => setProjectManager(e.target.value)}
                  placeholder="e.g. K. Silva (FRICS / Ch.QS)"
                  className="w-full px-3 py-2 rounded-lg bg-[#070C16] border border-[#1E2E4E] text-[#F8FAFC] text-xs focus:outline-none focus:border-[#3B82F6] disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Commercial & Measurement Standards */}
          <div className="rounded-xl bg-[#111C35] border border-[#1E2E4E] p-6 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-[#F8FAFC] border-b border-[#1E2E4E] pb-3 flex items-center gap-2">
              <Coins className="w-4 h-4 text-[#F59E0B]" />
              <span>Commercial Standards, Valuations & Rules</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Estimated Contract Value
                </label>
                <input
                  type="number"
                  step="0.01"
                  disabled={!canEditSettings}
                  value={estimatedContractValue}
                  onChange={(e) => setEstimatedContractValue(e.target.value)}
                  placeholder="450000000.00"
                  className="w-full px-3 py-2 rounded-lg bg-[#070C16] border border-[#1E2E4E] text-[#F8FAFC] font-mono text-xs focus:outline-none focus:border-[#F59E0B] disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Currency
                </label>
                <select
                  disabled={!canEditSettings}
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                  className="w-full px-3 py-2 rounded-lg bg-[#070C16] border border-[#1E2E4E] text-[#F8FAFC] text-xs focus:outline-none focus:border-[#F59E0B] disabled:opacity-50"
                >
                  {Object.values(CurrencyCode).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Unit System
                </label>
                <select
                  disabled={!canEditSettings}
                  value={measurementUnitSystem}
                  onChange={(e) => setMeasurementUnitSystem(e.target.value as UnitSystem)}
                  className="w-full px-3 py-2 rounded-lg bg-[#070C16] border border-[#1E2E4E] text-[#F8FAFC] text-xs focus:outline-none focus:border-[#F59E0B] disabled:opacity-50"
                >
                  <option value={UnitSystem.METRIC}>METRIC (SI Units: m, m², m³, kg, t)</option>
                  <option value={UnitSystem.IMPERIAL}>IMPERIAL (ft, sq ft, cu yd, lb)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Measurement Standard (ES-01)
                </label>
                <select
                  disabled={!canEditSettings}
                  value={measurementStandard}
                  onChange={(e) => setMeasurementStandard(e.target.value as MeasurementStandard)}
                  className="w-full px-3 py-2 rounded-lg bg-[#070C16] border border-[#1E2E4E] text-[#F8FAFC] text-xs focus:outline-none focus:border-[#F59E0B] disabled:opacity-50"
                >
                  <option value={MeasurementStandard.SLS_573}>
                    SLS 573:1999 (Sri Lanka Standard Building Works)
                  </option>
                  <option value={MeasurementStandard.CESMM4}>
                    CESMM4 (Civil Engineering Standard Method 4)
                  </option>
                  <option value={MeasurementStandard.NRM2}>
                    RICS NRM2 (Detailed Measurement for Building Works)
                  </option>
                  <option value={MeasurementStandard.NRM1}>
                    RICS NRM1 (Order of Cost Estimating)
                  </option>
                  <option value={MeasurementStandard.SMM7}>
                    SMM7 (Standard Method of Measurement 7)
                  </option>
                  <option value={MeasurementStandard.POMI}>
                    POMI (Principles of Measurement International)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Contract Standard (ES-03)
                </label>
                <select
                  disabled={!canEditSettings}
                  value={contractStandard}
                  onChange={(e) => setContractStandard(e.target.value as ContractStandard)}
                  className="w-full px-3 py-2 rounded-lg bg-[#070C16] border border-[#1E2E4E] text-[#F8FAFC] text-xs focus:outline-none focus:border-[#F59E0B] disabled:opacity-50"
                >
                  <option value="">(None / Custom)</option>
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
                    FIDIC Red Book (Building and Engineering Works)
                  </option>
                  <option value={ContractStandard.FIDIC_YELLOW}>
                    FIDIC Yellow Book (Plant &amp; Design-Build)
                  </option>
                  <option value={ContractStandard.JCT}>
                    JCT Standard Building Contract
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Schedule & Lifecycle */}
          <div className="rounded-xl bg-[#111C35] border border-[#1E2E4E] p-6 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-[#F8FAFC] border-b border-[#1E2E4E] pb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#8B5CF6]" />
              <span>Lifecycle Schedule & Status Transitions</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Project Status
                </label>
                <select
                  disabled={!canEditSettings}
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                  className="w-full px-3 py-2 rounded-lg bg-[#070C16] border border-[#1E2E4E] text-[#F8FAFC] text-xs font-semibold focus:outline-none focus:border-[#8B5CF6] disabled:opacity-50"
                >
                  {allowedStatuses.map((st) => (
                    <option key={st} value={st}>
                      {st.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-[#64748B] mt-1">
                  Enforces validated state transitions.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Start Date
                </label>
                <input
                  type="date"
                  disabled={!canEditSettings}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#070C16] border border-[#1E2E4E] text-[#F8FAFC] text-xs focus:outline-none focus:border-[#8B5CF6] disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Expected Completion
                </label>
                <input
                  type="date"
                  disabled={!canEditSettings}
                  value={expectedCompletionDate}
                  onChange={(e) => setExpectedCompletionDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#070C16] border border-[#1E2E4E] text-[#F8FAFC] text-xs focus:outline-none focus:border-[#8B5CF6] disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Actual Completion
                </label>
                <input
                  type="date"
                  disabled={!canEditSettings}
                  value={actualCompletionDate}
                  onChange={(e) => setActualCompletionDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#070C16] border border-[#1E2E4E] text-[#F8FAFC] text-xs focus:outline-none focus:border-[#8B5CF6] disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {canEditSettings && (
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#14B8A6] hover:bg-[#0D9488] text-[#070C16] text-xs font-bold transition-colors shadow-lg shadow-[#14B8A6]/20 disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Project Configuration</span>
              </button>
            </div>
          )}
        </form>

        {/* Danger Zone */}
        {canDeleteProject && (
          <div className="rounded-xl bg-[#EF4444]/5 border border-[#EF4444]/30 p-6 space-y-4">
            <h3 className="text-sm font-bold text-[#EF4444] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              <span>Danger Zone — Project Removal</span>
            </h3>
            <p className="text-xs text-[#94A3B8]">
              Permanently delete this project workspace and all its associated spatial nodes, work packages, and access grants. This action cannot be undone.
            </p>
            <button
              onClick={() => void handleDeleteProject()}
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Project Workspace</span>
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
