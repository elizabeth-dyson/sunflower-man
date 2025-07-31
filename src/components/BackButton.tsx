'use client';

import Link from 'next/link';

export default function BackButton() {
  return (
    <Link
      href="/admin"
      style={{
        position: 'absolute',
        left: '1rem',
        top: '1rem',
        transform: 'translateY(-50%)',
        color: '#1d4ed8',
        fontWeight: 'bold',
        textDecoration: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.textDecoration = 'underline';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.textDecoration = 'none';
      }}
    >
      ← Back to Dashboard
    </Link>
  );
}
