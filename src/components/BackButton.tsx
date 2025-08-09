'use client';

import Link from 'next/link';

export default function BackButton() {
  return (
    <Link
      href="/admin"
      className="inline-flex items-center gap-1 text-blue-600 font-semibold hover:underline leading-none py-1"
    >
      ← Back to Dashboard
    </Link>
  );
}
