'use client';

import { useState, useEffect } from 'react';
import { DataGrid, GridColDef, GridFilterModel } from '@mui/x-data-grid';
import { Box } from '@mui/material';
import { createClient } from '@/lib/supabaseClient';

interface SeedInventory {
  id: number;
  seed_id: number;
  amount_per_packet: number;
  unit: string;
  number_packets: number;
  date_received: string;
  shelf_life_years: number;
  expiration_date: string;
  buy_more: boolean;
  notes: string;
  category: string;
  type: string;
  name: string;
  color: string;
}

export default function EditableInventoryGrid({
  initialInventory,
  initialSeedIds,
}: {
  initialInventory: SeedInventory[];
  initialSeedIds: number[];
}) {
  const supabase = createClient();
  const [inventory, setInventory] = useState<SeedInventory[]>(initialInventory);
  const [searchText, setSearchText] = useState('');

  const filteredInventory = inventory.filter((inv) =>
    [
      inv.notes,
      inv.unit,
      inv.category,
      inv.type,
      inv.name,
      inv.color,
    ]
      .join(' ')
      .toLowerCase()
      .includes(searchText.toLowerCase())
  );

  const handleRowUpdate = async (newRow: SeedInventory) => {
    const updates = {
      amount_per_packet: newRow.amount_per_packet,
      unit: newRow.unit,
      number_packets: newRow.number_packets,
      date_received: newRow.date_received,
      shelf_life_years: newRow.shelf_life_years,
      buy_more: newRow.buy_more,
      notes: newRow.notes,
    };

    const { error } = await supabase
      .from('inventory')
      .update(updates)
      .eq('id', newRow.id);

    if (error) {
      console.error('Error updating row:', error);
      throw error;
    }

    const { data: updatedRow, error: fetchError } = await supabase
      .from('inventory')
      .select('*')
      .eq('id', newRow.id)
      .single();

    if (fetchError || !updatedRow) {
      console.error('❌ Re-fetch failed:', fetchError?.message);
      return newRow; // fallback to original
    }

    // ✅ Update local state with fresh DB copy
    setInventory((prev) =>
      prev.map((s) => (s.id === updatedRow.id ? updatedRow : s))
    );

    return updatedRow;
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 90, editable: false, type: 'string' },
    { field: 'seed_id', headerName: 'Seed ID', width: 130, editable: false },
    { field: 'category', headerName: 'Category', width: 130, editable: false },
    { field: 'type', headerName: 'Type', width: 130, editable: false },
    { field: 'name', headerName: 'Name', width: 130, editable: false },
    { field: 'color', headerName: 'Color', width: 130, editable: false },
    { field: 'amount_per_packet', headerName: 'Amount per Packet', width: 150, editable: true },
    { field: 'unit', headerName: 'Unit', width: 130, editable: true },
    { field: 'number_packets', headerName: 'Number of Packets', width: 150, editable: true },
    {
      field: 'date_received',
      headerName: 'Date Received',
      width: 180,
      editable: true,
      renderCell: (params) => new Date(params.value).toLocaleDateString(),
    },
    {
      field: 'shelf_life_years',
      headerName: 'Shelf Life (Years)',
      width: 130,
      editable: true,
    },
    {
      field: 'expiration_date',
      headerName: 'Expiration Date',
      width: 130,
      editable: false,
      renderCell: (params) => new Date(params.value).toLocaleDateString(),
    },
    {
      field: 'buy_more',
      headerName: 'Buy More?',
      width: 130,
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
    { field: 'notes', headerName: 'Notes', width: 200, editable: true },
  ];

  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items: initialSeedIds.length
      ? [{ field: 'seed_id', operator: 'isAnyOf', value: initialSeedIds.map(String) }]
      : [],
  });

  useEffect(() => {
    if (initialSeedIds.length) {
      setFilterModel({
        items: [{ field: 'seed_id', operator: 'isAnyOf', value: initialSeedIds.map(String) }],
      });
    }
  }, [initialSeedIds]);

  return (
    <>
      <Box display="flex" justifyContent="center" mb={2}>
        <input
          type="text"
          placeholder="Search inventory..."
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

      <div style={{ display: 'flex', flexDirection: 'column' }}>
          <DataGrid
            rows={filteredInventory}
            columns={columns}
            getRowId={(row) => row.id}
            processRowUpdate={handleRowUpdate}
            onProcessRowUpdateError={(error) => {
              console.error('Row update error:', error);
            }}
            pageSizeOptions={[10, 25, 50]}
            filterModel={filterModel}
            onFilterModelChange={setFilterModel}
          />
      </div>
    </>
  );
}
