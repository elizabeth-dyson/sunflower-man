'use client';

import { useState, useEffect } from 'react';
import { DataGrid, GridColDef, GridFilterModel } from '@mui/x-data-grid';
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
  initialSeedIds,
}: {
  initialPrices: SeedPricing[];
  initialSeedIds: number[];
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
    { field: 'id', headerName: 'ID', width: 90, editable: false, type: 'string' },
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
      <Box display="flex" justifyContent="center" mb={4}>
        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Box
            component="svg"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#7a917a"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            sx={{
              position: 'absolute',
              left: 14,
              width: 16,
              height: 16,
              pointerEvents: 'none',
            }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </Box>
          <input
            type="text"
            placeholder="Search prices..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{
              padding: '10px 16px 10px 42px',
              fontSize: '0.875rem',
              width: 380,
              borderRadius: '10px',
              border: '1px solid #d4ddd4',
              background: '#f8faf8',
              outline: 'none',
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#2e7d32';
              e.target.style.boxShadow = '0 0 0 3px rgba(46,125,50,0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#d4ddd4';
              e.target.style.boxShadow = 'none';
            }}
          />
        </Box>
      </Box>

      <div style={{ display: 'flex', flexDirection: 'column', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <DataGrid
            rows={filteredPrices}
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
