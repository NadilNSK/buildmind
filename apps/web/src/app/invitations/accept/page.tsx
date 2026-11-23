'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  Mail,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Loader2,
  LogOut,
} from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';
import { useOrganization } from '@/context/organization-context';
import { OrganizationRole, InvitationStatus } from '@buildmind/shared-types';

interface VerifiedInvitation {
  valid: boolean;
  organizationId: string;
  organizationName: string;
  email: string;
  role: OrganizationRole;
  status: InvitationStatus;
  expiresAt: string;
  invitedBy?: {
    fullName: string;
    email: string;
  };
}

function AcceptInvitationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { refreshOrganizations, selectOrganization } = useOrganization();

  const [invitation, setInvitation] = useState<VerifiedInvitation | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptedOrg, setAcceptedOrg] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    async function verifyToken() {
      if (!token) {
        setError('No invitation token was provided in the link.');
        setIsValidating(false);
        return;
      }

      try {
        setIsValidating(true);
        const data = await apiClient<VerifiedInvitation>(
          `/organizations/invitations/verify?token=${encodeURIComponent(token)}`,
        );
        setInvitation(data);
        if (!data.valid) {
          setError(`This invitation is no longer valid (Status: ${data.status}).`);
        }
      } catch (err: unknown) {
        const msg =
          err instanceof ApiError
            ? err.message
            : 'Unable to verify invitation. The link may have expired or been revoked.';
        setError(msg);
      } finally {
        setIsValidating(false);
      }
    }

    void verifyToken();
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;

    try {
      setIsAccepting(true);
      setError(null);

      const result = await apiClient<any>('/organizations/invitations/accept', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });

      setAcceptedOrg(result.organization);
      await refreshOrganizations();
      if (result.organization?.id) {
        await selectOrganization(result.organization.id);
      }

      setTimeout(() => {
        router.push('/projects');
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to accept invitation';
      setError(msg);
    } finally {
      setIsAccepting(false);
    }
  };

  const isEmailMismatch =
    isAuthenticated &&
    user &&
    invitation &&
    user.email.toLowerCase().trim() !== invitation.email.toLowerCase().trim();

  return (
    <div className="min-h-screen bg-[#0B1220] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-[#0D9488] to-[#14B8A6] text-white shadow-lg shadow-[#14B8A6]/20 mb-2">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-[#F8FAFC]">Organization Invitation</h1>
          <p className="text-xs text-[#94A3B8]">
            Join an enterprise commercial quantity surveying workspace on BuildMind AI.
          </p>
        </div>

        <div className="rounded-2xl bg-[#111C35] border border-[#1E2E4E] p-6 shadow-xl space-y-5">
          {isValidating || authLoading ? (
            <div className="py-8 flex flex-col items-center justify-center space-y-3 text-xs text-[#94A3B8]">
              <Loader2 className="w-6 h-6 animate-spin text-[#14B8A6]" />
              <span>Verifying cryptographic invitation token...</span>
            </div>
          ) : error ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 flex items-start gap-3 text-xs text-[#EF4444]">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-semibold">Invitation Invalid</div>
                  <p className="text-[11px] text-[#CBD5E1]">{error}</p>
                </div>
              </div>
              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-[#14B8A6] hover:underline"
                >
                  <span>Return to Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : acceptedOrg ? (
            <div className="py-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center text-[#10B981] mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-[#F8FAFC]">Welcome to {acceptedOrg.name}!</h2>
              <p className="text-xs text-[#94A3B8]">
                Your membership is now active. Redirecting you to workspace projects...
              </p>
            </div>
          ) : invitation ? (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-[#070C16] border border-[#1E2E4E] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#94A3B8]">Invited To</span>
                  <span className="text-xs font-bold text-[#F8FAFC]">
                    {invitation.organizationName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#94A3B8]">Target Email</span>
                  <span className="text-xs font-mono text-[#14B8A6]">{invitation.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#94A3B8]">Assigned Role</span>
                  <span className="text-xs font-mono bg-[#1E2E4E] px-2 py-0.5 rounded text-[#CBD5E1]">
                    {invitation.role.replace('ORGANIZATION_', '')}
                  </span>
                </div>
                {invitation.invitedBy && (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#64748B]">Invited By</span>
                    <span className="text-[#94A3B8]">{invitation.invitedBy.fullName}</span>
                  </div>
                )}
              </div>

              {isEmailMismatch ? (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-xs text-[#F59E0B] space-y-1">
                    <div className="font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Account Mismatch</span>
                    </div>
                    <p className="text-[11px] text-[#CBD5E1]">
                      This invitation was issued to <strong>{invitation.email}</strong>, but you are
                      currently signed in as <strong>{user?.email}</strong>.
                    </p>
                  </div>
                  <button
                    onClick={() => void logout()}
                    className="w-full py-2.5 px-4 rounded-lg bg-[#1E2E4E] hover:bg-[#2A3E68] text-[#F8FAFC] text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out & Switch Account</span>
                  </button>
                </div>
              ) : isAuthenticated ? (
                <div className="space-y-3">
                  <button
                    onClick={handleAccept}
                    disabled={isAccepting}
                    className="w-full py-2.5 px-4 rounded-lg bg-[#14B8A6] hover:bg-[#0D9488] text-[#070C16] font-semibold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-60 shadow-lg shadow-[#14B8A6]/20 cursor-pointer"
                  >
                    {isAccepting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Joining Organization...</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4" />
                        <span>Accept Invitation & Enter Workspace</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  <Link
                    href={`/login?returnUrl=${encodeURIComponent(
                      `/invitations/accept?token=${token}`,
                    )}`}
                    className="w-full py-2.5 px-4 rounded-lg bg-[#14B8A6] hover:bg-[#0D9488] text-[#070C16] font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-[#14B8A6]/20"
                  >
                    <span>Sign In to Accept</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href={`/register?email=${encodeURIComponent(invitation.email)}`}
                    className="w-full py-2 px-4 rounded-lg bg-[#070C16] hover:bg-[#111C35] text-[#CBD5E1] text-xs text-center block border border-[#1E2E4E] transition-colors"
                  >
                    Create a New Account
                  </Link>
                </div>
              )}
            </div>
          ) : null}

          <div className="border-t border-[#1E2E4E] pt-3 flex items-center justify-between text-[11px] text-[#64748B]">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#14B8A6]" />
              <span>Cryptographically Verified</span>
            </div>
            <Link href="/" className="hover:text-[#CBD5E1]">
              BuildMind AI Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0B1220] flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#14B8A6]" />
        </div>
      }
    >
      <AcceptInvitationContent />
    </Suspense>
  );
}
