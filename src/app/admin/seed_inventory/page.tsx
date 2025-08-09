import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import EditableInventoryGrid from '@/components/EditableInventoryGrid';
import HeaderBar from '@/components/HeaderBar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Seed Inventory | Admin',
};

export default async function InventoryPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) redirect('/login');

  const { data: inventory, error } = await supabase
    .from('inventory')
    .select('*');

  if (error || !inventory) throw new Error('Failed to load inventory');

  return (
    <div style={{ position: 'relative', padding: '1rem', textAlign: 'center' }}>
      <HeaderBar title="Seed Inventory" emoji="🌻" />

      <EditableInventoryGrid initialInventory={inventory} />
    </div>
  );
}
