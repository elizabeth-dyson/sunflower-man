import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import EditableSeedPricingGrid from '@/components/EditableSeedPricingGrid';
import HeaderBar from '@/components/HeaderBar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Seed Pricing | Admin',
};

export default async function PricingPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) redirect('/login');

  const { data: prices, error } = await supabase
    .from('costs_and_pricing')
    .select('*');

  if (error || !prices) throw new Error('Failed to load pricing data');

  return (
    <div style={{ position: 'relative', padding: '1rem', textAlign: 'center' }}>
      <HeaderBar title="Seed Costs & Prices" emoji="🌻" />

      <EditableSeedPricingGrid initialPrices={prices} />
    </div>
  );
}
