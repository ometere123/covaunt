import type { Metadata } from 'next';
import { AppShell } from '../components/AppShell';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'COVAUNT — Collective decisions. Individual consent.', template: '%s — COVAUNT' },
  description: 'A consent-bound community treasury on NEAR testnet. Governance can vote, but donor restrictions remain enforceable.',
  icons: { icon: '/covaunt-mark.svg' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-scroll-behavior="smooth"><body><AppShell>{children}</AppShell></body></html>;
}
