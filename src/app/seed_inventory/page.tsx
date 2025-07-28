'use client';

import { useEffect, useState } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { supabase } from '@/lib/supabaseClient';
import { Box } from '@mui/material';
import Link from 'next/link';


interface SeedInventory {
  id: number;
  seed_id: number,
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
  color: string;
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<SeedInventory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInventory = async () => {
      const { data, error } = await supabase.from('inventory').select('*');
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
    { field: 'category', headerName: 'Category', width: 130, sortable: true, editable: false },
    { field: 'type', headerName: 'Type', width: 130, sortable: true, editable: false },
    { field: 'color', headerName: 'Color', width: 130, sortable: true, editable: false },
    { field: 'amount_per_packet', headerName: 'Amount per Packet', width: 150, sortable: true, editable: true },
    { field: 'unit', headerName: 'Unit', width: 130, sortable: true, editable: true },
    { field: 'number_packets', headerName: 'Number of Packets', width: 150, sortable: true, editable: true },
    { field: 'date_received', headerName: 'Date Received', width: 180, sortable: true, editable: true },
    { field: 'shelf_life_years', headerName: 'Shelf Life (Years)', width: 130, sortable: true, editable: true },
    { field: 'expiration_date', headerName: 'Expiration Date', width: 130, sortable: true, editable: false },
    { field: 'buy_more', headerName: 'Buy More? (T/F)', width: 130, sortable: true, editable: true },
    { field: 'notes', headerName: 'Notes', width: 100, sortable: true, editable: true },
  ];

  const [searchText, setSearchText] = useState('');
  const filteredInventory = inventory.filter(
  (inv) =>
    inv.notes?.toLowerCase().includes(searchText.toLowerCase()) ||
    inv.unit?.toLowerCase().includes(searchText.toLowerCase()) ||
    inv.category?.toLowerCase().includes(searchText.toLowerCase()) ||
    inv.type?.toLowerCase().includes(searchText.toLowerCase()) ||
    inv.color?.toLowerCase().includes(searchText.toLowerCase())
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

    return newRow;
  };

  return (
    <div style={{ position: 'relative', padding: '1rem', textAlign: 'center' }}>
      <Link
        href="/"
        style={{
          position: 'absolute',
          left: '1rem',
          top: '1rem',
          transform: 'translateY(-50%)',
          color: '#1d4ed8',
          fontWeight: 'bold',
          textDecoration: 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.textDecoration = 'underline';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.textDecoration = 'none';
        }}
      >
        ← Back to Dashboard
      </Link>

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
            processRowUpdate={handleRowUpdate}
            onProcessRowUpdateError={(error) => {
              console.error('Row update error:', error);
            }}
            pageSizeOptions={[10, 25, 50]}
        />
        </div>
    </div>
  );
}
