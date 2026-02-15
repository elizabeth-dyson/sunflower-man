import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import EditableInventoryGrid from '@/components/EditableInventoryGrid';
import HeaderBar from '@/components/HeaderBar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Seed Inventory | Admin',
};

function parseSeedIds(sp?: string | string[] | null): number[] {
  // Normalize to a single string
  const str = Array.isArray(sp) ? sp.join(',') : sp ?? '';
  // Extract all integer substrings and convert -> number
  const matches = str.match(/\d+/g) ?? [];
  const ids = matches.map((m) => Number(m));
  // Dedup + keep only finite numbers
  return Array.from(new Set(ids)).filter((n) => Number.isFinite(n));
}

export default async function InventoryPage({
  searchParams,
}: {
  searchParams?: Promise< { seedIds?: string | string[] } >;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) redirect('/login');

  const { data: inventory, error } = await supabase
    .from('inventory')
    .select('*');

  if (error || !inventory) throw new Error('Failed to load inventory');

  const sp = (await searchParams)?.seedIds ?? null;
  const seedIds = parseSeedIds(sp);

  return (
    <div style={{ position: 'relative', maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem 3rem' }}>
      <HeaderBar title="Seed Inventory" emoji="🌻" />

      <EditableInventoryGrid initialSeedIds={seedIds} initialInventory={inventory} />
    </div>
  );
}
