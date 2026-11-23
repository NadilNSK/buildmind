import React from 'react';
import Link from 'next/link';
import { Building2 } from 'lucide-react';

interface AuthCardProps {
  title: string;
  subtitle: string;
  error?: string | null;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthCard({ title, subtitle, error, children, footer }: AuthCardProps) {
  return (
    <div className="min-h-screen bg-[#0B1220] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Decorative architectural grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#14203515_1px,transparent_1px),linear-gradient(to_bottom,#14203515_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Brand Header */}
      <div className="mb-8 flex flex-col items-center text-center z-10">
        <Link href="/" className="flex items-center gap-2.5 group mb-3">
          <div className="w-10 h-10 rounded-lg bg-[#111C35] border border-[#1E2E4E] flex items-center justify-center text-[#14B8A6] group-hover:border-[#14B8A6] transition-colors shadow-lg shadow-[#14B8A6]/5">
            <Building2 className="w-6 h-6" />
          </div>
          <span className="font-bold text-xl tracking-tight text-[#F8FAFC]">
            BuildMind <span className="text-[#14B8A6]">AI</span>
          </span>
        </Link>
        <span className="text-xs uppercase tracking-widest text-[#64748B] font-mono">
          Enterprise Quantity Surveying & Commercial Management
        </span>
      </div>

      {/* Card Container */}
      <div className="w-full max-w-md bg-[#111C35] border border-[#1E2E4E] rounded-xl p-8 shadow-2xl relative z-10">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-[#F8FAFC] tracking-tight">{title}</h1>
          <p className="text-sm text-[#94A3B8] mt-1">{subtitle}</p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 p-3.5 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 text-xs text-[#FCA5A5] flex items-start gap-2.5 animate-in fade-in duration-200"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] mt-1 shrink-0" />
            <div className="flex-1 leading-relaxed">{error}</div>
          </div>
        )}

        {children}

        {footer && <div className="mt-6 pt-5 border-t border-[#1E2E4E] text-center text-xs text-[#94A3B8]">{footer}</div>}
      </div>

      {/* Trust & Compliance Label */}
      <div className="mt-8 text-center text-xs text-[#475569] z-10 flex items-center gap-2">
        <span>Conforms to SLS 573, CESMM4, CIDA & FIDIC Commercial Protocols</span>
      </div>
    </div>
  );
}
