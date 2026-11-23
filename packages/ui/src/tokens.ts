/**
 * BuildMind AI v5.0 — Enterprise Design System Tokens
 * Deep Navy / Precision Teal Palette for AEC Commercial Management
 */

export const colors = {
  // Brand Deep Navy Base
  brandNavy: {
    DEFAULT: '#0B1220', // Primary background
    950: '#070C16',
    900: '#0B1220',
    850: '#0F182A',
    800: '#142035',
    700: '#1E2F4C',
    600: '#2C436B',
  },

  // Precision Teal Accent
  brandTeal: {
    DEFAULT: '#14B8A6',
    50: '#F0FDFA',
    100: '#CCFBF1',
    200: '#99F6E4',
    300: '#5EEAD4',
    400: '#2DD4BF',
    500: '#14B8A6',
    600: '#0D9488',
    700: '#0F766E',
    800: '#115E59',
    900: '#134E4A',
  },

  // Enterprise Dark & Light Surfaces
  surface: {
    backgroundDark: '#0B1220',
    cardDark: '#111C35',
    cardBorderDark: '#1E2E4E',
    sidebarDark: '#070C16',
    sidebarBorderDark: '#16223B',
    hoverDark: '#182745',
    inputDark: '#0E172B',
  },

  // High-contrast Accessible Text
  text: {
    primaryDark: '#F8FAFC',
    secondaryDark: '#94A3B8',
    mutedDark: '#64748B',
    accentDark: '#14B8A6',
  },

  // Commercial Audit Status Colors
  status: {
    planning: '#64748B',
    active: '#14B8A6',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6',
    success: '#10B981',
  },
} as const;

export const brandMeta = {
  name: 'BuildMind AI',
  version: '5.0.0',
  tagline: 'Enterprise AI-Assisted Quantity Surveying & Commercial Management',
  jurisdictions: ['Sri Lanka (SLS 573 / CIDA)', 'International (CESMM4 / NRM2 / FIDIC)'],
};
