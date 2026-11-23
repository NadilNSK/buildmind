'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuth } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/login?returnUrl=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  // Loading skeleton state preventing layout shift and flashing of protected data
  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-[#0B1220]">
        {/* Placeholder sidebar */}
        <div className="w-64 bg-[#070C16] border-r border-[#16223B] hidden md:block animate-pulse p-4 space-y-4">
          <div className="h-8 bg-[#111C35] rounded-md w-3/4 mb-6" />
          <div className="h-4 bg-[#111C35] rounded w-1/2" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-8 bg-[#111C35]/60 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <div className="h-14 bg-[#0B1220] border-b border-[#1E2E4E] flex items-center justify-between px-6">
            <div className="h-6 bg-[#111C35] rounded w-48 animate-pulse" />
            <div className="h-6 bg-[#111C35] rounded w-24 animate-pulse" />
          </div>
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="flex items-center gap-2.5 text-xs text-[#94A3B8]">
              <Loader2 className="w-4 h-4 animate-spin text-[#14B8A6]" />
              <span>Verifying authenticated session...</span>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Not authenticated will redirect via useEffect
  if (!isAuthenticated && !user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[#0B1220]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
