import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import EditableSeedGrid from '@/components/EditableSeedGrid';
import BackButton from '@/components/BackButton';
import type { Metadata } from "next";

export default async function SeedsPage() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) redirect('/login');

  const metadata: Metadata = {
    title: "Seed Types | Admin",
  };

  const { data: seeds, error } = await supabase.from('seeds').select('*');

  if (error || !seeds) throw new Error('Failed to load seeds');

  return (
    <div style={{ position: 'relative', padding: '1rem', textAlign: 'center' }}>
      <BackButton />

      <h1 className="text-4xl font-bold text-green-800 tracking-wide inline-block mb-4">
        🌻 Seed Types
      </h1>

      <EditableSeedGrid initialSeeds={seeds} />
    </div>
  );
}