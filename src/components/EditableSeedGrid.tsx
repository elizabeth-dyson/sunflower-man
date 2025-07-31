'use client';

import { useState } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box } from '@mui/material';
import { createClient } from '@/lib/supabaseClient';

interface SeedType {
  id: number;
  sku: string;
  category: string;
  type: string;
  type_broad: string;
  botanical_name: string;
  source: string;
  sunlight: string;
  image_url: string;
  color: string;
}

export default function EditableSeedGrid({ initialSeeds }: { initialSeeds: SeedType[] }) {
  const supabase = createClient();

  const [seeds, setSeeds] = useState<SeedType[]>(initialSeeds);
  const [searchText, setSearchText] = useState('');

  const handleRowUpdate = async (newRow: SeedType) => {
    const updates = {
      category: newRow.category,
      type: newRow.type,
      type_broad: newRow.type_broad,
      botanical_name: newRow.botanical_name,
      source: newRow.source,
      sunlight: newRow.sunlight,
      image_url: newRow.image_url,
      color: newRow.color,
    };

    const { error } = await supabase
      .from('seeds')
      .update(updates)
      .eq('id', newRow.id);

    if (error) {
      console.error('Supabase update error:', error);
      throw error;
    }

    const updated = seeds.map((seed) =>
      seed.id === newRow.id ? { ...seed, ...updates } : seed
    );
    setSeeds(updated);

    return { ...newRow, ...updates };
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 90, editable: false },
    { field: 'sku', headerName: 'SKU', width: 130, editable: false },
    { field: 'category', headerName: 'Category', width: 150, editable: true },
    { field: 'type', headerName: 'Type', width: 130, editable: true },
    { field: 'type_broad', headerName: 'Type (Broad)', width: 150, editable: true },
    { field: 'botanical_name', headerName: 'Botanical Name', width: 180, editable: true },
    { field: 'source', headerName: 'Source', width: 130, editable: true },
    { field: 'sunlight', headerName: 'Sunlight', width: 130, editable: true },
    {
      field: 'image_url',
      headerName: 'Image',
      width: 100,
      editable: true,
      renderCell: (params) =>
        params.value ? <img src={params.value} alt="seed" style={{ height: 40 }} /> : 'N/A',
    },
    { field: 'color', headerName: 'Color', width: 100, editable: true },
  ];

  const filteredSeeds = seeds.filter((seed) =>
    [seed.type, seed.category, seed.botanical_name, seed.type_broad, seed.source, seed.sunlight, seed.color]
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
