import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import EditableSeedGrid from '@/components/EditableSeedGrid';
import type { Metadata } from "next";
import HeaderBar from '@/components/HeaderBar';

export const metadata: Metadata = {
  title: 'Seed Types | Admin',
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

export default async function SeedsPage({
  searchParams,
}: {
  searchParams?: Promise< { seedIds?: string | string[]; view?: string | string[] } >;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) redirect('/login');

  const { data: seeds, error } = await supabase.from('seeds').select('*');

  if (error || !seeds) throw new Error('Failed to load seeds');

  const { data: categoryOptions, error: categoryError } = await supabase
    .from('seeds_category_options') // your category table
    .select('id,category');

  if (categoryError || !categoryOptions) {
    console.log('Error message: ', categoryError)
    throw new Error('Failed to load categories');
  } 

  const categories = categoryOptions.map((row) => ({
    id: row.id,
    label: row.category,
  }));

  const { data: typeOptions, error: typeError } = await supabase
    .from('seeds_type_options') // your category table
    .select('id,type');

  if (typeError || !typeOptions) {
    console.log('Error message: ', typeError)
    throw new Error('Failed to load types');
  } 

  const types = typeOptions.map((row) => ({
    id: row.id,
    label: row.type,
  }));

  const { data: nameOptions, error: nameError } = await supabase
    .from('seeds_name_options') // your category table
    .select('id,name,category');

  if (nameError || !nameOptions) {
    console.log('Error message: ', nameError)
    throw new Error('Failed to load names');
  } 

  const names = nameOptions.map((row) => ({
    id: row.id,
    label: row.name,
    category: row.category
  }));

  const { data: sourceOptions, error: sourceError } = await supabase
    .from('seeds_source_options') // your category table
    .select('id,source');

  if (sourceError || !sourceOptions) {
    console.log('Error message: ', sourceError)
    throw new Error('Failed to load sources');
  } 

  const sources = sourceOptions.map((row) => ({
    id: row.id,
    label: row.source,
  }));

  const { data: sunlightOptions, error: sunlightError } = await supabase
    .from('seeds_sunlight_options') // your category table
    .select('id,sunlight');

  if (sunlightError || !sunlightOptions) {
    console.log('Error message: ', sunlightError)
    throw new Error('Failed to load sunlights');
  } 

  const sunlights = sunlightOptions.map((row) => ({
    id: row.id,
    label: row.sunlight,
  }));

  const sp = await searchParams;
  const seedIds = parseSeedIds(sp?.seedIds ?? null);

  const initialGalleryMode = !(
    (Array.isArray(sp?.view) ? sp?.view[0] : sp?.view) === 'table'
  )

  return (
    <div>
      <HeaderBar title="Seed Types" emoji="🌻" />

      <div style={{ padding: '0 1.5rem 3rem' }}>
        <EditableSeedGrid 
          initialSeeds={seeds} 
          categoryOptions={categories} 
          typeOptions={types} 
          nameOptions={names} 
          sourceOptions={sources} 
          sunlightOptions={sunlights} 
          initialSeedIds={seedIds}
          initialGalleryMode={initialGalleryMode} 
        />
      </div>
    </div>
  );
}