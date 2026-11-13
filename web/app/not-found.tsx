import Link from 'next/link';

export default function NotFound() {
  return <div className="section-wrap data-state data-state-error"><strong>That page is not in the COVAUNT register</strong><span>Use the public navigation to return to a verified route</span><Link href="/">Return home ↗</Link></div>;
}
