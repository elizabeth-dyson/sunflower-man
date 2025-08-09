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
  return (
    <nav className="w-full border-b bg-white/70 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/admin" className="text-xl font-semibold text-green-800">
          🌱 Admin
        </Link>
        <ul className="flex gap-2">
          {nav.map((item) => {
            const active = pathname.startsWith(item.path);
            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={`rounded-md px-3 py-1 text-sm font-medium ${
                    active
                      ? 'bg-green-50 text-green-800 ring-1 ring-green-200'
                      : 'text-gray-700 hover:text-green-800 hover:bg-gray-50'
                  }`}
                >
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
