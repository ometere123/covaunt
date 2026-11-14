import { formatNear } from '../lib/format';
import type { Summary } from '../lib/types';

export function LedgerStats({ summary }: { summary: Summary }) {
  const stats = [
    { label: 'Deposited', value: summary.total_deposited, note: 'All recorded principal' },
    { label: 'Available', value: summary.available, note: 'Still eligible for mandates' },
    { label: 'Paid', value: summary.total_paid, note: 'Settled transfer callbacks' },
    { label: 'Refunded', value: summary.total_refunded, note: 'Returned to original donors' },
  ];
  return <div className="stat-line">{stats.map((stat, index) => <div className={`stat-cell ${index === 1 ? 'stat-cell-accent' : ''}`} key={stat.label}><span>{stat.label}</span><strong>{formatNear(stat.value)} <small>Ⓝ</small></strong><em>{stat.note}</em></div>)}</div>;
}
