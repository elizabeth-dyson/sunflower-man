'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabaseClient';

/** ===== Types inferred from your grids ===== */
type Seed = {
  id: number;
  sku: string | null;
  name: string;
  type: string | null;
  category: string | null;
  botanical_name: string | null;
  color: string | null;
  is_active: boolean | null;
  source: string | null;
  sunlight: string | null;
  plant_depth: string | null;
  plant_spacing: string | null;
  plant_height: string | null;
  days_to_germinate: number | null;
  days_to_bloom: number | null;
  scoville: number | null;
};

type SeedImage = { id: number; seed_id: number; image_path: string };

type Inventory = {
  id: number;
  seed_id: number;
  amount_per_packet: number | null;
  unit: string | null;
  number_packets: number | null;
  date_received: string | null;
  shelf_life_years: number | null;
  expiration_date: string | null; // ISO
  buy_more: boolean | null;
  category: string | null;
  type: string | null;
  name: string | null;
  color: string | null;
};

type Pricing = {
  id: number;
  seed_id: number;
  retail_price: number | null;
  net_profit: number | null;
};

type Issue = {
  key: string;
  kind: 'Media' | 'Data Hygiene' | 'Inventory' | 'Pricing & Profit';
  label: string;
  hint?: string;
  seedId?: number;        // existing single id
  seedIds?: number[];     // NEW: multiple or single IDs
  action?: React.ReactNode;
};

type OverrideRow = {
  id: number;
  kind: string;
  key: string;
  seed_ids: number[];
  ok: boolean;
  note: string | null;
};

/** Small Levenshtein (near-duplicate finder) */
function levenshtein(a: string, b: string) {
  if (a === b) return 0;
  const m = a.length,
    n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    let prev = i - 1;
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(
        dp[j] + 1,
        dp[j - 1] + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      prev = tmp;
    }
  }
  return dp[n];
}

type InventoryQuickEditProps = {
  seedId: number;
  initial: {
    amount_per_packet: number | null;
    number_packets: number | null;
    shelf_life_years: number | null;
  };
  saving: boolean;
  onSave: (patch: {
    amount_per_packet: number | null;
    number_packets: number | null;
    shelf_life_years: number | null;
  }) => Promise<void>;
};

function InventoryQuickEdit({ initial, saving, onSave }: InventoryQuickEditProps) {
  const [amt, setAmt] = useState<string>(initial.amount_per_packet?.toString() ?? '');
  const [num, setNum] = useState<string>(initial.number_packets?.toString() ?? '');
  const [yrs, setYrs] = useState<string>(initial.shelf_life_years?.toString() ?? '');

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        inputMode="decimal"
        placeholder="amt/packet"
        className="w-24 rounded-md border px-2 py-1 text-xs"
        value={amt}
        onChange={(e) => setAmt(e.target.value)}
      />
      <input
        type="number"
        inputMode="numeric"
        placeholder="# packets"
        className="w-24 rounded-md border px-2 py-1 text-xs"
        value={num}
        onChange={(e) => setNum(e.target.value)}
      />
      <input
        type="number"
        inputMode="numeric"
        placeholder="shelf yrs"
        className="w-24 rounded-md border px-2 py-1 text-xs"
        value={yrs}
        onChange={(e) => setYrs(e.target.value)}
      />
      <button
        disabled={saving}
        onClick={() =>
          onSave({
            amount_per_packet: amt === '' ? null : Number(amt),
            number_packets: num === '' ? null : Number(num),
            shelf_life_years: yrs === '' ? null : Number(yrs),
          })
        }
        className="rounded-md bg-green-700 px-2 py-1 text-xs text-white hover:bg-green-800 disabled:opacity-60"
      >
        Save
      </button>
    </div>
  );
}

type PricingQuickEditProps = {
  initial: number | null;
  saving: boolean;
  onSave: (price: number | null) => Promise<void>;
};

function PricingQuickEdit({ initial, saving, onSave }: PricingQuickEditProps) {
  const [val, setVal] = useState<string>(initial?.toString() ?? '');
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        step="0.01"
        placeholder="$"
        className="w-24 rounded-md border px-2 py-1 text-xs"
        value={val}
        onChange={(e) => setVal(e.target.value)}
      />
      <button
        disabled={saving}
        onClick={() => onSave(val === '' ? null : Number(val))}
        className="rounded-md bg-green-700 px-2 py-1 text-xs text-white hover:bg-green-800 disabled:opacity-60"
      >
        Save
      </button>
    </div>
  );
}

export default function DataQuality() {
  const supabase = createClient();

  const [seeds, setSeeds] = useState<Seed[] | null>(null);
  const [images, setImages] = useState<SeedImage[] | null>(null);
  const [inventory, setInventory] = useState<Inventory[] | null>(null);
  const [pricing, setPricing] = useState<Pricing[] | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, OverrideRow>>({});

  /** Load all data client-side (matches how your grids fetch) */
  useEffect(() => {
    (async () => {
      setError(null);

      const [{ data: seedsData, error: e1 }, { data: imagesData, error: e2 }, { data: invData, error: e3 }, { data: priceData, error: e4 }] =
        await Promise.all([
          supabase.from('seeds').select('*').order('name', { ascending: true }),
          supabase.from('seed_images').select('id, seed_id, image_path'),
          supabase.from('inventory').select('*'),
          supabase.from('costs_and_pricing').select('id, seed_id, retail_price, net_profit')
        ]);

      if (e1 || e2 || e3 || e4) {
        setError(e1?.message || e2?.message || e3?.message || e4?.message || 'Failed to load data');
        return;
      }

      setSeeds(seedsData as Seed[]);
      setImages(imagesData as SeedImage[]);
      setInventory(invData as Inventory[]);
      setPricing(priceData as Pricing[]);
    })();
  }, [supabase]);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('data_quality_overrides')
        .select('*')
        .eq('kind', 'dup-name');
      if (error) {
        console.error('Overrides load failed:', error.message);
        return;
      }
      const map: Record<string, OverrideRow> = {};
      for (const row of (data ?? []) as OverrideRow[]) {
        map[row.key] = row;
      }
      setOverrides(map);
    })();
  }, [supabase]);

  async function toggleDupNameOk(key: string, seedIds: number[]) {
    const current = overrides[key];
    const ok = !current?.ok;
    const payload = { kind: 'dup-name', key, seed_ids: seedIds, ok };
    const { data, error } = await supabase
      .from('data_quality_overrides')
      .upsert(payload, { onConflict: 'kind,key' })
      .select('*')
      .single();
    if (error) {
      alert(error.message);
      return;
    }
    setOverrides((m) => ({ ...m, [key]: data as OverrideRow }));
  }

  /** Helpers for inline fixes */
  async function updateInventory(seedId: number, patch: Partial<Inventory>, key: string) {
    setSaving(key);
    const { error } = await supabase.from('inventory').update(patch).eq('seed_id', seedId);
    if (error) alert(error.message);
    else {
      setInventory((cur) =>
        cur?.map((r) => (r.seed_id === seedId ? { ...r, ...patch } as Inventory : r)) || null
      );
    }
    setSaving(null);
  }

  async function updatePricing(seedId: number, patch: Partial<Pricing>, key: string) {
    setSaving(key);
    const { error } = await supabase.from('costs_and_pricing').update(patch).eq('seed_id', seedId);
    if (error) alert(error.message);
    else {
      setPricing((cur) =>
        cur?.map((r) => (r.seed_id === seedId ? { ...r, ...patch } as Pricing : r)) || null
      );
    }
    setSaving(null);
  }

  // at top-level inside DataQuality component (next to updateInventory/updatePricing)
  const bucket = 'seed-images';

  async function uploadSeedImages(seedId: number, files: FileList | null) {
    if (!files || !files.length) return;
    const newImgs: SeedImage[] = [];

    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `seeds/${seedId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: upErr } = await supabase.storage.from(bucket).upload(path, file);
      if (upErr) {
        console.error('❌ Upload failed:', upErr.message);
        continue;
      }

      const { data: inserted, error: dbErr } = await supabase
        .from('seed_images')
        .insert({ seed_id: seedId, image_path: path })
        .select('id, seed_id, image_path')
        .single();

      if (!dbErr && inserted) newImgs.push(inserted as SeedImage);
    }

    if (newImgs.length) {
      // append to current images state so the “missing pictures” issue falls away on next render
      setImages((cur) => ([...(cur ?? []), ...newImgs]));
    }
  }

  async function notifyMissing(kind: 'Inventory' | 'Pricing & Profit', seed: Seed) {
    const title =
      kind === 'Inventory'
        ? `Add inventory row for "${seed.name}" (Seed ID ${seed.id})`
        : `Add pricing row for "${seed.name}" (Seed ID ${seed.id})`;

    const notes = [
      `Seed ID: ${seed.id}`,
      `Name: ${seed.name}`,
      seed.category ? `Category: ${seed.category}` : null,
      seed.type ? `Type: ${seed.type}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    await fetch('/api/notion/create-task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        notes,
        contentName: 'Admin Ops',      // or leave null / use a specific select value that exists
        priority: 'High',              // optional
        goalDate: null,                // optional
      }),
    });
  }

  function SeedFieldQuickEdit({
    seed,
    missing,
    includeSku,
    saving,
    onSave,
  }: {
    seed: Seed;
    missing: (keyof Seed)[];
    includeSku: boolean;
    saving: boolean;
    onSave: (patch: Partial<Seed>) => Promise<void>;
  }) {
    // initialize editable values only for fields we render
    const initial: Record<string, string> = {};
    for (const f of missing) initial[f] = (seed as any)[f] == null ? '' : String((seed as any)[f]);
    if (includeSku) initial.sku = seed.sku ?? '';

    const [values, setValues] = useState<Record<string, string>>(initial);

    const isPepper =
      (seed.type || '').toLowerCase() === 'pepper' ||
      (seed.name || '').toLowerCase().includes('pepper');

    // Build the field list to render:
    //  - optional SKU (only when it's weird)
    //  - all missing required fields
    //  - scoville if pepper & missing
    const renderFields: (keyof Seed | 'sku')[] = [];
    if (includeSku) renderFields.push('sku');
    renderFields.push(...missing);
    if (isPepper && (seed.scoville == null || Number.isNaN(seed.scoville))) {
      if (!renderFields.includes('scoville')) renderFields.push('scoville');
      if (!('scoville' in values)) values.scoville = '';
    }

    const label = (k: string) => k.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const isNumber = (k: string) => ['days_to_germinate', 'days_to_bloom', 'scoville'].includes(k);

    return (
      <div className="flex flex-wrap items-center gap-2">
        {renderFields.map((k) => (
          <div key={String(k)} className="flex items-center gap-1">
            <span className="text-xs text-gray-500">{label(String(k))}</span>
            <input
              type={isNumber(String(k)) ? 'number' : 'text'}
              step={isNumber(String(k)) ? '1' : undefined}
              className="w-32 rounded-md border px-2 py-1 text-xs"
              value={values[k as string] ?? ''}
              onChange={(e) => setValues((prev) => ({ ...prev, [k as string]: e.target.value }))}
            />
          </div>
        ))}

        <button
          disabled={saving}
          onClick={() => {
            const patch: Partial<Seed> = {};
            for (const [k, v] of Object.entries(values)) {
              if (isNumber(k)) (patch as any)[k] = v === '' ? null : Number(v);
              else (patch as any)[k] = v === '' ? null : v;
            }
            onSave(patch);
          }}
          className="rounded-md bg-green-700 px-2 py-1 text-xs text-white hover:bg-green-800 disabled:opacity-60"
        >
          Save
        </button>
      </div>
    );
  }

  /** Build issue lists */
  const grouped = useMemo(() => {
    const issues: Issue[] = [];
    if (!seeds || !inventory || !pricing) return { Media: [], 'Data Hygiene': [], Inventory: [], 'Pricing & Profit': [] as Issue[] };

    const imagesBySeed = new Map<number, SeedImage[]>();
    (images || []).forEach((img) => {
      imagesBySeed.set(img.seed_id, [...(imagesBySeed.get(img.seed_id) ?? []), img]);
    });

    const invBySeed = new Map<number, Inventory>();
    inventory.forEach((i) => invBySeed.set(i.seed_id, i));
    const priceBySeed = new Map<number, Pricing>();
    pricing.forEach((p) => priceBySeed.set(p.seed_id, p));

    // 1) Media — seeds missing pictures
    for (const s of seeds) {
      const has = (imagesBySeed.get(s.id) || []).length > 0;
      if (!has) {
        issues.push({
          key: `media-nopic-${s.id}`,
          kind: 'Media',
          seedId: s.id,
          seedIds: [s.id],
          label: `Missing pictures — "${s.name}"`,
          action: (
            <label className="inline-flex items-center gap-2 text-xs">
              <span className="rounded-md border px-2 py-1 cursor-pointer hover:bg-gray-50">
                Upload image(s)
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => uploadSeedImages(s.id, e.currentTarget.files)}
              />
            </label>
          ),
        });
      }
    }

    // 2) Data Hygiene
    // 2a) Duplicate names (case-insensitive), regardless of type/category
    const byName = new Map<string, Seed[]>();
    for (const s of seeds) {
      const k = (s.name || '').trim().toLowerCase();
      if (!k) continue;
      byName.set(k, [...(byName.get(k) ?? []), s]);
    }
    for (const [norm, arr] of byName) {
      if (arr.length > 1) {
        const ids = arr.map((x) => x.id);
        const ov = overrides[norm];
        // if user marked OK, we can either hide or show muted; here we show but badge it
        const key = `dup-name-${norm}`;
        issues.push({
          key,
          kind: 'Data Hygiene',
          label: `Duplicate seed name "${arr[0].name}"${ov?.ok ? ' (OK ✔)' : ''}`,
          hint: `IDs: ${ids.join(', ')}`,
          seedIds: ids,
          action: (
            <button
              onClick={() => toggleDupNameOk(norm, ids)}
              className={`rounded-md px-2 py-1 text-xs ${
                ov?.ok ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' : 'bg-amber-600 text-white hover:bg-amber-700'
              }`}
            >
              {ov?.ok ? 'Unmark OK' : 'Mark as OK'}
            </button>
          ),
        });
      }
    }
    // 2b) Near-duplicate names (distance ≤ 2)
    const normNames = Array.from(byName.keys());
    for (let i = 0; i < normNames.length; i++) {
      for (let j = i + 1; j < normNames.length; j++) {
        const a = normNames[i], b = normNames[j];
        const d = levenshtein(a, b);
        if (d > 0 && d <= 2) {
          issues.push({
            key: `near-name-${a}-${b}`,
            kind: 'Data Hygiene',
            label: `Possible near-duplicate names: "${byName.get(a)?.[0].name}" ↔ "${byName.get(b)?.[0].name}"`
          });
        }
      }
    }
    // 2c) Near-duplicate types (helps dropdown cleanliness)
    const types = [...new Set(seeds.map((s) => (s.type || '').trim().toLowerCase()).filter(Boolean))];
    for (let i = 0; i < types.length; i++) {
      for (let j = i + 1; j < types.length; j++) {
        const a = types[i], b = types[j];
        const d = levenshtein(a, b);
        if (d > 0 && d <= 2) {
          issues.push({
            key: `near-type-${a}-${b}`,
            kind: 'Data Hygiene',
            label: `Possible near-duplicate types: "${a}" ↔ "${b}"`
          });
        }
      }
    }
    // 2d–f) Collapsed missing fields per seed (with optional SKU + scoville)
    const required: (keyof Seed)[] = [
      'botanical_name',
      'source',
      'sunlight',
      'plant_depth',
      'plant_spacing',
      'days_to_germinate',
      'plant_height',
      'days_to_bloom',
    ];

    const skuLooksOk = (sku?: string | null) =>
      !!sku &&
      /^[A-Za-z0-9-]+$/.test(sku) &&
      (() => {
        const n = sku.replace(/-/g, '').length;
        return n == 9;
      })();

    for (const s of seeds) {
      // gather missing required fields for this seed
      const missing: (keyof Seed)[] = [];
      for (const f of required) {
        const v = (s as Seed)[f];
        if (v == null || (typeof v === 'string' && v.trim() === '')) missing.push(f);
      }

      // determine if SKU is weird/missing
      const skuWeird = !skuLooksOk(s.sku);

      // determine if scoville is missing for peppers (we add it in the editor, not as a separate line)
      const isPepper =
        (s.type || '').toLowerCase() === 'pepper' ||
        (s.name || '').toLowerCase().includes('pepper');
      const scovilleMissing = isPepper && (s.scoville == null || Number.isNaN(s.scoville));

      // if nothing to fix, skip
      if (!missing.length && !skuWeird && !scovilleMissing) continue;

      const key = `seed-missing-${s.id}`;

      // Build a helpful hint text
      const hints: string[] = [];
      if (missing.length) hints.push(`Missing: ${missing.map((m) => String(m).replaceAll('_', ' ')).join(', ')}`);
      if (skuWeird) hints.push(`SKU looks off`);
      if (scovilleMissing) hints.push('Scoville required for peppers');

      issues.push({
        key,
        kind: 'Data Hygiene',
        seedId: s.id,
        seedIds: [s.id],
        label: `Missing/invalid fields — "${s.name}"`,
        hint: hints.join(' • '),
        action: (
          <SeedFieldQuickEdit
            seed={s}
            missing={missing}
            includeSku={skuWeird}            // 👈 only show SKU when it's weird
            saving={saving === key}
            onSave={async (patch) => {
              setSaving(key);
              const { error } = await supabase.from('seeds').update(patch).eq('id', s.id);
              if (error) alert(error.message);
              else {
                setSeeds((cur) =>
                  cur?.map((row) => (row.id === s.id ? { ...row, ...patch } as Seed : row)) || null
                );
              }
              setSaving(null);
            }}
          />
        ),
      });
    }

    // 3) Inventory Attention
    for (const s of seeds) {
      const inv = invBySeed.get(s.id);
      if (!inv) {
        issues.push({
          key: `inv-none-${s.id}`,
          kind: 'Inventory',
          seedId: s.id,
          seedIds: [s.id],
          label: `No inventory row — "${s.name}"`,
          action: (
            <button
              onClick={() => notifyMissing('Inventory', s)}
              className="rounded-md bg-amber-600 px-2 py-1 text-xs text-white hover:bg-amber-700"
            >
              Notify
            </button>
          ),
        });
        continue;
      }
      if (inv.amount_per_packet == null || inv.number_packets == null || inv.shelf_life_years == null) {
        // inside the Inventory checks where fields are missing
        const key = `inv-fill-${s.id}`;

        issues.push({
          key,
          kind: 'Inventory',
          seedId: s.id,
          seedIds: [s.id],
          label: `Inventory fields missing — "${s.name}"`,
          action: (
            <InventoryQuickEdit
            seedId={s.id}
            initial={{
              amount_per_packet: inv.amount_per_packet,
              number_packets: inv.number_packets,
              shelf_life_years: inv.shelf_life_years,
            }}
            saving={saving === key}
            onSave={async (patch) => {
              await updateInventory(s.id, patch, key);
            }}
            />
          ),
        });
      }
      if (inv.expiration_date) {
        const expired = new Date(inv.expiration_date) < new Date();
        if (expired) {
          const key = `inv-expired-${s.id}`;
          issues.push({
            key,
            kind: 'Inventory',
            seedId: s.id,
            seedIds: [s.id],
            label: `Expired inventory — "${s.name}"`,
            hint: `Expired on ${new Date(inv.expiration_date).toLocaleDateString()}`,
            action: (
              <button
                disabled={saving === key}
                onClick={() => updateInventory(s.id, { expiration_date: null }, key)}
                className="rounded-md border px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
              >
                Clear date
              </button>
            )
          });
        }
      }
      if (inv.buy_more) {
        const key = `inv-buymore-${s.id}`;
        issues.push({
          key,
          kind: 'Inventory',
          seedId: s.id,
          seedIds: [s.id],
          label: `Buy more flagged — "${s.name}"`,
          action: (
            <button
              disabled={saving === key}
              onClick={() => updateInventory(s.id, { buy_more: false }, key)}
              className="rounded-md bg-green-700 px-2 py-1 text-xs text-white hover:bg-green-800"
            >
              Record Purchase
            </button>
          )
        });
      }
    }

    // 4) Pricing & Profit
    for (const s of seeds) {
      const pr = priceBySeed.get(s.id);
      if (!pr) {
        issues.push({
          key: `pr-none-${s.id}`,
          kind: 'Pricing & Profit',
          seedId: s.id,
          seedIds: [s.id],
          label: `No pricing row — "${s.name}"`,
          action: (
            <button
              onClick={() => notifyMissing('Pricing & Profit', s)}
              className="rounded-md bg-amber-600 px-2 py-1 text-xs text-white hover:bg-amber-700"
            >
              Notify
            </button>
          ),
        });
        continue;
      }
      if (pr.retail_price == null || pr.retail_price === 0) {
        const key = `pr-retail-${s.id}`;
        issues.push({
          key,
          kind: 'Pricing & Profit',
          seedId: s.id,
          seedIds: [s.id],
          label: `Retail price missing/0 — "${s.name}"`,
          action: (
            <PricingQuickEdit
              initial={pr.retail_price}
              saving={saving === key}
              onSave={async (price) => {
                await updatePricing(s.id, { retail_price: price }, key);
              }}
            />
          ),
        });
      }
      if (pr.net_profit != null && pr.net_profit < 0) {
        issues.push({
          key: `pr-negative-${s.id}`,
          kind: 'Pricing & Profit',
          seedId: s.id,
          seedIds: [s.id],
          label: `Negative net profit — "${s.name}"`,
          hint: `Current: ${pr.net_profit.toFixed(2)}`
        });
      }
    }

    return {
      'Data Hygiene': issues.filter((i) => i.kind === 'Data Hygiene'),
      Media: issues.filter((i) => i.kind === 'Media'),
      Inventory: issues.filter((i) => i.kind === 'Inventory'),
      'Pricing & Profit': issues.filter((i) => i.kind === 'Pricing & Profit')
    };
  }, [seeds, images, inventory, pricing, saving, supabase]);

  function Section({
    title,
    items,
    defaultLimit = 10,
  }: {
    title: string;
    items: Issue[];
    defaultLimit?: number;
  }) {
    const [expanded, setExpanded] = useState(false);

    const visible = expanded ? items : items.slice(0, defaultLimit);
    const hiddenCount = Math.max(items.length - visible.length, 0);

    function buildUrl(
      base: string,
      ids?: number[] | null,
      extra?: Record<string, string | number | boolean | null | undefined>
    ) {
      const qs = new URLSearchParams();

      if (ids && ids.length) qs.set('seedIds', ids.join(','));

      if (extra) {
        // special-case: map viewType (Issue.kind) -> view ('gallery'|'table')
        if ('viewType' in extra) {
          const k = String(extra.viewType);
          const view = k === 'Media' ? 'gallery' : 'table';
          qs.set('view', view);
          // remove so we don't also set ?viewType=Media
          const { viewType, ...rest } = extra as any;
          for (const [rk, rv] of Object.entries(rest)) {
            if (rv !== undefined && rv !== null && rv !== '') qs.set(rk, String(rv));
          }
        } else {
          for (const [k, v] of Object.entries(extra)) {
            if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
          }
        }
      }

      const suffix = qs.toString();
      return suffix ? `${base}?${suffix}` : base;
    }

    return (
      <div className="rounded-lg border bg-white">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <h3 className="text-base font-semibold">{title}</h3>
          <span className="text-xs text-gray-500">
            {items.length} item{items.length === 1 ? '' : 's'}
          </span>
        </div>

        {items.length === 0 ? (
          <div className="px-4 py-3 text-sm text-gray-500">No issues 🎉</div>
        ) : (
          <>
            <ul className="divide-y">
              {visible.map((i) => (
                <li key={i.key} className="flex items-center justify-between gap-3 px-4 py-2">
                  <div className="min-w-0">
                    <div className="text-sm text-gray-800">{i.label}</div>
                    {i.hint && <div className="text-xs text-gray-500">{i.hint}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Deep-links with filters */}
                    <a
                      href={buildUrl('/admin/seed_types', i.seedIds, { viewType: i.kind })}
                      className="rounded-md px-2 py-1 text-xs text-green-800 hover:bg-green-50"
                      title="Open seeds filtered to these seeds"
                    >
                      Seed
                    </a>
                    <a
                      href={buildUrl('/admin/seed_inventory', i.seedIds)}
                      className="rounded-md px-2 py-1 text-xs text-green-800 hover:bg-green-50"
                      title="Open inventory filtered to these seeds"
                    >
                      Inventory
                    </a>
                    <a
                      href={buildUrl('/admin/seed_pricing', i.seedIds)}
                      className="rounded-md px-2 py-1 text-xs text-green-800 hover:bg-green-50"
                      title="Open pricing filtered to these seeds"
                    >
                      Pricing
                    </a>
                    {i.action}
                  </div>
                </li>
              ))}
            </ul>

            {(hiddenCount > 0 || expanded) && (
              <div className="px-4 py-2">
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="text-xs text-green-800 hover:underline"
                >
                  {expanded ? 'Show less' : `Show more (${hiddenCount})`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <section className="grid gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-amber-900">Data Quality</h2>
        {error && <span className="text-xs text-red-700">Error: {error}</span>}
      </div>

      {!seeds && !error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Loading checks…
        </div>
      )}

      {seeds && (
        <>
          <Section title="Data Hygiene" items={grouped['Data Hygiene']} />
          <Section title="Media" items={grouped['Media']} />
          <Section title="Inventory Attention" items={grouped['Inventory']} />
          <Section title="Pricing & Profit" items={grouped['Pricing & Profit']} />
        </>
      )}
    </section>
  );
}