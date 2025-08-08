'use client';

import { useState } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box } from '@mui/material';
import { createClient } from '@/lib/supabaseClient';

interface SeedPricing {
  id: number;
  seed_id: number;
  seed_cost: number;
  bag_cost: boolean;
  envelope_cost: boolean;
  total_cost: number;
  postage: number;
  retail_price: number;
  payment_fee: number;
  retail_price_with_postage: number;
  sales_price_total: number;
  net_profit: number;
  test_price: number;
  test_profit: number;
  seeds_per_envelope: number;
  inventory_id: number;
  test_fee: number;
  category: string;
  type: string;
  name: string;
  color: string;
}

export default function EditableSeedPricingGrid({
  initialPrices,
}: {
  initialPrices: SeedPricing[];
}) {
  const supabase = createClient();
  const [prices, setPrices] = useState<SeedPricing[]>(initialPrices);
  const [searchText, setSearchText] = useState('');

  const filteredPrices = prices.filter((price) =>
    [price.category, price.type, price.name, price.color]
      .join(' ')
      .toLowerCase()
      .includes(searchText.toLowerCase())
  );

  const handleRowUpdate = async (newRow: SeedPricing) => {
    const updates = {
      seed_cost: newRow.seed_cost,
      bag_cost: newRow.bag_cost,
      envelope_cost: newRow.envelope_cost,
      retail_price: newRow.retail_price,
      postage: newRow.postage,
      test_price: newRow.test_price,
    };

    const { error } = await supabase
      .from('costs_and_pricing')
      .update(updates)
      .eq('id', newRow.id);

    if (error) {
      console.error('Error updating row:', error);
      throw error;
    }

    const { data: updatedRow, error: fetchError } = await supabase
      .from('costs_and_pricing')
      .select('*')
      .eq('id', newRow.id)
      .single();

    if (fetchError || !updatedRow) {
      console.error('❌ Re-fetch failed:', fetchError?.message);
      return newRow; // fallback to original
    }

    // ✅ Update local state with fresh DB copy
    setPrices((prev) =>
      prev.map((s) => (s.id === updatedRow.id ? updatedRow : s))
    );

    return updatedRow;
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 90, editable: false },
    { field: 'seed_id', headerName: 'Seed ID', width: 130, editable: false },
    { field: 'inventory_id', headerName: 'Inventory ID', width: 130, editable: false },
    { field: 'category', headerName: 'Category', width: 130, editable: false },
    { field: 'type', headerName: 'Type', width: 130, editable: false },
    { field: 'name', headerName: 'Name', width: 130, editable: false},
    { field: 'color', headerName: 'Color', width: 130, editable: false },
    { field: 'seeds_per_envelope', headerName: 'Seeds/Envelope', width: 150, editable: false },
    { field: 'seed_cost', headerName: 'Seed Cost', width: 130, editable: true },
    {
      field: 'bag_cost',
      headerName: 'Bag?',
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
      field: 'envelope_cost',
      headerName: 'Envelope?',
      width: 120,
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
    { field: 'total_cost', headerName: 'Total Cost', width: 130, editable: false },
    { field: 'retail_price', headerName: 'Retail Price', width: 130, editable: true },
    { field: 'postage', headerName: 'Postage', width: 130, editable: true },
    {
      field: 'retail_price_with_postage',
      headerName: 'Retail + Postage',
      width: 150,
      editable: false,
    },
    { field: 'payment_fee', headerName: 'Payment Fee', width: 130, editable: false },
    { field: 'sales_price_total', headerName: 'Sales Total', width: 130, editable: false },
    { field: 'net_profit', headerName: 'Net Profit', width: 130, editable: false },
    { field: 'test_price', headerName: 'Test Price', width: 130, editable: true },
    { field: 'test_fee', headerName: 'Test Fee', width: 130, editable: false },
    { field: 'test_profit', headerName: 'Test Profit', width: 130, editable: false },
  ];

  return (
    <>
      <Box display="flex" justifyContent="center" mb={2}>
        <input
          type="text"
          placeholder="Search prices..."
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
          rows={filteredPrices}
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
