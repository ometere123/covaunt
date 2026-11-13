'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { CONFIG } from '../lib/config';
import { DataProvider, useData } from './DataProvider';
import { WalletButton } from './WalletButton';
import { WalletProvider } from './WalletProvider';

const links = [
  { href: '/treasury', label: 'Treasury' },
  { href: '/covenants', label: 'Covenants' },
  { href: '/mandates', label: 'Mandates' },
  { href: '/work', label: 'Work' },
  { href: '/journal', label: 'Journal' },
  { href: '/governance', label: 'Governance' },
];

function Shell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { mode, loading, error } = useData();
  const liveLabel = mode === 'preview' ? 'Preview mode · no transactions' : loading ? 'Checking testnet' : error ? 'Testnet data unavailable' : 'NEAR testnet · live reads';

  return (
    <div className="site-frame">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="site-header">
        <Link className="wordmark" href="/" aria-label="COVAUNT home" onClick={() => setOpen(false)}>
          <span className="wordmark-mark" aria-hidden="true"><span /></span>
          <span><strong>COVAUNT</strong><small>Consent ledger / NEAR</small></span>
        </Link>
        <button className="menu-button" type="button" aria-expanded={open} aria-controls="primary-navigation" onClick={() => setOpen((value) => !value)}>
          <span>{open ? 'Close' : 'Menu'}</span>
          <span className={`menu-icon ${open ? 'is-close' : ''}`} aria-hidden="true"><i /><i /><i /></span>
        </button>
        <nav id="primary-navigation" className={`primary-navigation ${open ? 'is-open' : ''}`} aria-label="Primary navigation">
          {links.map((link) => <Link key={link.href} href={link.href} className={pathname === link.href || pathname.startsWith(`${link.href}/`) ? 'is-current' : ''} onClick={() => setOpen(false)}>{link.label}</Link>)}
          <Link href="/about" onClick={() => setOpen(false)} className={pathname === '/about' ? 'is-current' : ''}>About</Link>
        </nav>
        <WalletButton />
      </header>
      <div className={`status-ribbon ${error ? 'is-warning' : ''} ${mode === 'preview' ? 'is-preview' : ''}`} role="status">
        <span className="status-pip" />
        <strong>{liveLabel}</strong>
        <span className="status-copy">{mode === 'preview' ? 'Illustrative data is labelled and writes are disabled' : `Reading ${CONFIG.contractId}`}</span>
        {error && <Link href="/about#limitations">Read the data limitation</Link>}
      </div>
      <main id="main-content">{children}</main>
      <footer className="site-footer">
        <span>COVAUNT / Collective decisions. Individual consent.</span>
        <span>Testnet evidence only · not a custody guarantee</span>
        <Link href="/about">Architecture and limitations</Link>
      </footer>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return <WalletProvider><DataProvider><Shell>{children}</Shell></DataProvider></WalletProvider>;
}
