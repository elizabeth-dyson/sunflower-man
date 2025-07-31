'use client';

import { useState } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box } from '@mui/material';
import { createClient } from '@/lib/supabaseClient';

interface SeedInfo {
  id: number;
  seed_id: number;
  plant_depth: string;
  plant_spacing: string;
  days_to_germinate: number;
  plant_height: string;
  days_to_bloom: number;
  scoville: number;
  category: string;
  type: string;
  color: string;
}

export default function EditableSeedInfoGrid({
  initialInfo,
}: {
  initialInfo: SeedInfo[];
}) {
  const supabase = createClient();
  const [info, setInfo] = useState<SeedInfo[]>(initialInfo);
  const [searchText, setSearchText] = useState('');

  const filteredInfo = info.filter((entry) =>
    [entry.category, entry.type, entry.color]
      .join(' ')
      .toLowerCase()
      .includes(searchText.toLowerCase())
  );

  const handleRowUpdate = async (newRow: SeedInfo) => {
    const updates = {
      plant_depth: newRow.plant_depth,
      plant_spacing: newRow.plant_spacing,
      days_to_germinate: newRow.days_to_germinate,
      plant_height: newRow.plant_height,
      days_to_bloom: newRow.days_to_bloom,
      scoville: newRow.scoville,
    };

    const { error } = await supabase
      .from('planting_info')
      .update(updates)
      .eq('id', newRow.id);

    if (error) {
      console.error('Error updating row:', error);
      throw error;
    }

    setInfo((prev) =>
      prev.map((item) => (item.id === newRow.id ? { ...item, ...updates } : item))
    );

    return { ...newRow, ...updates };
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 90, editable: false },
    { field: 'seed_id', headerName: 'Seed ID', width: 130, editable: false },
    { field: 'category', headerName: 'Category', width: 130, editable: false },
    { field: 'type', headerName: 'Type', width: 130, editable: false },
    { field: 'color', headerName: 'Color', width: 130, editable: false },
    { field: 'plant_depth', headerName: 'Plant Depth', width: 150, editable: true },
    { field: 'plant_spacing', headerName: 'Plant Spacing', width: 130, editable: true },
    { field: 'days_to_germinate', headerName: 'Days to Germinate', width: 150, editable: true },
    { field: 'plant_height', headerName: 'Plant Height', width: 180, editable: true },
    { field: 'days_to_bloom', headerName: 'Days to Bloom', width: 130, editable: true },
    { field: 'scoville', headerName: 'Scoville', width: 130, editable: true },
  ];

  return (
    <>
      <Box display="flex" justifyContent="center" mb={2}>
        <input
          type="text"
          placeholder="Search info..."
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
          rows={filteredInfo}
          columns={columns}
          getRowId={(row) => row.id}
          processRowUpdate={handleRowUpdate}
          onProcessRowUpdateError={(error) => {
            console.error('Row update error:', error);
          }}
          pageSizeOptions={[10, 25, 50]}
        />
      </div>
    </>
  );
}
