// app/page.tsx
'use client';

import Link from 'next/link';

export default function AdminDashboard() {
  const pages = [
    { name: 'Seed Types', path: '/seed_types' },
    { name: 'Seed Inventory', path: '/seed_inventory' },
    { name: 'Seed Planting Information', path: '/seed_info' },
    { name: 'Seed Costs & Prices', path: '/seed_pricing' },
  ];

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <h1 className="text-4xl font-bold text-green-800 text-center mb-10">
        🌱 Admin Dashboard
      </h1>

      <div className="max-w-xl mx-auto grid gap-6">
        {pages.map((page) => (
          <Link
            key={page.path}
            href={page.path}
            className="block bg-white shadow-md hover:shadow-xl transition px-6 py-4 rounded-lg border border-gray-200 text-center text-lg font-medium text-green-700"
          >
            {page.name}
          </Link>
        ))}
      </div>
    </main>
  );
}
