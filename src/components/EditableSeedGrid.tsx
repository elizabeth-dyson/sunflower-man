'use client';

import { useState, useEffect } from 'react';
import { DataGrid, GridColDef, GridRenderEditCellParams } from '@mui/x-data-grid';
import { createClient } from '@/lib/supabaseClient';
import AddSeedDialog from './AddSeedDialog';
import type { AddSeedForm } from './AddSeedDialog';
import {
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  Box,
  Button,
  MenuItem
} from '@mui/material';


type SeedType = {
  id: number;
  name: string;
  type: string;
  category: string;
  botanical_name: string;
  color: string;
  is_active: boolean;
  source: string;
  image_url: string | null;
  sunlight: string | null;
  plant_depth: string | null;
  plant_spacing: string | null;
  plant_height: string | null;
  days_to_germinate: number;
  days_to_bloom: number;
  scoville: number;
};

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

  const [galleryMode, setGalleryMode] = useState(true);
  const [selectedSeed, setSelectedSeed] = useState<SeedType | null>(null);
  const [editForm, setEditForm] = useState<Partial<SeedType> | null>(null);

  type SeedImage = { id: string; seed_id: number; image_url: string };
  const [imagesMap, setImagesMap] = useState<Record<number, string[]>>({});

  useEffect(() => {
    const fetchImages = async () => {
      const { data, error } = await supabase.from('seed_images').select('*');
      if (error) {
        console.error('❌ Failed to fetch seed images:', error.message);
        return;
      }

      const map: Record<number, string[]> = {};
      data.forEach((img: SeedImage) => {
        if (!map[img.seed_id]) map[img.seed_id] = [];
        map[img.seed_id].push(img.image_url);
      });

      setImagesMap(map);
    };

    fetchImages();
  }, []);

  const openSeedModal = (seed: SeedType) => {
    setSelectedSeed(seed);
    setEditForm({ ...seed });
  };

  const handleEditFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editForm) return;
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleModalSave = async () => {
    if (!editForm || !editForm.id) return;
    const { error } = await supabase
      .from('seeds')
      .update(editForm)
      .eq('id', editForm.id);

    if (!error) {
      setSeeds((prev) =>
        prev.map((s) => (s.id === editForm.id ? { ...s, ...editForm } : s))
      );
    }

    setSelectedSeed(null);
    setEditForm(null);
  };

  const handleModalDelete = async () => {
    if (!selectedSeed) return;
    const confirmDelete = confirm(
      'This will delete the seed and cascade to inventory and pricing. Are you sure?'
    );
    if (!confirmDelete) return;

    const { error } = await supabase.from('seeds').delete().eq('id', selectedSeed.id);
    if (!error) {
      setSeeds((prev) => prev.filter((s) => s.id !== selectedSeed.id));
      setSelectedSeed(null);
      setEditForm(null);
    }
  };


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
    {
      field: 'actions',
      headerName: 'Actions',
      renderCell: (params) => (
        <Button color="error" onClick={() => handleConfirmDelete(params.row.id)}>
          Delete
        </Button>
      ),
      sortable: false,
      filterable: false,
      width: 100,
    },
  ];

  const filteredSeeds = seeds.filter((seed) =>
    [seed.type, seed.category, seed.botanical_name, seed.name, seed.source, seed.sunlight, seed.color, seed.plant_depth, seed.plant_spacing, seed.plant_height]
      .some((field) => field?.toLowerCase().includes(searchText.toLowerCase()))
  );

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleConfirmDelete = (id: number) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const { error } = await supabase
      .from('seeds')
      .delete()
      .eq('id', deleteId);

    if (error) {
      console.error('❌ Delete failed:', error.message);
      alert('Delete failed: ' + error.message);
    } else {
      setSeeds((prev) => prev.filter((s) => s.id !== deleteId));
    }

    setDeleteId(null);
    setConfirmOpen(false);
  };


  return (
    <>
      {/* Search + Toggle */}
      <Box display="flex" justifyContent="center" mb={2} gap={2}>
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
        <Button variant="outlined" onClick={() => setGalleryMode(!galleryMode)}>
          {galleryMode ? 'Switch to Table View' : 'Switch to Gallery View'}
        </Button>
      </Box>

      {/* Add Button */}
      <Box display="flex" justifyContent="center" mb={2}>
        <Button variant="contained" color="primary" onClick={() => setIsAddOpen(true)}>
          ➕ Add New Seed
        </Button>
      </Box>

      {/* Add Dialog */}
      <AddSeedDialog
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={handleAddSeed}
        categoryOptions={categoryOptions}
        typeOptions={typeOptions}
        nameOptions={nameOptions}
        sourceOptions={sourceOptions}
      />

      {/* Delete Confirm */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this seed? This will also delete related inventory and pricing.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Gallery View */}
      {galleryMode ? (
        <Grid container spacing={2}>
          {filteredSeeds.map((seed) => (
            // @ts-expect-error MUI types are wrong here
            <Grid 
              item xs={12} 
              sm={6} md={4} 
              lg={3} 
              key={seed.id} 
            >
              <Card onClick={() => openSeedModal(seed)} sx={{ cursor: 'pointer' }}>
                <CardMedia
                  component="img"
                  image={imagesMap[seed.id]?.[0] || '/placeholder.png'}
                  alt={seed.name}
                  sx={{
                    width: '100%',
                    height: 140,
                    objectFit: 'cover',
                    borderRadius: 1,
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.png';
                  }}
                />
                <CardContent>
                  <Typography variant="h6">{seed.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {seed.category} / {seed.type}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        // Table View
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
      )}

      {/* Seed Modal */}
      <Dialog open={!!selectedSeed} onClose={() => setSelectedSeed(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{editForm?.name} Details</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {editForm &&
            Object.entries(editForm).map(([key, value]) => (
              (() => {
                if (key === 'id' || key === 'sku') {
                  return (
                    <TextField
                      key={key}
                      name={key}
                      label={key.toUpperCase()}
                      value={value ?? ''}
                      slotProps={{
                        input: { disabled: true },
                      }}
                      fullWidth
                    />
                  );
                }

                if (key === 'category') {
                  return (
                    <TextField
                      select
                      key={key}
                      name={key}
                      label="Category"
                      value={value ?? ''}
                      onChange={ handleEditFieldChange }
                      fullWidth
                    >
                      {categoryOptions.map((opt) => (
                        <MenuItem key={opt} value={opt}>
                          {opt}
                        </MenuItem>
                      ))}
                    </TextField>
                  );
                }

                if (key === 'type') {
                  return (
                    <TextField
                      select
                      key={key}
                      name={key}
                      label="Type"
                      value={value ?? ''}
                      onChange={ handleEditFieldChange }
                      fullWidth
                    >
                      {typeOptions.map((opt) => (
                        <MenuItem key={opt} value={opt}>
                          {opt}
                        </MenuItem>
                      ))}
                    </TextField>
                  );
                }

                if (key === 'name') {
                  return (
                    <TextField
                      select
                      key={key}
                      name={key}
                      label={'Name'}
                      value={value ?? ''}
                      onChange={handleEditFieldChange}
                      fullWidth
                    >
                      {nameOptions.map((opt) => (
                        <MenuItem key={opt.name} value={opt.name}>
                          {opt.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  );
                }

                if (key === 'source') {
                  return (
                    <TextField
                      select
                      key={key}
                      name={key}
                      label={'Source'}
                      value={value ?? ''}
                      onChange={handleEditFieldChange}
                      fullWidth
                    >
                      {sourceOptions.map((opt) => (
                        <MenuItem key={opt} value={opt}>
                          {opt}
                        </MenuItem>
                      ))}
                    </TextField>
                  );
                }

                if (key === 'sunlight') {
                  return (
                    <TextField
                      select
                      key={key}
                      name={key}
                      label={'Sunlight'}
                      value={value ?? ''}
                      onChange={handleEditFieldChange}
                      fullWidth
                    >
                      {sunlightOptions.map((opt) => (
                        <MenuItem key={opt} value={opt}>
                          {opt}
                        </MenuItem>
                      ))}
                    </TextField>
                  );
                }

                if (key === 'is_active') {
                  return (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={Boolean(value)}
                          onChange={(e) =>
                            handleEditFieldChange({
                              target: {
                                name: key,
                                value: e.target.checked,
                              },
                            } as unknown as React.ChangeEvent<HTMLInputElement>)
                          }
                        />
                      }
                      label="Active?"
                    />
                  );
                }

                if (key === 'image_url') {
                  return (
                    <div>
                      {selectedSeed && (
                        <Box display="flex" flexWrap="wrap" gap={1}>
                          {(imagesMap[selectedSeed.id] || []).map((imgUrl, idx) => (
                            <img
                              key={idx}
                              src={imgUrl}
                              style={{
                                height: 80,
                                borderRadius: 4,
                                border: '1px solid #ccc',
                              }}
                            />
                          ))}
                        </Box>
                      )}
                      <Button
                        variant="outlined"
                        component="label"
                      >
                        Upload Image
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file || !selectedSeed) return;

                            const fileExt = file.name.split('.').pop();
                            const filePath = `seeds/${Date.now()}.${fileExt}`;

                            const { error: uploadError } = await supabase
                              .storage
                              .from('seed-images')
                              .upload(filePath, file);

                            if (uploadError) {
                              console.error('❌ Upload failed:', uploadError.message);
                              return;
                            }

                            const { data: publicData } = supabase
                              .storage
                              .from('seed-images')
                              .getPublicUrl(filePath);

                            const publicUrl = publicData?.publicUrl;
                            if (!publicUrl) return;

                            const { error: insertError } = await supabase
                              .from('seed_images')
                              .insert({ seed_id: selectedSeed.id, image_url: publicUrl });

                            if (insertError) {
                              console.error('❌ Insert failed:', insertError.message);
                              return;
                            }

                            // Refresh local images
                            setImagesMap((prev) => ({
                              ...prev,
                              [selectedSeed.id]: [...(prev[selectedSeed.id] || []), publicUrl],
                            }));
                          }}
                        />
                      </Button>

                      {value && typeof value === 'string' && (
                        <img
                          src={value}
                          alt="Seed"
                          style={{ marginTop: 8, maxHeight: 100, borderRadius: 4 }}
                        />
                      )}
                    </div>
                  );
                }

                return (
                  <TextField
                    key={key}
                    name={key}
                    label={key.replace(/_/g, ' ')}
                    value={value ?? ''}
                    onChange={handleEditFieldChange}
                    fullWidth
                  />
                );
              })()
            ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleModalDelete} color="error">Delete</Button>
          <Button onClick={() => setSelectedSeed(null)}>Cancel</Button>
          <Button onClick={handleModalSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
