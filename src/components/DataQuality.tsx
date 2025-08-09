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
  seedId?: number;
  action?: React.ReactNode;
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

function InventoryQuickEdit({ seedId, initial, saving, onSave }: InventoryQuickEditProps) {
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
          label: `Missing pictures — "${s.name}"`
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
        issues.push({
          key: `dup-name-${norm}`,
          kind: 'Data Hygiene',
          label: `Duplicate seed name "${arr[0].name}"`,
          hint: `IDs: ${arr.map((x) => x.id).join(', ')}`
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
    // 2d) Required fields missing
    const required: (keyof Seed)[] = [
      'botanical_name',
      'source',
      'sunlight',
      'plant_depth',
      'plant_spacing',
      'days_to_germinate',
      'plant_height',
      'days_to_bloom'
    ];
    for (const s of seeds) {
      for (const f of required) {
        const v = (s as any)[f];
        if (v === null || v === undefined || (typeof v === 'string' && v.trim() === '')) {
          issues.push({
            key: `missing-${String(f)}-${s.id}`,
            kind: 'Data Hygiene',
            seedId: s.id,
            label: `Missing ${String(f).replaceAll('_', ' ')} — "${s.name}"`
          });
        }
      }
    }
    // 2e) Peppers missing scoville
    for (const s of seeds) {
      const isPepper =
        (s.type || '').toLowerCase() === 'pepper' ||
        (s.name || '').toLowerCase().includes('pepper');
      if (isPepper && (s.scoville == null || Number.isNaN(s.scoville))) {
        issues.push({
          key: `pepper-scoville-${s.id}`,
          kind: 'Data Hygiene',
          seedId: s.id,
          label: `Pepper missing Scoville — "${s.name}"`
        });
      }
    }
    // 2f) Weird SKUs (alnum-or-dash, len 6..12 without dashes)
    const skuLooksOk = (sku?: string | null) =>
      !!sku &&
      /^[A-Za-z0-9-]+$/.test(sku) &&
      (() => {
        const n = sku.replace(/-/g, '').length;
        return n >= 6 && n <= 12;
      })();
    for (const s of seeds) {
      if (!skuLooksOk(s.sku)) {
        issues.push({
          key: `sku-${s.id}`,
          kind: 'Data Hygiene',
          seedId: s.id,
          label: `Weird or missing SKU — "${s.name}"`,
          hint: s.sku ? `Current: ${s.sku}` : 'Missing'
        });
      }
    }

    // 3) Inventory Attention
    for (const s of seeds) {
      const inv = invBySeed.get(s.id);
      if (!inv) {
        issues.push({
          key: `inv-none-${s.id}`,
          kind: 'Inventory',
          seedId: s.id,
          label: `No inventory row — "${s.name}"`
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
          label: `Buy more flagged — "${s.name}"`,
          action: (
            <button
              disabled={saving === key}
              onClick={() => updateInventory(s.id, { buy_more: false }, key)}
              className="rounded-md bg-green-700 px-2 py-1 text-xs text-white hover:bg-green-800"
            >
              Mark purchased
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
          label: `No pricing row — "${s.name}"`
        });
        continue;
      }
      if (pr.retail_price == null || pr.retail_price === 0) {
        const key = `pr-retail-${s.id}`;
        issues.push({
          key,
          kind: 'Pricing & Profit',
          seedId: s.id,
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
          label: `Negative net profit — "${s.name}"`,
          hint: `Current: ${pr.net_profit.toFixed(2)}`
        });
      }
    }

    return {
      Media: issues.filter((i) => i.kind === 'Media'),
      'Data Hygiene': issues.filter((i) => i.kind === 'Data Hygiene'),
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
                    {i.seedId != null && (
                      <>
                        <Link
                          href={`/admin/seed_inventory`}
                          className="rounded-md px-2 py-1 text-xs text-green-800 hover:bg-green-50"
                          title="Open inventory grid"
                        >
                          Inventory
                        </Link>
                        <Link
                          href={`/admin/seed_pricing`}
                          className="rounded-md px-2 py-1 text-xs text-green-800 hover:bg-green-50"
                          title="Open pricing grid"
                        >
                          Pricing
                        </Link>
                        <Link
                          href={`/admin/seed_types`}
                          className="rounded-md px-2 py-1 text-xs text-green-800 hover:bg-green-50"
                          title="Open seed grid"
                        >
                          Seed
                        </Link>
                      </>
                    )}
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
          <Section title="Media" items={grouped['Media']} />
          <Section title="Data Hygiene" items={grouped['Data Hygiene']} />
          <Section title="Inventory Attention" items={grouped['Inventory']} />
          <Section title="Pricing & Profit" items={grouped['Pricing & Profit']} />
        </>
      )}
    </section>
  );
}