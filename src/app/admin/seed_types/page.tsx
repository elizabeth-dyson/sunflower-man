import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import EditableSeedGrid from '@/components/EditableSeedGrid';
import BackButton from '@/components/BackButton';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Seed Types | Admin',
};

export default async function SeedsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) redirect('/login');

  const { data: seeds, error } = await supabase.from('seeds').select('*');

  if (error || !seeds) throw new Error('Failed to load seeds');

  const { data: categoryOptions, error: categoryError } = await supabase
    .from('seeds_category_options') // your category table
    .select('category');

  if (categoryError || !categoryOptions) {
    console.log('Error message: ', categoryError)
    throw new Error('Failed to load categories');
  } 

  const categories = categoryOptions.map(c => c.category);

  const { data: typeOptions, error: typeError } = await supabase
    .from('seeds_type_options') // your category table
    .select('type');

  if (typeError || !typeOptions) {
    console.log('Error message: ', typeError)
    throw new Error('Failed to load types');
  } 

  const types = typeOptions.map(c => c.type);

  const { data: nameOptions, error: nameError } = await supabase
    .from('seeds_name_options') // your category table
    .select('name');

  if (nameError || !nameOptions) {
    console.log('Error message: ', nameError)
    throw new Error('Failed to load names');
  } 

  const names = nameOptions.map(c => c.name);

  const { data: sourceOptions, error: sourceError } = await supabase
    .from('seeds_source_options') // your category table
    .select('source');

  if (sourceError || !sourceOptions) {
    console.log('Error message: ', sourceError)
    throw new Error('Failed to load sources');
  } 

  const sources = sourceOptions.map(c => c.source);

  const { data: sunlightOptions, error: sunlightError } = await supabase
    .from('seeds_sunlight_options') // your category table
    .select('sunlight');

  if (sunlightError || !sunlightOptions) {
    console.log('Error message: ', sunlightError)
    throw new Error('Failed to load sunlights');
  } 

  const sunlights = sunlightOptions.map(c => c.sunlight);

  return (
    <div style={{ position: 'relative', padding: '1rem', textAlign: 'center' }}>
      <BackButton />

      <h1 className="text-4xl font-bold text-green-800 tracking-wide inline-block mb-4">
        🌻 Seed Types
      </h1>

      <EditableSeedGrid initialSeeds={seeds} categoryOptions={categories} typeOptions={types} nameOptions={names} sourceOptions={sources} sunlightOptions={sunlights} />
    </div>
  );
}