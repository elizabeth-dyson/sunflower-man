import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import EditableSeedInfoGrid from '@/components/EditableSeedInfoGrid';
import BackButton from '@/components/BackButton';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Seed Info | Admin',
};

export default async function InfoPage() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) redirect('/login');

  const { data: info, error } = await supabase
    .from('planting_info')
    .select('*');

  if (error || !info) throw new Error('Failed to load planting info');

  return (
    <div style={{ position: 'relative', padding: '1rem', textAlign: 'center' }}>
      <BackButton />

      <h1 className="text-4xl font-bold text-green-800 tracking-wide inline-block mb-6">
        🌻 Seed Planting Information
      </h1>

      <EditableSeedInfoGrid initialInfo={info} />
    </div>
  );
}
