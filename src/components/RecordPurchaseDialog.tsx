'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabaseClient';

type Props = {
  open: boolean;
  seedId: number | null;
  seedName?: string;
  onClose: () => void;
  onDone?: (newSeedId: number) => void;
};

export default function RecordPurchaseDialog({ open, seedId, seedName, onClose, onDone }: Props) {
  const supabase = createClient();
  const router = useRouter();

  const [dateReceived, setDateReceived] = useState<string>('');
  const [amountPerPacket, setAmountPerPacket] = useState<string>('');
  const [unit, setUnit] = useState<string>('seeds');
  const [numberPackets, setNumberPackets] = useState<string>('');
  const [shelfLifeYears, setShelfLifeYears] = useState<string>('1');
  const [notes, setNotes] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!open) return null;

  async function submit() {
    if (!seedId) return;
    setErr(null);
    if (!dateReceived) {
      setErr('Please choose a received date.');
      return;
    }

    setSaving(true);
    const { data, error } = await supabase.rpc('buy_more_duplicate_seed', {
      p_old_seed_id: seedId,
      p_date_received: new Date(dateReceived).toISOString(),
      p_amount_per_packet: amountPerPacket ? Number(amountPerPacket) : null,
      p_unit: unit || null,
      p_number_packets: numberPackets ? Number(numberPackets) : null,
      p_shelf_life_years: shelfLifeYears ? Number(shelfLifeYears) : null,
      p_notes: notes || null,
    });

    setSaving(false);

    if (error) {
      setErr(error.message);
      return;
    }

    const newSeedId = Number(data);
    onClose();
    onDone?.(newSeedId);
    // nice deep-link to review the new lot
    router.push(`/admin/seed_inventory?seedIds=${newSeedId}`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-md bg-white p-4 shadow-lg">
        <h3 className="mb-2 text-lg font-semibold">Record purchase {seedName ? `— “${seedName}”` : ''}</h3>

        <div className="grid gap-2">
          <label className="text-sm">
            Date received *
            <input type="date" className="mt-1 w-full rounded border px-2 py-1"
              value={dateReceived} onChange={(e) => setDateReceived(e.target.value)} />
          </label>

          <div className="grid grid-cols-3 gap-2">
            <label className="text-sm col-span-2">
              Amount per packet
              <input type="number" inputMode="decimal" className="mt-1 w-full rounded border px-2 py-1"
                placeholder="e.g. 40" value={amountPerPacket}
                onChange={(e) => setAmountPerPacket(e.target.value)} />
            </label>
            <label className="text-sm">
              Unit
              <input type="text" className="mt-1 w-full rounded border px-2 py-1"
                placeholder="seeds" value={unit} onChange={(e) => setUnit(e.target.value)} />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="text-sm">
              # packets
              <input type="number" inputMode="numeric" className="mt-1 w-full rounded border px-2 py-1"
                value={numberPackets} onChange={(e) => setNumberPackets(e.target.value)} />
            </label>
            <label className="text-sm">
              Shelf life (years)
              <input type="number" inputMode="numeric" className="mt-1 w-full rounded border px-2 py-1"
                value={shelfLifeYears} onChange={(e) => setShelfLifeYears(e.target.value)} />
            </label>
          </div>

          <label className="text-sm">
            Notes
            <textarea className="mt-1 w-full rounded border px-2 py-1" rows={2}
              value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>

          {err && <p className="text-xs text-red-600">{err}</p>}
        </div>

        <div className="mt-3 flex justify-end gap-2">
          <button onClick={onClose} className="rounded border px-3 py-1 text-sm">Cancel</button>
          <button disabled={saving}
            onClick={submit}
            className="rounded bg-green-700 px-3 py-1 text-sm text-white hover:bg-green-800 disabled:opacity-60">
            {saving ? 'Saving…' : 'Create new lot'}
          </button>
        </div>
      </div>
    </div>
  );
}