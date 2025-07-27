'use client';

import { useEffect, useState } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { supabase } from '@/lib/supabaseClient';
import { Box } from '@mui/material';
import { Timestamp } from 'next/dist/server/lib/cache-handlers/types';


interface SeedInventory {
  id: number;
  seed_id: number,
  amount_per_packet: number;
  unit: string;
  number_packets: number;
  date_received: Timestamp;
  shelf_life_years: number;
  expiration_date: Timestamp;
  buy_more: boolean;
  notes: string;
  seeds?: {
    category: string;
    type: string;
  };
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<SeedInventory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInventory = async () => {
        const { data, error } = await supabase
            .from('inventory')
            .select(`
                *,
                seeds (
                category,
                type
                )
            `)
      if (error) {
        console.error('Error fetching inventory:', error);
      } else {
        setInventory(data || []);
      }
      setLoading(false);
    };
    fetchInventory();
  }, []);

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 90, sortable: true, editable: false },
    { field: 'seed_id', headerName: 'Seed ID', width: 130, sortable: true, editable: false },
    {
        field: 'category',
        headerName: 'Category',
        width: 130,
        valueGetter: (params) => params.row.seeds?.category ?? 'N/A',
    },
    {
        field: 'type',
        headerName: 'Type',
        width: 130,
        valueGetter: (params) => params.row.seeds?.type ?? 'N/A',
    },
    { field: 'amount_per_packet', headerName: 'Amount per Packet', width: 150, sortable: true, editable: true },
    { field: 'unit', headerName: 'Unit', width: 130, sortable: true, editable: true },
    { field: 'number_packets', headerName: 'Number of Packets', width: 150, sortable: true, editable: true },
    { field: 'date_received', headerName: 'Date Received', width: 180, sortable: true, editable: true },
    { field: 'shelf_life_years', headerName: 'Shelf Life (Years)', width: 130, sortable: true, editable: true },
    { field: 'expiration_date', headerName: 'Expiration Date', width: 130, sortable: true, editable: true },
    { field: 'buy_more', headerName: 'Buy More? (T/F)', width: 130, sortable: true, editable: true },
    { field: 'notes', headerName: 'Notes', width: 100, sortable: true, editable: true },
  ];

    const [searchText, setSearchText] = useState('');
    const filteredInventory = inventory.filter(
    (inv) =>
        inv.notes?.toLowerCase().includes(searchText.toLowerCase()) ||
        inv.unit?.toLowerCase().includes(searchText.toLowerCase())
    );

  return (
    <div style={{ height: '100%', width: '100%', padding: '1rem' }}>
        <h1 className="text-4xl font-bold text-green-800 text-center mb-6 tracking-wide">
            🌻 Seed Inventory
        </h1>




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


        <div style={{ height: '80vh', width: '100%' }}>
        <DataGrid
            rows={filteredInventory}
            columns={columns}
            loading={loading}
            getRowId={(row) => row.id}
            pageSizeOptions={[10, 25, 50]}
        />
        </div>
    </div>
  );
}
