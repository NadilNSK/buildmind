'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  ShieldCheck,
  Activity,
  User,
  Lock,
  LogOut,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Users,
  Settings,
  Check,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useOrganization } from '@/context/organization-context';

export function Header() {
  const { user, logout } = useAuth();
  const {
    organizations,
    currentOrganization,
    userRole,
    selectOrganization,
  } = useOrganization();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [orgMenuOpen, setOrgMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const orgMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
      if (
        orgMenuRef.current &&
        !orgMenuRef.current.contains(event.target as Node)
      ) {
        setOrgMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'QS';

  return (
    <header className="h-14 bg-[#0B1220]/90 backdrop-blur-md border-b border-[#1E2E4E] px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        {/* Organization Switcher Dropdown */}
        <div className="relative" ref={orgMenuRef}>
          <button
            onClick={() => setOrgMenuOpen(!orgMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#111C35] hover:bg-[#162342] border border-[#1E2E4E] text-xs transition-colors focus:outline-none"
            aria-expanded={orgMenuOpen}
            aria-label="Organization selector"
          >
            <Building2 className="w-3.5 h-3.5 text-[#14B8A6]" />
            <span className="font-semibold text-[#F8FAFC] max-w-[140px] truncate">
              {currentOrganization?.name || 'Select Org'}
            </span>
            {userRole && (
              <span className="text-[10px] font-mono bg-[#14B8A6]/15 text-[#14B8A6] px-1.5 py-0.5 rounded border border-[#14B8A6]/30">
                {userRole.replace('ORGANIZATION_', '')}
              </span>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
          </button>

          {/* Org Dropdown Menu */}
          {orgMenuOpen && (
            <div className="absolute left-0 mt-2 w-64 rounded-xl bg-[#111C35] border border-[#1E2E4E] shadow-2xl py-2 z-50 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-3.5 py-1.5 text-[10px] uppercase tracking-wider font-semibold text-[#64748B] border-b border-[#1E2E4E] mb-1">
                Organizations ({organizations.length})
              </div>

              <div className="max-h-52 overflow-y-auto">
                {organizations.map((org) => {
                  const isSelected = org.id === currentOrganization?.id;
                  return (
                    <button
                      key={org.id}
                      onClick={() => {
                        void selectOrganization(org.id);
                        setOrgMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2 hover:bg-[#0E172B] transition-colors text-left ${
                        isSelected ? 'text-[#14B8A6] bg-[#0E172B]/60' : 'text-[#CBD5E1]'
                      }`}
                    >
                      <div className="truncate">
                        <div className="font-medium truncate">{org.name}</div>
                        <div className="text-[10px] text-[#64748B] font-mono">{org.slug}</div>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#14B8A6] shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-[#1E2E4E] my-1" />

              {currentOrganization && (
                <>
                  <Link
                    href={`/organizations/${currentOrganization.id}/members`}
                    onClick={() => setOrgMenuOpen(false)}
                    className="flex items-center gap-2 px-3.5 py-1.5 text-[#CBD5E1] hover:text-[#14B8A6] hover:bg-[#0E172B] transition-colors"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Team & Members</span>
                  </Link>

                  <Link
                    href={`/organizations/${currentOrganization.id}/settings`}
                    onClick={() => setOrgMenuOpen(false)}
                    className="flex items-center gap-2 px-3.5 py-1.5 text-[#CBD5E1] hover:text-[#14B8A6] hover:bg-[#0E172B] transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Organization Settings</span>
                  </Link>
                </>
              )}

              <Link
                href="/onboarding/organization"
                onClick={() => setOrgMenuOpen(false)}
                className="flex items-center gap-2 px-3.5 py-1.5 text-[#14B8A6] hover:bg-[#14B8A6]/10 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Organization</span>
              </Link>
            </div>
          )}
        </div>

        {/* Measurement Standard Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#070C16] border border-[#16223B] text-[11px] text-[#94A3B8]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6]"></span>
          <span>Method: <strong className="text-[#CBD5E1]">SLS 573:1999</strong></span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* System Health Status Indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#10B981]/10 border border-[#10B981]/25 text-[11px] text-[#10B981]">
          <Activity className="w-3 h-3 animate-pulse" />
          <span className="font-medium">System Online</span>
        </div>

        {/* Security & Audit Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-[#64748B]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#14B8A6]" />
          <span>Audit Active</span>
        </div>

        {/* Authenticated User Menu */}
        <div className="relative pl-3 border-l border-[#1E2E4E]" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2.5 hover:bg-[#111C35] p-1.5 rounded-lg border border-transparent hover:border-[#1E2E4E] transition-colors focus:outline-none"
            aria-expanded={userMenuOpen}
            aria-label="User account menu"
          >
            <div className="w-7 h-7 rounded-full bg-[#1E2F4C] border border-[#14B8A6]/40 flex items-center justify-center text-xs font-semibold text-[#14B8A6]">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-medium text-[#F8FAFC] leading-tight">
                {user?.fullName || 'Senior QS Lead'}
              </div>
              <div className="text-[10px] text-[#64748B] flex items-center gap-1">
                <span>{userRole || user?.role || 'QS_ENGINEER'}</span>
                {user?.isEmailVerified ? (
                  <CheckCircle2 className="w-2.5 h-2.5 text-[#10B981]" />
                ) : (
                  <AlertTriangle className="w-2.5 h-2.5 text-[#F59E0B]" />
                )}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#64748B] hidden sm:block" />
          </button>

          {/* Dropdown Menu */}
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#111C35] border border-[#1E2E4E] shadow-2xl py-2 z-50 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-3.5 py-2 border-b border-[#1E2E4E] mb-1">
                <div className="font-semibold text-[#F8FAFC] truncate">{user?.fullName || 'Surveyor'}</div>
                <div className="text-[11px] text-[#94A3B8] truncate">{user?.email || 'authenticated'}</div>
              </div>

              <Link
                href="/organizations"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2 px-3.5 py-2 text-[#CBD5E1] hover:text-[#14B8A6] hover:bg-[#0E172B] transition-colors"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Organizations Directory</span>
              </Link>

              <Link
                href="/settings/profile"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2 px-3.5 py-2 text-[#CBD5E1] hover:text-[#14B8A6] hover:bg-[#0E172B] transition-colors"
              >
                <User className="w-3.5 h-3.5" />
                <span>Account Profile</span>
              </Link>

              <Link
                href="/settings/security"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2 px-3.5 py-2 text-[#CBD5E1] hover:text-[#14B8A6] hover:bg-[#0E172B] transition-colors"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Security & Sessions</span>
              </Link>

              <Link
                href="/"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2 px-3.5 py-2 text-[#CBD5E1] hover:text-[#14B8A6] hover:bg-[#0E172B] transition-colors"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Public Homepage</span>
              </Link>

              <div className="border-t border-[#1E2E4E] my-1" />

              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  void logout();
                }}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors text-left"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
