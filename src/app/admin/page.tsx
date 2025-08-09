'use client';

import { useRouter } from 'next/navigation';
import { useSession } from '@supabase/auth-helpers-react';
import { useEffect } from 'react';
import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton';

export default function AdminDashboard() {
  const pages = [
    { name: 'Seed Types', path: '/admin/seed_types' },
    { name: 'Seed Inventory', path: '/admin/seed_inventory' },
    { name: 'Seed Costs & Prices', path: '/admin/seed_pricing' },
  ];

  const router = useRouter();
  const session = useSession();

  useEffect(() => {
    if (!session) {
      router.push('/login');
    }
  }, [session]);

  if (!session) return null;

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <LogoutButton />
      
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
