'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const nav = [
  { name: 'Seed Types', path: '/admin/seed_types' },
  { name: 'Seed Inventory', path: '/admin/seed_inventory' },
  { name: 'Seed Costs & Prices', path: '/admin/seed_pricing' },
];

export default function AdminTopNav() {
  const pathname = usePathname();
  const isHome = pathname === '/admin';

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link
          href="/admin"
          className={`flex items-center gap-2 text-lg font-bold tracking-tight transition-colors ${
            isHome ? 'text-primary-dark' : 'text-primary-dark hover:text-primary'
          }`}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white text-sm">
            🌻
          </span>
          <span>Sunflower Admin</span>
        </Link>

        <ul className="flex items-center gap-1">
          {nav.map((item) => {
            const active = pathname.startsWith(item.path);
            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    active
                      ? 'bg-primary/10 text-primary-dark shadow-sm'
                      : 'text-text-secondary hover:bg-surface-hover hover:text-primary-dark'
                  }`}
                >
                  {item.name}
                  {active && (
                    <span className="absolute bottom-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-primary" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
