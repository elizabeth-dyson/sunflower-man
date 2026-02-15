'use client';

import { useRouter } from 'next/navigation';
import { useSession } from '@supabase/auth-helpers-react';
import { useEffect } from 'react';
import LogoutButton from '@/components/LogoutButton';
import AdminTopNav from '@/components/AdminTopNav';
import TaskCenter from '@/components/TaskCenter';
import DataQuality from '@/components/DataQuality';

export default function AdminDashboard() {
  const router = useRouter();
  const session = useSession();

  useEffect(() => {
    if (!session) router.push('/login');
  }, [session, router]);

  if (!session) return null;

  return (
    <main className="min-h-screen bg-background">
      <AdminTopNav />

      <div className="mx-auto max-w-6xl px-6 pt-8 pb-16">
        {/* Page header */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary-dark">
              Admin Dashboard
            </h1>
            <p className="mt-1 text-sm text-text-muted">
              Manage your seeds, inventory, and pricing
            </p>
          </div>
          <LogoutButton />
        </div>

        {/* Task center and data quality */}
        <div className="space-y-10">
          <TaskCenter />
          <DataQuality />
        </div>
      </div>
    </main>
  );
}
