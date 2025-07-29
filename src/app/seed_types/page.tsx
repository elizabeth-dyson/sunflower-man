'use client';

import { useEffect, useState } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { supabase } from '@/lib/supabaseClient';
import { Box } from '@mui/material';
import Link from 'next/link';


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

export default function SeedsPage() {
  const [seeds, setSeeds] = useState<SeedType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSeeds = async () => {
      const { data, error } = await supabase.from('seeds').select('*');
      if (error) {
        console.error('Error fetching seeds:', error);
      } else {
        setSeeds(data || []);
      }
      setLoading(false);
    };
    fetchSeeds();
  }, []);

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 90, sortable: true, editable: false },
    { field: 'sku', headerName: 'SKU', width: 130, sortable: true, editable: false },
    { field: 'category', headerName: 'Category', width: 150, sortable: true, editable: true },
    { field: 'type', headerName: 'Type', width: 130, sortable: true, editable: true },
    { field: 'type_broad', headerName: 'Type (Broad)', width: 150, sortable: true, editable: true },
    { field: 'botanical_name', headerName: 'Botanical Name', width: 180, sortable: true, editable: true },
    { field: 'source', headerName: 'Source', width: 130, sortable: true, editable: true },
    { field: 'sunlight', headerName: 'Sunlight', width: 130, sortable: true, editable: true },
    {
        field: 'image_url',
        headerName: 'Image',
        width: 100,
        renderCell: (params) => (
            params.value ? <img src={params.value} alt="seed" style={{ height: 40 }} /> : 'N/A'
        ),
        editable: true
    },
    { field: 'color', headerName: 'Color', width: 100, sortable: true, editable: true },
  ];

  const [searchText, setSearchText] = useState('');
  const filteredSeeds = seeds.filter(
  (seed) =>
    seed.type?.toLowerCase().includes(searchText.toLowerCase()) ||
    seed.category?.toLowerCase().includes(searchText.toLowerCase()) ||
    seed.botanical_name?.toLowerCase().includes(searchText.toLowerCase()) ||
    seed.type_broad?.toLowerCase().includes(searchText.toLowerCase()) ||
    seed.source?.toLowerCase().includes(searchText.toLowerCase()) ||
    seed.sunlight?.toLowerCase().includes(searchText.toLowerCase()) ||
    seed.color?.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleRowUpdate = async (newRow: SeedType) => {
    console.log('Updating row in Supabase:', newRow);

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

    const { error, data } = await supabase
      .from('seeds')
      .update(updates)
      .eq('id', newRow.id);

    console.log('Supabase update result:', { error, data });

    if (error) {
      console.error('Error updating row:', error);
      throw error;
    }

    setSeeds((prev) =>
      prev.map((row) => (row.id === newRow.id ? { ...row, ...updates } : row))
    );

    return { ...newRow, ...updates };
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

      <h1 className="text-4xl font-bold text-green-800 tracking-wide inline-block">
        🌻 Seed Types
      </h1>



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
