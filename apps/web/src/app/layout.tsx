import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../context/auth-context';
import { OrganizationProvider } from '../context/organization-context';

export const metadata: Metadata = {
  title: 'BuildMind AI v5.0 — Enterprise Quantity Surveying & Commercial Management',
  description:
    'AI-assisted SaaS for Quantity Surveying, BOQ generation, and commercial management conforming to SLS 573, CESMM4, CIDA, and FIDIC standards.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0B1220] text-[#F8FAFC] antialiased">
        <AuthProvider>
          <OrganizationProvider>{children}</OrganizationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
