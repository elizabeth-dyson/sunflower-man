import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import EditableSeedPricingGrid from '@/components/EditableSeedPricingGrid';
import BackButton from '@/components/BackButton';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Seed Pricing | Admin',
};

export default async function PricingPage() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) redirect('/login');

  const { data: prices, error } = await supabase
    .from('costs_and_pricing')
    .select('*');

  if (error || !prices) throw new Error('Failed to load pricing data');

  return (
    <div style={{ position: 'relative', padding: '1rem', textAlign: 'center' }}>
      <BackButton />

      <h1 className="text-4xl font-bold text-green-800 text-center mb-6 tracking-wide">
        🌻 Seed Costs & Prices
      </h1>

      <EditableSeedPricingGrid initialPrices={prices} />
    </div>
  );
}
