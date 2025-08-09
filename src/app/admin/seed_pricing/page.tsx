import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import EditableSeedPricingGrid from '@/components/EditableSeedPricingGrid';
import HeaderBar from '@/components/HeaderBar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Seed Pricing | Admin',
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

export default async function PricingPage({
  searchParams,
}: {
  searchParams?: Promise< { seedIds?: string | string[] } >;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) redirect('/login');

  const { data: prices, error } = await supabase
    .from('costs_and_pricing')
    .select('*');

  if (error || !prices) throw new Error('Failed to load pricing data');

  const sp = (await searchParams)?.seedIds ?? null;
  const seedIds = parseSeedIds(sp);

  return (
    <div style={{ position: 'relative', padding: '1rem', textAlign: 'center' }}>
      <HeaderBar title="Seed Costs & Prices" emoji="🌻" />

      <EditableSeedPricingGrid initialPrices={prices} initialSeedIds={seedIds} />
    </div>
  );
}
