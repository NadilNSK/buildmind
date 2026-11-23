import React from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthProps) {
  const requirements = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter (A-Z)', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter (a-z)', met: /[a-z]/.test(password) },
    { label: 'One number (0-9)', met: /[0-9]/.test(password) },
    { label: 'One special symbol (!@#$%^&*)', met: /[^A-Za-z0-9]/.test(password) },
  ];

  if (!password) return null;

  return (
    <div className="mt-2.5 p-3 rounded-lg bg-[#0E172B] border border-[#1E2E4E] text-xs">
      <div className="text-[11px] font-medium text-[#94A3B8] mb-2 uppercase tracking-wider font-mono">
        Password Requirements
      </div>
      <div className="space-y-1.5">
        {requirements.map((req, i) => (
          <div
            key={i}
            className={`flex items-center gap-2 transition-colors ${
              req.met ? 'text-[#10B981]' : 'text-[#64748B]'
            }`}
          >
            {req.met ? (
              <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
            )}
            <span className={req.met ? 'text-[#CBD5E1]' : 'text-[#64748B]'}>{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
