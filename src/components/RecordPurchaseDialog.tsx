'use client';

import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, MenuItem, Box
} from '@mui/material';
import { createClient } from '@/lib/supabaseClient';

type Props = {
  open: boolean;
  seedId: number | null;           // old seed id (to duplicate from)
  seedName?: string;
  onClose: () => void;
  onCreated?: (newSeedId: number) => void; // optional hook
};

export default function RecordPurchaseDialog({ open, seedId, seedName, onClose, onCreated }: Props) {
  const supabase = createClient();

  const [dateReceived, setDateReceived] = useState<string>('');
  const [amountPerPacket, setAmountPerPacket] = useState<string>('');
  const [unit, setUnit] = useState<string>('seeds');
  const [numberPackets, setNumberPackets] = useState<string>('');
  const [shelfLifeYears, setShelfLifeYears] = useState<string>('1');
  const [notes, setNotes] = useState<string>('');
  const [source, setSource] = useState<string>('Garden'); // default, will be overwritten by old seed if present
  const [seedCost, setSeedCost] = useState<string>('');   // number string
  const [retailPrice, setRetailPrice] = useState<string>(''); // number string
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    (async () => {
      // sensible default date = today
      setDateReceived(new Date().toISOString());

      // load seeds.source
      const { data: seedRow } = await supabase
        .from('seeds')
        .select('source')
        .eq('id', seedId)
        .single();

      if (seedRow?.source) setSource(seedRow.source);

      // load pricing defaults for the old seed
      const { data: pr } = await supabase
        .from('costs_and_pricing')
        .select('seed_cost, retail_price')
        .eq('seed_id', seedId)
        .maybeSingle();

      if (pr?.seed_cost != null) setSeedCost(String(pr.seed_cost));
      if (pr?.retail_price != null) setRetailPrice(String(pr.retail_price));
    })();
  }, [open, seedId, supabase]);

  async function handleCreate() {
    if (!dateReceived) return alert('Date received is required.');
    if (!unit) return alert('Unit is required.');

    setSaving(true);
    try {
      const res = await fetch('/api/record-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldSeedId: seedId,
          dateReceived,
          amountPerPacket: amountPerPacket ? Number(amountPerPacket) : null,
          unit,
          numberPackets: numberPackets ? Number(numberPackets) : null,
          shelfLifeYears: shelfLifeYears ? Number(shelfLifeYears) : null,
          notes: notes || null,
          // NEW:
          source,
          seedCost: seedCost === '' ? null : Number(seedCost),
          retailPrice: retailPrice === '' ? null : Number(retailPrice),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to create new lot');
      const newSeedId = Number(json?.seedId);
      onCreated?.(newSeedId);
      onClose();
    } catch (e:any) {
      alert(e.message || 'Failed to create new lot');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      {open && (
        <>
          <DialogTitle>Record purchase — “{seedName ?? 'Seed'}”</DialogTitle>
          <DialogContent sx={{ display:'grid', gap:2, pt:1 }}>
            <TextField
              label="Date received *"
              type="date"
              value={dateReceived ? new Date(dateReceived).toISOString().slice(0,10) : ''}
              onChange={(e) => {
                const d = e.target.value ? new Date(e.target.value+'T00:00:00Z') : null;
                setDateReceived(d ? d.toISOString() : '');
              }}
              InputLabelProps={{ shrink: true }}
            />

            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1}>
              <TextField
                label="Amount per packet"
                type="number"
                inputProps={{ step: 'any' }}
                value={amountPerPacket}
                onChange={(e) => setAmountPerPacket(e.target.value)}
              />
              <TextField
                select
                label="Unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              >
                <MenuItem value="seeds">seeds</MenuItem>
                <MenuItem value="grams">grams</MenuItem>
                <MenuItem value="oz">oz</MenuItem>
              </TextField>
            </Box>

            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1}>
              <TextField
                label="# packets"
                type="number"
                value={numberPackets}
                onChange={(e) => setNumberPackets(e.target.value)}
              />
              <TextField
                label="Shelf life (years)"
                type="number"
                value={shelfLifeYears}
                onChange={(e) => setShelfLifeYears(e.target.value)}
              />
            </Box>

            <TextField
              label="Notes"
              multiline
              minRows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            {/* NEW purchase meta */}
            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1}>
              <TextField
                select
                label="Source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              >
                <MenuItem value="Garden">Garden</MenuItem>
                <MenuItem value="Store">Store</MenuItem>
              </TextField>
              <TextField
                label="Seed cost"
                type="number"
                inputProps={{ step: '0.01', min: '0' }}
                value={seedCost}
                onChange={(e) => setSeedCost(e.target.value)}
              />
            </Box>

            <TextField
              label="Retail price"
              type="number"
              inputProps={{ step: '0.01', min: '0' }}
              value={retailPrice}
              onChange={(e) => setRetailPrice(e.target.value)}
            />
          </DialogContent>

          <DialogActions>
            <Button onClick={onClose}>Cancel</Button>
            <Button onClick={handleCreate} variant="contained" disabled={saving}>
              {saving ? 'Creating…' : 'Create new lot'}
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}