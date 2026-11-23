'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient, ApiError } from '../lib/api-client';
import {
  OrganizationSummary,
  OrganizationRole,
  PermissionKey,
  hasPermission as checkPermission,
} from '@buildmind/shared-types';
import { CreateOrganizationInput } from '@buildmind/validation';
import { useAuth } from './auth-context';

interface OrganizationDetail extends OrganizationSummary {
  permissions?: PermissionKey[];
}

interface OrganizationContextType {
  organizations: OrganizationSummary[];
  currentOrganization: OrganizationSummary | null;
  userRole: OrganizationRole | null;
  permissions: PermissionKey[];
  isLoading: boolean;
  error: string | null;
  selectOrganization: (orgId: string) => Promise<void>;
  refreshOrganizations: () => Promise<void>;
  createOrganization: (input: CreateOrganizationInput) => Promise<OrganizationSummary>;
  hasPermission: (permission: PermissionKey) => boolean;
  clearError: () => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<OrganizationSummary | null>(null);
  const [userRole, setUserRole] = useState<OrganizationRole | null>(null);
  const [permissions, setPermissions] = useState<PermissionKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const selectOrganization = useCallback(async (orgId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Persist active organization in cookie & localStorage
      if (typeof document !== 'undefined') {
        document.cookie = `buildmind_org_id=${orgId}; path=/; max-age=31536000; SameSite=Lax`;
        localStorage.setItem('buildmind_active_org_id', orgId);
      }

      // Fetch organization details including server-derived permissions
      const detail = await apiClient<OrganizationDetail>(`/organizations/${orgId}`, {
        headers: { 'x-organization-id': orgId },
      });

      setCurrentOrganization(detail);
      setUserRole(detail.currentUserRole || null);
      setPermissions(detail.permissions || []);
    } catch (err: unknown) {
      console.warn('[OrganizationContext] Failed to select organization:', err);
      const msg = err instanceof ApiError ? err.message : 'Failed to switch organization';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshOrganizations = useCallback(async () => {
    if (!isAuthenticated) {
      setOrganizations([]);
      setCurrentOrganization(null);
      setUserRole(null);
      setPermissions([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const orgs = await apiClient<OrganizationSummary[]>('/organizations');
      setOrganizations(orgs);

      if (orgs.length === 0) {
        setCurrentOrganization(null);
        setUserRole(null);
        setPermissions([]);
        setIsLoading(false);
        return;
      }

      // Retrieve preferred or previously saved organization
      const savedOrgId =
        typeof localStorage !== 'undefined'
          ? localStorage.getItem('buildmind_active_org_id')
          : null;

      const targetOrg = orgs.find((o) => o.id === savedOrgId) || orgs[0];

      if (targetOrg) {
        await selectOrganization(targetOrg.id);
      }
    } catch (err: unknown) {
      console.warn('[OrganizationContext] Failed to load organizations:', err);
      const msg = err instanceof ApiError ? err.message : 'Failed to load organizations';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, selectOrganization]);

  useEffect(() => {
    if (!authLoading) {
      void refreshOrganizations();
    }
  }, [authLoading, refreshOrganizations]);

  const createOrganization = async (input: CreateOrganizationInput): Promise<OrganizationSummary> => {
    try {
      setIsLoading(true);
      setError(null);

      const created = await apiClient<OrganizationSummary>('/organizations', {
        method: 'POST',
        body: JSON.stringify(input),
      });

      // Refresh organizations and auto-select newly created org
      await refreshOrganizations();
      await selectOrganization(created.id);

      return created;
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to create organization';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const hasPermission = useCallback(
    (permission: PermissionKey): boolean => {
      if (!userRole) return false;
      if (permissions.length > 0) {
        return permissions.includes(permission);
      }
      return checkPermission(userRole, permission);
    },
    [userRole, permissions],
  );

  return (
    <OrganizationContext.Provider
      value={{
        organizations,
        currentOrganization,
        userRole,
        permissions,
        isLoading,
        error,
        selectOrganization,
        refreshOrganizations,
        createOrganization,
        hasPermission,
        clearError,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}
