import Link from 'next/link';
import {
  Ruler,
  Calculator,
  FileSpreadsheet,
  Coins,
  FileText,
  FileCheck2,
  ShoppingCart,
  TrendingDown,
  Receipt,
  GitBranch,
  ShieldAlert,
  Archive,
  Layers,
  Box,
  Bot,
  Building2,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from 'lucide-react';

export default function HomePage() {
  const qsModules = [
    { code: 'QS-01', name: 'Quantity Takeoff', desc: 'CAD/PDF/BIM 2D & 3D measurement extraction with measurement sheets' },
    { code: 'QS-02', name: 'Cost Estimation', desc: 'Analytical rate build-ups (labour, plant, material, overheads) with CIDA references' },
    { code: 'QS-03', name: 'BOQ Generation', desc: 'Hierarchical Bill of Quantities conforming to SLS 573, CESMM4, and NRM2' },
    { code: 'QS-04', name: 'Budget Planning', desc: 'Baseline cash flow forecasting and contingency risk allocation modeling' },
    { code: 'QS-05', name: 'Tender Management', desc: 'Packaging, automated addenda distribution, bid evaluation matrices' },
    { code: 'QS-06', name: 'Contract Administration', desc: 'FIDIC / CIDA SBD clause management, formal notices, milestones' },
    { code: 'QS-07', name: 'Procurement Management', desc: 'Material requisitions, supplier RFQ tracking, purchase order matching' },
    { code: 'QS-08', name: 'Cost Control & Monitoring', desc: 'Earned Value Analysis (EVM), cost variance tracking, cost-to-complete' },
    { code: 'QS-09', name: 'Interim Valuations', desc: 'Monthly progress valuations, retention deductions, payment certificate issuance' },
    { code: 'QS-10', name: 'Variation Management', desc: 'Variation registers, clause-based rate derivations, cumulative financial impact' },
    { code: 'QS-11', name: 'Risk & Value Engineering', desc: 'Quantitative risk registers, value optimization trade-offs' },
    { code: 'QS-12', name: 'Final Account Preparation', desc: 'Final measurement reconciliation, liquidated damages, claims settlement' },
  ];

  const sharedSystems = [
    { code: 'ES-01', name: 'Measurement Standards Engine', desc: 'SLS 573, SMM7, NRM2, POMI, CESMM4 measurement rules' },
    { code: 'ES-02', name: 'Specifications Engine', desc: 'CIDA, MasterFormat, and custom specification clause linkage' },
    { code: 'ES-03', name: 'Contract Rules Engine', desc: 'FIDIC Red/Yellow, CIDA SBD-01/02 condition compliance engine' },
    { code: 'ES-04', name: 'Drawing Revision Management', desc: 'Cloud-delta revision comparison and geometric change detection' },
    { code: 'ES-05', name: 'Document Control', desc: 'Transmittals, submittals, RFI audit tracking with full provenance' },
    { code: 'ES-06', name: 'Commercial Reporting', desc: 'Executive cost dashboards, BOQ exports, certificate printing' },
    { code: 'ES-07', name: 'Quality Assurance & Audit', desc: 'Immutable audit logging for measurements, rates, and sign-offs' },
  ];

  const advancedFeatures = [
    { code: 'AF-01', name: 'AI Auto-Detection & One-Click Takeoff', desc: 'Computer-vision assisted element deduction; user-confirmed calculation only' },
    { code: 'AF-02', name: 'Interactive 3D BIM Viewer', desc: 'Browser-based IFC/glTF rendering with direct BIM element quantity queries' },
    { code: 'AF-03', name: 'AI Drawing Conflict Detection', desc: 'Structural vs architectural cross-drawing clash and dimension mismatch detection' },
    { code: 'AF-04', name: 'Conversational QS Copilot', desc: 'Natural language queries over project BOQs, contracts, specifications, and drawing revisions' },
  ];

  return (
    <div className="min-h-screen bg-[#0B1220] text-[#F8FAFC]">
      {/* Top Navigation */}
      <nav className="h-16 border-b border-[#1E2E4E] bg-[#070C16]/80 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#0D9488] to-[#14B8A6] flex items-center justify-center font-bold text-white shadow-sm shadow-[#14B8A6]/20">
            BM
          </div>
          <div>
            <span className="font-semibold text-sm tracking-tight text-[#F8FAFC]">
              BuildMind AI
            </span>
            <span className="ml-2 text-[10px] text-[#14B8A6] font-mono px-1.5 py-0.5 bg-[#14B8A6]/10 rounded border border-[#14B8A6]/20">
              v5.0 Enterprise
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-xs text-[#94A3B8]">
            <span className="w-2 h-2 rounded-full bg-[#14B8A6]"></span>
            <span>Target Market: Sri Lanka (SLS 573 / CIDA) & Global</span>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#14B8A6] hover:bg-[#0D9488] text-white text-xs font-semibold shadow-md shadow-[#14B8A6]/20 transition-all"
          >
            Launch Workspace <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-20 pb-16 px-6 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111C35] border border-[#1E2E4E] text-xs text-[#14B8A6] mb-6">
          <ShieldCheck className="w-3.5 h-3.5" /> Phase 1 Foundation Verified: Monorepo, API, DB & Design System
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#F8FAFC] leading-tight mb-6">
          Enterprise AI-Assisted <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#14B8A6] via-[#2DD4BF] to-[#5EEAD4]">
            Quantity Surveying & Commercial Management
          </span>
        </h1>
        <p className="text-base md:text-lg text-[#94A3B8] max-w-3xl mx-auto mb-8 leading-relaxed">
          Standardized takeoff, analytical rate build-ups, and automated BOQ generation initially calibrated for
          Sri Lankan construction standards (SLS 573, CIDA SBD-01/02) and architected for international expansion
          (CESMM4, NRM2, FIDIC).
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#14B8A6] hover:bg-[#0D9488] text-white text-sm font-semibold shadow-lg shadow-[#14B8A6]/25 transition-all"
          >
            Enter Commercial Workspace <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/takeoff"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#111C35] hover:bg-[#182745] text-[#CBD5E1] border border-[#1E2E4E] text-sm font-medium transition-all"
          >
            Explore Takeoff Module (QS-01)
          </Link>
        </div>
      </header>

      {/* 24 Approved Capabilities Overview */}
      <section className="py-12 px-6 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <div className="text-xs uppercase font-semibold text-[#14B8A6] tracking-wider">
            Approved Enterprise Scope
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#F8FAFC]">
            Exactly 24 Approved Core Capabilities
          </h2>
          <p className="text-sm text-[#94A3B8] max-w-2xl mx-auto">
            BuildMind AI strictly maintains bounded engineering to deliver high reliability and deterministic accuracy.
          </p>
        </div>

        {/* 12 QS Core Modules */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E2E4E] pb-3">
            <h3 className="text-lg font-semibold text-[#F8FAFC] flex items-center gap-2">
              <Calculator className="w-5 h-5 text-[#14B8A6]" />
              12 Quantity Surveying Core Modules
            </h3>
            <span className="text-xs font-mono text-[#64748B]">QS-01 to QS-12</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {qsModules.map((m) => (
              <div
                key={m.code}
                className="p-4 rounded-xl bg-[#111C35] border border-[#1E2E4E] hover:border-[#14B8A6]/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[#14B8A6]/10 text-[#14B8A6] border border-[#14B8A6]/20">
                      {m.code}
                    </span>
                    <span className="text-[10px] text-[#64748B]">Foundation Ready</span>
                  </div>
                  <h4 className="font-semibold text-sm text-[#F8FAFC] mb-1">{m.name}</h4>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 7 Shared Systems & SSQ-01 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E2E4E] pb-3">
            <h3 className="text-lg font-semibold text-[#F8FAFC] flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#14B8A6]" />
              7 Enterprise Shared Systems & Smart Selective Scope (SSQ-01)
            </h3>
            <span className="text-xs font-mono text-[#64748B]">ES-01 to ES-07 + SSQ-01</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {sharedSystems.map((s) => (
              <div key={s.code} className="p-4 rounded-xl bg-[#0F182A] border border-[#1E2E4E] flex flex-col justify-between">
                <div>
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[#1E293B] text-[#94A3B8] border border-[#334155] mb-2 inline-block">
                    {s.code}
                  </span>
                  <h4 className="font-semibold text-sm text-[#F8FAFC] mb-1">{s.name}</h4>
                  <p className="text-xs text-[#94A3B8]">{s.desc}</p>
                </div>
              </div>
            ))}
            <div className="p-4 rounded-xl bg-[#0F182A] border border-[#14B8A6]/30 flex flex-col justify-between">
              <div>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[#14B8A6]/20 text-[#14B8A6] border border-[#14B8A6]/30 mb-2 inline-block">
                  SSQ-01
                </span>
                <h4 className="font-semibold text-sm text-[#F8FAFC] mb-1">Smart Selective QS</h4>
                <p className="text-xs text-[#94A3B8]">
                  Granular scoping: full-project, floor, room, element, polygon, trade, inclusion/exclusion.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Approved Advanced Features */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E2E4E] pb-3">
            <h3 className="text-lg font-semibold text-[#F8FAFC] flex items-center gap-2">
              <Bot className="w-5 h-5 text-[#14B8A6]" />
              Only 4 Approved Advanced Features
            </h3>
            <span className="text-xs font-mono text-[#64748B]">AF-01 to AF-04</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {advancedFeatures.map((af) => (
              <div key={af.code} className="p-4 rounded-xl bg-[#111C35] border border-[#1E2E4E] flex flex-col justify-between">
                <div>
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[#14B8A6]/10 text-[#14B8A6] border border-[#14B8A6]/20 mb-2 inline-block">
                    {af.code}
                  </span>
                  <h4 className="font-semibold text-sm text-[#F8FAFC] mb-1">{af.name}</h4>
                  <p className="text-xs text-[#94A3B8]">{af.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Explicitly Excluded Features Notice */}
        <div className="p-6 rounded-xl bg-[#070C16] border border-[#16223B]">
          <div className="flex items-center gap-2 mb-3">
            <XCircle className="w-4 h-4 text-[#EF4444]" />
            <h3 className="text-sm font-semibold text-[#F8FAFC] uppercase tracking-wider">
              16 Excluded Optional Features (Protected Scope Boundary)
            </h3>
          </div>
          <p className="text-xs text-[#94A3B8] mb-3 leading-relaxed">
            To prevent architecture bloat and preserve commercial surveying rigor, the following 16 features are
            strictly excluded from BuildMind AI:
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-[#64748B]">
            <span>1. General Accounting / ERP</span>
            <span>2. Payroll / HR Management</span>
            <span>3. Site Attendance / Biometrics</span>
            <span>4. Heavy Fleet Telematics</span>
            <span>5. Autonomous Drone Piloting</span>
            <span>6. Site Robotics Control</span>
            <span>7. Generative CAD Architecture</span>
            <span>8. Structural Finite Element Calc</span>
            <span>9. Energy & LEED Cert Modeling</span>
            <span>10. Marketing CRM / Lead Gen</span>
            <span>11. Subcontractor B2B Payments</span>
            <span>12. Cryptocurrency Escrow</span>
            <span>13. Real Estate Facility Mgmt</span>
            <span>14. Safety Sensor IoT Streaming</span>
            <span>15. Weather Simulation Radar</span>
            <span>16. Direct Government Tax Filing</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1E2E4E] bg-[#070C16] py-8 px-6 mt-16 text-center text-xs text-[#64748B]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            BuildMind AI v5.0 — Enterprise Quantity Surveying & Commercial Management Platform
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-[#94A3B8] hover:text-[#14B8A6]">
              Workspace
            </Link>
            <Link href="/projects" className="text-[#94A3B8] hover:text-[#14B8A6]">
              Projects
            </Link>
            <span>Sri Lanka (SLS 573) / FIDIC Red</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
