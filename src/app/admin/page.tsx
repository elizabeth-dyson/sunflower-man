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
    <main className="min-h-screen bg-gray-50">
      <AdminTopNav />
      <div className="mx-auto max-w-5xl px-4 pt-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-green-800">Admin Dashboard</h1>
          <LogoutButton />
        </div>
        <TaskCenter />
        <DataQuality />
      </div>
    </main>
  );
}