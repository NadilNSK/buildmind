'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Network,
  ListTree,
  Settings,
  Users,
} from 'lucide-react';

interface ProjectNavProps {
  projectId: string;
  memberCount?: number;
  spatialNodeCount?: number;
  workPackageCount?: number;
}

export function ProjectNav({
  projectId,
  memberCount,
  spatialNodeCount,
  workPackageCount,
}: ProjectNavProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Overview',
      href: `/projects/${projectId}`,
      icon: LayoutDashboard,
      exact: true,
    },
    {
      label: 'Spatial Breakdown (SBS)',
      href: `/projects/${projectId}/spatial`,
      icon: Network,
      count: spatialNodeCount,
      exact: false,
    },
    {
      label: 'Work Breakdown (WBS)',
      href: `/projects/${projectId}/work-packages`,
      icon: ListTree,
      count: workPackageCount,
      exact: false,
    },
    {
      label: 'Team Access',
      href: `/projects/${projectId}/team`,
      icon: Users,
      count: memberCount,
      exact: false,
    },
    {
      label: 'Settings & Metadata',
      href: `/projects/${projectId}/settings`,
      icon: Settings,
      exact: false,
    },
  ];

  return (
    <div className="border-b border-[#1E2E4E] mb-6 overflow-x-auto scrollbar-thin">
      <nav className="flex items-center gap-1 min-w-max pb-px" aria-label="Project Tabs">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 ${
                isActive
                  ? 'border-[#14B8A6] text-[#14B8A6] bg-[#111C35]'
                  : 'border-transparent text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#111C35]/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
              {item.count !== undefined && item.count !== null && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive
                      ? 'bg-[#14B8A6]/20 text-[#14B8A6]'
                      : 'bg-[#1E2E4E] text-[#94A3B8]'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
