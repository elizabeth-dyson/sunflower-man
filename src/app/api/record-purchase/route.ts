// app/api/record-purchase/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseClient';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      oldSeedId,
      dateReceived,
      amountPerPacket,
      unit,
      numberPackets,
      shelfLifeYears,
      notes,
      // NEW
      source,
      seedCost,
      retailPrice,
    } = body;

    const supabase = await createClient();

    const { data, error } = await supabase.rpc('buy_more_duplicate_seed', {
      p_old_seed_id: oldSeedId,
      p_date_received: dateReceived,
      p_amount_per_packet: amountPerPacket,
      p_unit: unit,
      p_number_packets: numberPackets,
      p_shelf_life_years: shelfLifeYears,
      p_notes: notes,
      // NEW
      p_source: source,
      p_seed_cost: seedCost,
      p_retail_price: retailPrice,
    });

    if (error) {
      console.error('RPC error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ seedId: data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Bad request' }, { status: 400 });
  }
}