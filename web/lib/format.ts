export const YOCTO = BigInt(10) ** BigInt(24);

export const PURPOSES = [
  { bit: 1, label: 'Education', code: 'EDU', description: 'Scholarships, learning and access' },
  { bit: 2, label: 'Healthcare', code: 'CARE', description: 'Treatment, medical support and relief' },
  { bit: 4, label: 'Emergency relief', code: 'AID', description: 'Time-sensitive community assistance' },
  { bit: 8, label: 'Public works', code: 'CIVIC', description: 'Community infrastructure' },
  { bit: 16, label: 'Culture', code: 'ART', description: 'Arts and local heritage' },
] as const;

export function formatNear(value: string | number | bigint | undefined, decimals = 2) {
  const n = BigInt(value || 0);
  const negative = n < BigInt(0);
  const absolute = negative ? -n : n;
  const whole = absolute / YOCTO;
  const fraction = ((absolute % YOCTO).toString().padStart(24, '0')).slice(0, decimals);
  return `${negative ? '-' : ''}${whole.toLocaleString('en-US')}${decimals ? `.${fraction}` : ''}`;
}

export function formatWorkNear(value: string | number | bigint | undefined) {
  const amount = BigInt(value || 0);
  return amount > BigInt(0) && amount < YOCTO ? formatNear(amount, 7) : formatNear(amount);
}

export function parseNear(value: string) {
  const cleaned = value.trim();
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,24})?$/.test(cleaned)) {
    throw new Error('Enter a positive NEAR amount with up to 24 decimal places');
  }
  const [whole, fraction = ''] = cleaned.split('.');
  return BigInt(whole) * YOCTO + BigInt((fraction + '0'.repeat(24)).slice(0, 24));
}

export function purposeLabels(mask: number) {
  return PURPOSES.filter((purpose) => (mask & purpose.bit) !== 0).map((purpose) => purpose.label);
}

export function purposeLabel(mask: number) {
  return purposeLabels(mask).join(' + ');
}

export function shortAccount(value: string, start = 10, end = 8) {
  if (value.length <= start + end + 1) return value;
  return `${value.slice(0, start)}…${value.slice(-end)}`;
}

export function humanDate(ns: string | number | bigint | null | undefined) {
  if (!ns) return 'Not recorded';
  return new Date(Number(BigInt(ns) / BigInt(1_000_000))).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function humanDateTime(ns: string | number | bigint | null | undefined) {
  if (!ns) return 'Not recorded';
  return new Date(Number(BigInt(ns) / BigInt(1_000_000))).toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function humanDuration(ns: string | number | bigint | null | undefined) {
  if (!ns) return 'Not configured';
  const totalSeconds = BigInt(ns) / BigInt(1_000_000_000);
  const days = totalSeconds / BigInt(86_400);
  const hours = (totalSeconds % BigInt(86_400)) / BigInt(3_600);
  const minutes = (totalSeconds % BigInt(3_600)) / BigInt(60);
  const parts = [];
  if (days > BigInt(0)) parts.push(`${days} ${days === BigInt(1) ? 'day' : 'days'}`);
  if (hours > BigInt(0)) parts.push(`${hours} ${hours === BigInt(1) ? 'hour' : 'hours'}`);
  if (minutes > BigInt(0) && parts.length < 2) parts.push(`${minutes} ${minutes === BigInt(1) ? 'minute' : 'minutes'}`);
  return parts.join(', ') || '< 1 minute';
}

export function isValidAccount(value: string) {
  return value.length >= 2 && value.length <= 64 && /^(?:[a-z\d]+(?:[-_.][a-z\d]+)*)$/.test(value) && !value.includes('..');
}

export function isSinglePurpose(value: number) {
  return Number.isInteger(value) && value > 0 && value <= 16 && (value & (value - 1)) === 0;
}

export function daysUntil(ns: string) {
  const delta = Number(BigInt(ns) / BigInt(1_000_000)) - Date.now();
  return Math.ceil(delta / 86_400_000);
}

export function statusLabel(status: string) {
  return status.replace(/([a-z])([A-Z])/g, '$1 $2');
}
