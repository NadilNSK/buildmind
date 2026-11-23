'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
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
  Compass,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  code: string;
  phase: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Platform Overview',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, code: 'CORE', phase: 1 },
      { name: 'Projects', href: '/projects', icon: FolderKanban, code: 'CORE', phase: 1 },
    ],
  },
  {
    title: 'Measurement & Pricing',
    items: [
      { name: 'Quantity Takeoff', href: '/takeoff', icon: Ruler, code: 'QS-01', phase: 2 },
      { name: 'Cost Estimation', href: '/estimation', icon: Calculator, code: 'QS-02', phase: 2 },
      { name: 'BOQ Generation', href: '/boq', icon: FileSpreadsheet, code: 'QS-03', phase: 2 },
    ],
  },
  {
    title: 'Commercial Administration',
    items: [
      { name: 'Budget Planning', href: '/budgets', icon: Coins, code: 'QS-04', phase: 3 },
      { name: 'Tender Management', href: '/tenders', icon: FileText, code: 'QS-05', phase: 3 },
      { name: 'Contract Administration', href: '/contracts', icon: FileCheck2, code: 'QS-06', phase: 3 },
      { name: 'Procurement', href: '/procurement', icon: ShoppingCart, code: 'QS-07', phase: 3 },
      { name: 'Cost Control & EVM', href: '/cost-control', icon: TrendingDown, code: 'QS-08', phase: 3 },
      { name: 'Interim Valuations', href: '/valuations', icon: Receipt, code: 'QS-09', phase: 2 },
      { name: 'Variations Register', href: '/variations', icon: GitBranch, code: 'QS-10', phase: 2 },
      { name: 'Risk & Value Eng.', href: '/risk-value', icon: ShieldAlert, code: 'QS-11', phase: 3 },
      { name: 'Final Accounts', href: '/final-accounts', icon: Archive, code: 'QS-12', phase: 3 },
    ],
  },
  {
    title: 'Intelligent AEC Tools',
    items: [
      { name: 'Drawing Viewer', href: '/drawing-viewer', icon: Layers, code: 'ES-04', phase: 2 },
      { name: '3D BIM Viewer', href: '/bim-viewer', icon: Box, code: 'AF-02', phase: 2 },
      { name: 'QS Copilot', href: '/qs-copilot', icon: Bot, code: 'AF-04', phase: 3 },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#070C16] border-r border-[#16223B] flex flex-col h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#16223B] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#0D9488] to-[#14B8A6] flex items-center justify-center text-white font-bold text-base shadow-sm shadow-[#14B8A6]/20">
            BM
          </div>
          <div>
            <div className="font-semibold text-sm tracking-tight text-[#F8FAFC] flex items-center gap-1.5">
              BuildMind AI <span className="text-[10px] text-[#14B8A6] font-mono px-1 py-0.2 bg-[#14B8A6]/10 rounded border border-[#14B8A6]/20">v5.0</span>
            </div>
            <div className="text-[11px] text-[#64748B]">Enterprise QS Suite</div>
          </div>
        </Link>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map((section) => (
          <div key={section.title}>
            <div className="text-[10px] uppercase font-semibold text-[#64748B] tracking-wider px-2 mb-1.5">
              {section.title}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-[#14B8A6]/15 text-[#14B8A6] border border-[#14B8A6]/30'
                        : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#111C35]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#14B8A6]' : 'text-[#64748B]'}`} />
                      <span className="truncate">{item.name}</span>
                    </div>
                    <span
                      className={`text-[9px] font-mono px-1 py-0.5 rounded border shrink-0 ${
                        item.phase === 1
                          ? 'bg-[#14B8A6]/10 text-[#14B8A6] border-[#14B8A6]/30'
                          : 'bg-[#1E293B] text-[#64748B] border-[#334155]'
                      }`}
                    >
                      {item.code}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Tenant / Region Footer */}
      <div className="p-3 border-t border-[#16223B] bg-[#0A101D]">
        <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
          <Compass className="w-3.5 h-3.5 text-[#14B8A6]" />
          <span className="font-medium text-[#CBD5E1]">Sri Lanka (LK)</span>
          <span className="text-[10px] text-[#64748B] ml-auto font-mono">SLS 573</span>
        </div>
      </div>
    </aside>
  );
}
