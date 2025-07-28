'use client';

import { useEffect, useState } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { supabase } from '@/lib/supabaseClient';
import { Box } from '@mui/material';
import Link from 'next/link';


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

export default function InfoPage() {
  const [info, setInfo] = useState<SeedInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInfo = async () => {
      const { data, error } = await supabase.from('planting_info').select('*');
      if (error) {
        console.error('Error fetching info:', error);
      } else {
        setInfo(data || []);
      }
      setLoading(false);
    };
    fetchInfo();
  }, []);

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 90, sortable: true, editable: false },
    { field: 'seed_id', headerName: 'Seed ID', width: 130, sortable: true, editable: false },
    { field: 'category', headerName: 'Category', width: 130, sortable: true, editable: false },
    { field: 'type', headerName: 'Type', width: 130, sortable: true, editable: false },
    { field: 'color', headerName: 'Color', width: 130, sortable: true, editable: false },
    { field: 'plant_depth', headerName: 'Plant Depth', width: 150, sortable: true, editable: true },
    { field: 'plant_spacing', headerName: 'Plant Spacing', width: 130, sortable: true, editable: true },
    { field: 'days_to_germinate', headerName: 'Days to Germinate', width: 150, sortable: true, editable: true },
    { field: 'plant_height', headerName: 'Plant Height', width: 180, sortable: true, editable: true },
    { field: 'days_to_bloom', headerName: 'Days to Bloom', width: 130, sortable: true, editable: true },
    { field: 'scoville', headerName: 'Scoville', width: 130, sortable: true, editable: true },
  ];

  const [searchText, setSearchText] = useState('');
  const filteredInfo = info.filter(
  (infos) =>
    infos.category?.toLowerCase().includes(searchText.toLowerCase()) ||
    infos.type?.toLowerCase().includes(searchText.toLowerCase()) ||
    infos.color?.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleRowUpdate = async (newRow: any, oldRow: any) => {
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
            🌻 Seed Planting Information
        </h1>




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
