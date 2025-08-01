'use client';

import { useState } from 'react';
import { DataGrid, GridColDef, GridRenderEditCellParams } from '@mui/x-data-grid';
import { Box, Button } from '@mui/material';
import { createClient } from '@/lib/supabaseClient';
import AddSeedDialog from './AddSeedDialog';
import type { AddSeedForm } from './AddSeedDialog';


interface SeedType {
  id: number;
  sku: string;
  category: string;
  type: string;
  name: string;
  botanical_name: string;
  is_active: boolean;
  source: string;
  sunlight: string | null;
  image_url: string;
  color: string;
  plant_depth: string;
  plant_spacing: string;
  days_to_germinate: number;
  plant_height: string;
  days_to_bloom: number;
  scoville: number;
}

type Props = {
  initialSeeds: SeedType[];
  categoryOptions: string[];
  typeOptions: string[];
  nameOptions: { name: string; category: string }[];
  sourceOptions: string[];
  sunlightOptions: string[];
};

export default function EditableSeedGrid({ initialSeeds, categoryOptions, typeOptions, nameOptions, sourceOptions, sunlightOptions }: Props) {
  const supabase = createClient();

  const [seeds, setSeeds] = useState<SeedType[]>(initialSeeds);
  const [searchText, setSearchText] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);


  const renderCategoryEditInputCell = (
    params: GridRenderEditCellParams<SeedType, string>
  ) => {
    // @ts-expect-error MUI valueOptions typing is borked
    const options = params.colDef.valueOptions as string[];

    return (
      <select
        value={params.value ?? ''}
        onChange={(e) =>
          params.api.setEditCellValue(
            { id: params.id, field: params.field, value: e.target.value },
            e
          )
        }
        style={{ width: '100%', height: '100%' }}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  };

  const handleRowUpdate = async (newRow: SeedType) => {
    const updates = {
      category: newRow.category,
      type: newRow.type,
      name: newRow.name,
      botanical_name: newRow.botanical_name,
      is_active: newRow.is_active,
      source: newRow.source,
      sunlight: newRow.sunlight,
      image_url: newRow.image_url,
      color: newRow.color,
      plant_depth: newRow.plant_depth,
      plant_spacing: newRow.plant_spacing,
      days_to_germinate: newRow.days_to_germinate,
      plant_height: newRow.plant_height,
      days_to_bloom: newRow.days_to_bloom,
      scoville: newRow.scoville,
    };

    const { error } = await supabase
      .from('seeds')
      .update(updates)
      .eq('id', newRow.id);

    if (error) {
      console.error('🔥 Supabase update error:', error.message, error.details);
      console.log('🔎 update payload:', updates);
      console.log('🆔 updating row ID:', newRow.id);
      throw error;
    }

    const updated = seeds.map((seed) =>
      seed.id === newRow.id ? { ...seed, ...updates } : seed
    );
    setSeeds(updated);

    return { ...newRow, ...updates };
  };

  const handleAddSeed = async (form: AddSeedForm) => {
    const { data: seed, error: seedError } = await supabase
      .from('seeds')
      .insert([
        {
          name: form.name,
          type: form.type,
          category: form.category,
          botanical_name: form.botanical_name,
          source: form.source,
          image_url: '',
          color: form.color,
          is_active: form.is_active,
          sunlight: null,
          plant_depth: '',
          plant_spacing: '',
          plant_height: '',
          days_to_germinate: 0,
          days_to_bloom: 0,
          scoville: 0,
        },
      ])
      .select()
      .single();

    if (seedError || !seed) {
      console.error('❌ Seeds insert failed:', seedError?.message);
      return;
    }

    // ✅ Insert inventory
    const { data: inventoryData, error: inventoryError } = await supabase
      .from('inventory')
      .insert([
        {
          seed_id: seed.id,
          date_received: form.date_received,
        },
      ])
      .select()
      .single();

    if (inventoryError || !inventoryData) {
      console.error('❌ Inventory insert failed:', inventoryError?.message);
      return;
    }

    // ✅ Insert pricing
    const { error: pricingError } = await supabase
      .from('costs_and_pricing')
      .insert([
        {
          seed_id: seed.id,
          inventory_id: inventoryData.id,
          seed_cost: 0,
          bag_cost: false,
          envelope_cost: true,
          postage: 0.73,
        },
      ])
      .select()
      .single();

    if (pricingError) {
      console.error('❌ Pricing insert failed:', pricingError.message);
      return;
    }

    // ✅ Update UI
    setSeeds((prev) => [...prev, seed]);
  };



  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 90, editable: false },
    { field: 'sku', headerName: 'SKU', width: 130, editable: false },
    {
      field: 'category',
      headerName: 'Category',
      width: 150,
      editable: true,
      type: 'singleSelect',
      valueOptions: categoryOptions,
      renderEditCell: renderCategoryEditInputCell,
    } as GridColDef<SeedType, string>,
    {
      field: 'type',
      headerName: 'Type',
      width: 130,
      editable: true,
      type: 'singleSelect',
      valueOptions: typeOptions,
      renderEditCell: renderCategoryEditInputCell,
    } as GridColDef<SeedType, string>,
    {
      field: 'name',
      headerName: 'Name',
      width: 150,
      editable: true,
      type: 'singleSelect',
      valueOptions: nameOptions[0],
      renderEditCell: renderCategoryEditInputCell,
    } as GridColDef<SeedType, string>,
    { field: 'botanical_name', headerName: 'Botanical Name', width: 180, editable: true },
    { field: 'color', headerName: 'Color', width: 100, editable: true },
    {
      field: 'is_active',
      headerName: 'Active?',
      width: 100,
      editable: true,
      renderCell: (params) => (
        <input type="checkbox" checked={params.value} disabled />
      ),
      renderEditCell: (params) => (
        <input
          type="checkbox"
          checked={params.value}
          onChange={(e) => {
            params.api.setEditCellValue({
              id: params.id,
              field: params.field,
              value: e.target.checked,
            });
          }}
          autoFocus
        />
      ),
    },
    {
      field: 'source',
      headerName: 'Source',
      width: 130,
      editable: true,
      type: 'singleSelect',
      valueOptions: sourceOptions,
      renderEditCell: renderCategoryEditInputCell,
    } as GridColDef<SeedType, string>,
    {
      field: 'sunlight',
      headerName: 'Sunlight',
      width: 150,
      editable: true,
      type: 'singleSelect',
      valueOptions: sunlightOptions,
      renderEditCell: renderCategoryEditInputCell,
    } as GridColDef<SeedType, string>,
    {
      field: 'image_url',
      headerName: 'Image',
      width: 100,
      editable: true,
      renderCell: (params) =>
        params.value ? <img src={params.value} alt="seed" style={{ height: 40 }} /> : 'N/A',
    },
    { field: 'plant_depth', headerName: 'Plant Depth', width: 150, editable: true },
    { field: 'plant_spacing', headerName: 'Plant Spacing', width: 130, editable: true },
    { field: 'days_to_germinate', headerName: 'Days to Germinate', width: 150, editable: true },
    { field: 'plant_height', headerName: 'Plant Height', width: 180, editable: true },
    { field: 'days_to_bloom', headerName: 'Days to Bloom', width: 130, editable: true },
    { field: 'scoville', headerName: 'Scoville', width: 130, editable: true },
  ];

  const filteredSeeds = seeds.filter((seed) =>
    [seed.type, seed.category, seed.botanical_name, seed.name, seed.source, seed.sunlight, seed.color, seed.plant_depth, seed.plant_spacing, seed.plant_height]
      .some((field) => field?.toLowerCase().includes(searchText.toLowerCase()))
  );

  return (
    <>
      <Box display="flex" justifyContent="center" mb={2}>
        <input
          type="text"
          placeholder="Search seeds..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{
            padding: '0.5rem',
            fontSize: '1rem',
            width: '300px',
            borderRadius: '4px',
            border: '1px solid #ccc',
          }}
        />
      </Box>

      <Box display="flex" justifyContent="center" mb={2}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setIsAddOpen(true)}
        >
          ➕ Add New Seed
        </Button>
      </Box>


      <AddSeedDialog
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={handleAddSeed}
        categoryOptions={categoryOptions}
        typeOptions={typeOptions}
        nameOptions={nameOptions}
        sourceOptions={sourceOptions}
      />

      <div style={{ height: '80vh', width: '100%' }}>
        <DataGrid
          rows={filteredSeeds}
          columns={columns}
          getRowId={(row) => row.id}
          processRowUpdate={handleRowUpdate}
          onProcessRowUpdateError={(err) => console.error(err)}
          disableRowSelectionOnClick
        />
      </div>
    </>
  );
}
