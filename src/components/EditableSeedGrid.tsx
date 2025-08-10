'use client';

import { useState, useEffect } from 'react';
import { DataGrid, GridColDef, GridFilterModel } from '@mui/x-data-grid';
import { createClient } from '@/lib/supabaseClient';
import AddSeedDialog from './AddSeedDialog';
import type { AddSeedForm } from './AddSeedDialog';
import {
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
  MenuItem,
  IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

type SeedType = {
  id: number;
  name: string;
  type: string;
  category: string;
  botanical_name: string;
  color: string;
  is_active: boolean;
  source: string;
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
  categoryOptions: { id: number; label: string }[];
  typeOptions: { id: number; label: string }[];
  nameOptions: { id: number; label: string; category: string }[];
  sourceOptions: { id: number; label: string }[];
  sunlightOptions: { id: number; label: string }[];
  initialSeedIds: number[];
  initialGalleryMode?: boolean;
};

type SeedImage = {
  id: number;
  seed_id: number;
  image_path: string;
  is_primary?: boolean | null;
};

export default function EditableSeedGrid({
  initialSeeds,
  categoryOptions: initialCategoryOptions,
  typeOptions: initialTypeOptions,
  nameOptions: initialNameOptions,
  sourceOptions: initialSourceOptions,
  sunlightOptions,
  initialSeedIds,
  initialGalleryMode = true,
}: Props) {
  const supabase = createClient();
  const bucket = 'seed-images';

  const [seeds, setSeeds] = useState<SeedType[]>(initialSeeds);
  const [searchText, setSearchText] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [galleryMode, setGalleryMode] = useState<boolean>(initialGalleryMode);
  const [selectedSeed, setSelectedSeed] = useState<SeedType | null>(null);
  const [editForm, setEditForm] = useState<Partial<SeedType> | null>(null);

  const [categoryOptions, setCategoryOptions] = useState(initialCategoryOptions);
  const [typeOptions, setTypeOptions] = useState(initialTypeOptions);
  const [nameOptions, setNameOptions] = useState(initialNameOptions);
  const [sourceOptions, setSourceOptions] = useState(initialSourceOptions);

  // For the modal only (not the table)
  const modalNameOptions = (editForm?.category
    ? nameOptions.filter((n) => n.category === editForm.category)
    : []
  )
    .map((n) => ({ id: n.id, label: n.label }))
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));

  // Map of seed_id -> array of images (paths)
  const [imagesMap, setImagesMap] = useState<Record<number, SeedImage[]>>({});

  const toPublicUrl = (path?: string | null) => {
    if (!path) return '';
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data?.publicUrl ?? '';
    };

  // Refresh option lists
  const refreshCategoryOptions = async () => {
    const { data, error } = await supabase.from('seeds_category_options').select('id, category');
    if (error) return console.error('Failed to refresh categories:', error.message);
    setCategoryOptions(data.map((row) => ({ id: row.id, label: row.category })));
  };

  const refreshTypeOptions = async () => {
    const { data, error } = await supabase.from('seeds_type_options').select('id, type');
    if (error) return console.error('Failed to refresh types:', error.message);
    setTypeOptions(data.map((row) => ({ id: row.id, label: row.type })));
  };

  const refreshNameOptions = async () => {
    const { data, error } = await supabase.from('seeds_name_options').select('id, name, category');
    if (error) return console.error('Failed to refresh names:', error.message);
    setNameOptions(data.map((row) => ({ id: row.id, label: row.name, category: row.category })));
  };

  const refreshSourceOptions = async () => {
    const { data, error } = await supabase.from('seeds_source_options').select('id, source');
    if (error) return console.error('Failed to refresh sources:', error.message);
    setSourceOptions(data.map((row) => ({ id: row.id, label: row.source })));
  };

  // Load images (paths)
  useEffect(() => {
    const fetchImages = async () => {
      const { data, error } = await supabase
        .from('seed_images')
        .select('id, seed_id, image_path, is_primary');

      if (error) {
        console.error('❌ Failed to fetch seed images:', error.message);
        return;
      }
      const map: Record<number, SeedImage[]> = {};
      data.forEach((img: SeedImage) => {
        if (!map[img.seed_id]) map[img.seed_id] = [];
        map[img.seed_id].push(img);
      });
      setImagesMap(map);
    };
    fetchImages();
  }, [supabase]);

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
    const { id, ...payload } = editForm;

    const { error } = await supabase.from('seeds').update(payload).eq('id', id);
    if (error) {
      console.error('🔥 Supabase update error:', error.message, error.details);
    } else {
      setSeeds((prev) => prev.map((s) => (s.id === editForm.id ? { ...s, ...payload } as SeedType : s)));
    }

    setSelectedSeed(null);
    setEditForm(null);
  };

  const handleUploadImages = async (seedId: number, files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newImages: SeedImage[] = [];

    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `seeds/${seedId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadErr } = await supabase.storage.from(bucket).upload(path, file);
      if (uploadErr) {
        console.error('❌ Upload failed:', uploadErr.message);
        continue;
      }

      const { data: inserted, error: insertErr } = await supabase
        .from('seed_images')
        .insert({ seed_id: seedId, image_path: path })
        .select('id, seed_id, image_path, is_primary')
        .single();

      if (insertErr || !inserted) {
        console.error('❌ DB insert failed:', insertErr?.message);
        continue;
      }

      newImages.push(inserted);
    }

    if (newImages.length) {
      setImagesMap((prev) => ({
        ...prev,
        [seedId]: [...(prev[seedId] || []), ...newImages],
      }));
    }
  };

  const handleDeleteImage = async (seedId: number, img: SeedImage) => {
    const { error: storageErr } = await supabase.storage.from(bucket).remove([img.image_path]);
    if (storageErr) {
      console.error('❌ Storage delete failed:', storageErr.message);
    }

    const { error: dbErr } = await supabase.from('seed_images').delete().eq('id', img.id);
    if (dbErr) {
      console.error('❌ DB delete failed:', dbErr.message);
      return;
    }

    setImagesMap((prev) => ({
      ...prev,
      [seedId]: (prev[seedId] || []).filter((i) => i.id !== img.id),
    }));
  };

  const removeAllImagesForSeed = async (seedId: number) => {
    const folder = `seeds/${seedId}`;
    const { data: files, error: listErr } = await supabase.storage.from(bucket).list(folder);
    if (listErr) {
      console.error('❌ list() failed:', listErr.message);
      return;
    }
    if (!files || files.length === 0) return;

    const paths = files.map((f) => `${folder}/${f.name}`);
    const { error: rmErr } = await supabase.storage.from(bucket).remove(paths);
    if (rmErr) console.error('❌ bulk remove failed:', rmErr.message);
  };

  const handleModalDelete = async () => {
    if (!selectedSeed) return;
    const confirmDelete = confirm('This will delete the seed and cascade to inventory and pricing. Are you sure?');
    if (!confirmDelete) return;

    const seedId = selectedSeed.id;

    const { error } = await supabase.from('seeds').delete().eq('id', seedId);
    if (error) {
      console.error('❌ Delete failed:', error.message);
      alert('Delete failed: ' + error.message);
      return;
    }

    await removeAllImagesForSeed(seedId);

    setSeeds((prev) => prev.filter((s) => s.id !== seedId));
    setSelectedSeed(null);
    setEditForm(null);
  };

  // ---------- DataGrid setup ----------
  const sortedTypeLabels = [...typeOptions]
    .map((t) => t.label)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 90, editable: false, type: 'string' },
    { field: 'sku', headerName: 'SKU', width: 130, editable: false },
    {
      field: 'category',
      headerName: 'Category',
      width: 150,
      editable: true,
      type: 'singleSelect',
      valueOptions: categoryOptions.map((c) => c.label),
    } as GridColDef<SeedType, string>,
    {
      field: 'type',
      headerName: 'Type',
      width: 130,
      editable: true,
      type: 'singleSelect',
      valueOptions: sortedTypeLabels,
    } as GridColDef<SeedType, string>,
    {
      field: 'name',
      headerName: 'Name',
      width: 150,
      editable: true,
      type: 'singleSelect',
      // 🔑 options depend on the row's category + are alphabetized
      valueOptions: ({ row }) =>
        nameOptions
          .filter((n) => n.category === row?.category)
          .map((n) => n.label)
          .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })),
    } as GridColDef<SeedType, string>,
    { field: 'botanical_name', headerName: 'Botanical Name', width: 180, editable: true },
    { field: 'color', headerName: 'Color', width: 100, editable: true },
    {
      field: 'is_active',
      headerName: 'Active?',
      width: 100,
      editable: true,
      renderCell: (params) => <input type="checkbox" checked={params.value} disabled />,
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
      valueOptions: sourceOptions.map((c) => c.label),
    } as GridColDef<SeedType, string>,
    {
      field: 'sunlight',
      headerName: 'Sunlight',
      width: 150,
      editable: true,
      type: 'singleSelect',
      valueOptions: sunlightOptions.map((s) => s.label),
    } as GridColDef<SeedType, string>,
    {
      field: 'image',
      headerName: 'Image',
      width: 100,
      editable: false,
      renderCell: (params) => {
        const firstPath = imagesMap[params.row.id]?.[0]?.image_path;
        const url = toPublicUrl(firstPath);
        return firstPath ? <img src={url} alt="seed" style={{ height: 40 }} /> : 'N/A';
      },
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
    [
      seed.type,
      seed.category,
      seed.botanical_name,
      seed.name,
      seed.source,
      seed.sunlight,
      seed.color,
      seed.plant_depth,
      seed.plant_spacing,
      seed.plant_height,
    ].some((field) => field?.toLowerCase().includes(searchText.toLowerCase()))
  );

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleConfirmDelete = (id: number) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const seedId = deleteId;
    const { error } = await supabase.from('seeds').delete().eq('id', seedId);

    if (error) {
      console.error('❌ Delete failed:', error.message);
      alert('Delete failed: ' + error.message);
    } else {
      await removeAllImagesForSeed(seedId);
      setSeeds((prev) => prev.filter((s) => s.id !== seedId));
    }

    setDeleteId(null);
    setConfirmOpen(false);
  };

  const handleAddSeed = async (values: AddSeedForm, files: File[]) => {
    // Separate date_received since it goes into seed_inventory
    const { date_received, ...seedData } = values;

    // Insert into seeds table
    const { data: insertedSeed, error: seedError } = await supabase
      .from('seeds')
      .insert(seedData)
      .select()
      .single();

    if (seedError) {
      console.error('Error inserting seed:', seedError);
      return;
    }

    // Insert into seed_inventory table
    if (date_received) {
      const { error: inventoryError } = await supabase.from('seed_inventory').insert({
        seed_id: insertedSeed.id,
        date_received,
      });

      if (inventoryError) {
        console.error('Error inserting seed inventory:', inventoryError);
      }
    }

    // Upload images
    for (const file of files) {
      const ext = file.name.split('.').pop();
      const filePath = `seeds/${insertedSeed.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file);
      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        continue;
      }

      await supabase.from('seed_images').insert({
        seed_id: insertedSeed.id,
        image_path: filePath,
      });
    }

    // Update local state
    setSeeds((prev) => [...prev, insertedSeed as SeedType]);
    setIsAddOpen(false);
  };

  const handleRowUpdate = async (newRow: SeedType) => {
    const { error } = await supabase
      .from('seeds')
      .update(newRow)
      .eq('id', newRow.id);

    if (error) {
      console.error('Error updating seed:', error);
      throw error; // let DataGrid revert
    }

    setSeeds((prev) => prev.map((row) => (row.id === newRow.id ? newRow : row)));
    return newRow;
  };

  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items: initialSeedIds.length
      ? [{ field: 'id', operator: 'isAnyOf', value: initialSeedIds.map(String) }]
      : [],
  });

  useEffect(() => {
    if (initialSeedIds.length) {
      setFilterModel({
        items: [{ field: 'id', operator: 'isAnyOf', value: initialSeedIds.map(String) }],
      });
    }
  }, [initialSeedIds]);

  return (
    <>
      {/* Controls row: LEFT toggle, CENTER search, RIGHT add */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: 2,
          mb: 3, // space below this row before the cards/table
        }}
      >
        {/* LEFT — toggle */}
        <Box sx={{ justifySelf: 'start' }}>
          <Button variant="outlined" onClick={() => setGalleryMode(!galleryMode)}>
            {galleryMode ? 'SWITCH TO TABLE VIEW' : 'SWITCH TO GALLERY VIEW'}
          </Button>
        </Box>

        {/* CENTER — search */}
        <Box sx={{ justifySelf: 'center' }}>
          <input
            type="text"
            placeholder="Search seeds..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{
              padding: '0.5rem',
              fontSize: '1rem',
              width: 360,
              borderRadius: '6px',
              border: '1px solid #ccc',
            }}
          />
        </Box>

        {/* RIGHT — add new */}
        <Box sx={{ justifySelf: 'end' }}>
          <Button variant="contained" color="primary" onClick={() => setIsAddOpen(true)}>
            ➕ ADD NEW SEED
          </Button>
        </Box>
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
        refreshCategoryOptions={refreshCategoryOptions}
        refreshTypeOptions={refreshTypeOptions}
        refreshNameOptions={refreshNameOptions}
        refreshSourceOptions={refreshSourceOptions}
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

      {/* Gallery View (no MUI Grid — no warnings) */}
      {galleryMode ? (
        <Box
          display="grid"
          gridTemplateColumns={{
            xs: 'repeat(1, 1fr)', // mobile
            sm: 'repeat(2, 1fr)', // small screens
            md: 'repeat(3, 1fr)', // medium
            lg: 'repeat(4, 1fr)', // large
          }}
          gap={8}
        >
          {filteredSeeds.map((seed) => {
            const firstPath = imagesMap[seed.id]?.[0]?.image_path;
            const imgUrl = toPublicUrl(firstPath);
            return (
              <Card key={seed.id} onClick={() => openSeedModal(seed)} sx={{ cursor: 'pointer' }}>
                <CardMedia
                  component="img"
                  image={imgUrl || '/placeholder.png'}
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
            );
          })}
        </Box>
      ) : (
        // Table View
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <DataGrid
              rows={filteredSeeds}
              columns={columns}
              getRowId={(row) => row.id}
              processRowUpdate={handleRowUpdate}
              onProcessRowUpdateError={(err) => console.error(err)}
              disableRowSelectionOnClick
              filterModel={filterModel}
              onFilterModelChange={setFilterModel}
            />
        </div>
      )}

      {/* Seed Modal */}
      <Dialog open={!!selectedSeed} onClose={() => setSelectedSeed(null)} maxWidth="md" fullWidth>
        <DialogTitle>{editForm?.name} Details</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Images section */}
          {selectedSeed && (
            <Box display="flex" flexDirection="column" gap={1}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="subtitle1">Images</Typography>
                <Button variant="outlined" component="label">
                  Upload Images
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    multiple
                    onChange={(e) => handleUploadImages(selectedSeed.id, e.target.files)}
                  />
                </Button>
              </Box>

              <Box display="flex" flexWrap="wrap" gap={1}>
                {(imagesMap[selectedSeed.id] || []).map((img) => {
                  const url = toPublicUrl(img.image_path);
                  return (
                    <Box
                      key={img.id}
                      position="relative"
                      sx={{ width: 110, height: 90, borderRadius: 1, overflow: 'hidden', border: '1px solid #ddd' }}
                    >
                      <img
                        src={url}
                        alt="Seed"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteImage(selectedSeed.id, img)}
                        sx={{
                          position: 'absolute',
                          top: 2,
                          right: 2,
                          bgcolor: 'rgba(255,255,255,0.8)',
                          '&:hover': { bgcolor: 'white' },
                        }}
                        aria-label="Delete image"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}

          {/* Dynamic form fields */}
          {editForm &&
            Object.entries(editForm).map(([key, value]) => {
              let field: React.ReactNode = null;

              if (key === 'id' || key === 'sku') {
                field = (
                  <TextField
                    name={key}
                    label={key.toUpperCase()}
                    value={value ?? ''}
                    slotProps={{ input: { disabled: true } }}
                    fullWidth
                  />
                );
              } else if (key === 'category') {
                field = (
                  <TextField
                    select
                    fullWidth
                    label="Category"
                    name="category"
                    value={editForm?.category ?? ''}
                    onChange={handleEditFieldChange}
                  >
                    {categoryOptions.map((opt) => (
                      <MenuItem key={opt.id} value={opt.label}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </TextField>
                );
              } else if (key === 'type') {
                field = (
                  <TextField
                    select
                    fullWidth
                    label="Type"
                    name="type"
                    value={editForm?.type ?? ''}
                    onChange={handleEditFieldChange}
                  >
                    {sortedTypeLabels.map((label) => (
                      <MenuItem key={label} value={label}>
                        {label}
                      </MenuItem>
                    ))}
                  </TextField>
                );
              } else if (key === 'name') {
                field = (
                  <TextField
                    select
                    fullWidth
                    label="Name"
                    name="name"
                    value={editForm?.name ?? ''}
                    onChange={handleEditFieldChange}
                  >
                    {modalNameOptions.map((opt) => (
                      <MenuItem key={opt.id} value={opt.label}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </TextField>
                );
              } else if (key === 'source') {
                field = (
                  <TextField
                    select
                    fullWidth
                    label="Source"
                    name="source"
                    value={editForm?.source ?? ''}
                    onChange={handleEditFieldChange}
                  >
                    {sourceOptions.map((opt) => (
                      <MenuItem key={opt.id} value={opt.label}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </TextField>
                );
              } else if (key === 'sunlight') {
                field = (
                  <TextField
                    select
                    fullWidth
                    label="Sunlight"
                    name="sunlight"
                    value={editForm?.sunlight ?? ''}
                    onChange={handleEditFieldChange}
                  >
                    {sunlightOptions.map((opt) => (
                      <MenuItem key={opt.id} value={opt.label}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </TextField>
                );
              } else if (key === 'is_active') {
                field = (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={Boolean(value)}
                        onChange={(e) =>
                          handleEditFieldChange({
                            target: { name: key, value: e.target.checked },
                          } as unknown as React.ChangeEvent<HTMLInputElement>)
                        }
                      />
                    }
                    label="Active?"
                  />
                );
              } else {
                field = (
                  <TextField
                    name={key}
                    label={key.replace(/_/g, ' ')}
                    value={value ?? ''}
                    onChange={handleEditFieldChange}
                    fullWidth
                  />
                );
              }

              return <div key={key}>{field}</div>;
            })}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleModalDelete} color="error">
            Delete
          </Button>
          <Button onClick={() => setSelectedSeed(null)}>Cancel</Button>
          <Button onClick={handleModalSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
