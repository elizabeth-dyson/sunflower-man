'use client';

import Link from 'next/link';

export default function BackButton() {
  return (
    <Link
      href="/admin"
      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-1.5 text-sm font-medium text-text-secondary transition-all hover:border-primary hover:bg-surface-hover hover:text-primary-dark"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
      </svg>
      Dashboard
    </Link>
  );
}
