import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import EditableInventoryGrid from '@/components/EditableInventoryGrid';
import BackButton from '@/components/BackButton';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Seed Inventory | Admin',
};

export default async function InventoryPage() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) redirect('/login');

  const { data: inventory, error } = await supabase
    .from('inventory')
    .select('*');

  if (error || !inventory) throw new Error('Failed to load inventory');

  return (
    <div style={{ position: 'relative', padding: '1rem', textAlign: 'center' }}>
      <BackButton />

      <h1 className="text-4xl font-bold text-green-800 tracking-wide inline-block mb-6">
        🌻 Seed Inventory
      </h1>

      <EditableInventoryGrid initialInventory={inventory} />
    </div>
  );
}
