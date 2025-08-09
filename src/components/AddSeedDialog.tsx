import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Box,
  Typography,
  IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useState, useEffect } from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { createClient } from '@/lib/supabaseClient';

export type AddSeedForm = {
  category: string;
  type: string;
  name: string;
  botanical_name: string;
  color: string;
  is_active: boolean;
  source: string;
  date_received: string;
};

export default function AddSeedDialog({
  open,
  onClose,
  onSubmit,
  categoryOptions,
  typeOptions,
  nameOptions,
  sourceOptions,
  refreshCategoryOptions,
  refreshTypeOptions,
  refreshNameOptions,
  refreshSourceOptions,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: AddSeedForm, files: File[]) => void; // ⬅️ updated signature
  categoryOptions: { id: number; label: string }[];
  typeOptions: { id: number; label: string }[];
  nameOptions: { id: number; label: string; category: string }[];
  sourceOptions: { id: number; label: string }[];
  refreshCategoryOptions: () => Promise<void>;
  refreshTypeOptions: () => Promise<void>;
  refreshNameOptions: () => Promise<void>;
  refreshSourceOptions: () => Promise<void>;
}) {
  const initialForm: AddSeedForm = {
    category: '',
    type: '',
    name: '',
    botanical_name: '',
    color: '',
    is_active: false,
    source: '',
    date_received: new Date().toISOString(),
  };

  const [form, setForm] = useState<AddSeedForm>(initialForm);
  const [filteredNameOptions, setFilteredNameOptions] = useState<{ id: number; label: string }[]>([]);

  // NEW: hold selected files + previews
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    if (form.category) {
      const filtered = nameOptions
        .filter((n) => n.category === form.category)
        .map((n) => ({ id: n.id, label: n.label }));

      setFilteredNameOptions(filtered);
    }
  }, [form.category, nameOptions]);

  // Build/rebuild object URLs when files change
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const supabase = createClient();

  const addNewCategory = async (category: string): Promise<boolean> => {
    const { data: maxCategoryCodeRow, error: catCodeErr } = await supabase
      .from('seeds_category_options')
      .select('category_code')
      .order('category_code', { ascending: false })
      .limit(1)
      .single();

    if (catCodeErr) {
      alert('Failed to fetch max category_code: ' + catCodeErr.message);
      return false;
    }

    const nextCategoryCode = (maxCategoryCodeRow?.category_code ?? 0) + 1;

    const { data: maxBaseCodeRow, error: baseCodeErr } = await supabase
      .from('seeds_category_options')
      .select('base_name_code')
      .order('base_name_code', { ascending: false })
      .limit(1)
      .single();

    if (baseCodeErr) {
      alert('Failed to fetch max base_name_code: ' + baseCodeErr.message);
      return false;
    }

    const nextBaseNameCode = (maxBaseCodeRow?.base_name_code ?? 0) + 100;

    const { error: insertErr } = await supabase
      .from('seeds_category_options')
      .insert({
        category,
        category_code: nextCategoryCode,
        base_name_code: nextBaseNameCode,
      });

    if (insertErr) {
      alert('Failed to insert category: ' + insertErr.message);
      return false;
    }

    return true;
  };

  const addNewType = async (type: string) => {
    const { error: insertErr } = await supabase.from('seeds_type_options').insert({ type });
    if (insertErr) {
      alert('Failed to add type: ' + insertErr.message);
      return false;
    }
    return true;
  };

  const addNewName = async (name: string, category: string): Promise<boolean> => {
    if (!category) {
      alert('Category is required.');
      return false;
    }

    const { data: categoryRow, error: catErr } = await supabase
      .from('seeds_category_options')
      .select('base_name_code')
      .eq('category', category)
      .single();

    if (catErr || !categoryRow) {
      alert('Failed to get base_name_code: ' + catErr?.message);
      return false;
    }

    const baseCode = categoryRow.base_name_code;

    const { data: maxName, error: maxErr } = await supabase
      .from('seeds_name_options')
      .select('name_code')
      .eq('category', category)
      .order('name_code', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (maxErr) {
      alert('Failed to get name_code: ' + maxErr?.message);
      return false;
    }

    const nextCode = (maxName?.name_code ?? baseCode - 1) + 1;

    const { error: insertErr } = await supabase
      .from('seeds_name_options')
      .insert({ name, category, name_code: nextCode })
      .select()
      .single();

    if (insertErr) {
      alert('Failed to insert name: ' + insertErr.message);
      return false;
    }

    return true;
  };

  const addNewSource = async (source: string) => {
    const { error: insertErr } = await supabase.from('seeds_source_options').insert({ source });
    if (insertErr) {
      alert('Failed to add source: ' + insertErr.message);
      return false;
    }
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'category' ? { name: '' } : {}),
    }));

    if (name === 'category') {
      const filtered = nameOptions.filter((n) => n.category === value).map((n) => ({ id: n.id, label: n.label }));
      setFilteredNameOptions(filtered);
    }
  };

  const handleSubmit = () => {
    const requiredFields = ['category', 'type', 'name', 'source', 'date_received'];
    const missing = requiredFields.filter((field) => !form[field as keyof AddSeedForm]);

    if (missing.length > 0) {
      alert(`Missing required field(s): ${missing.join(', ')}`);
      return;
    }

    onSubmit(form, files); // ⬅️ pass images up
    onClose();
    // reset local state after closing (optional)
    setFiles([]);
    setForm(initialForm);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add New Seed</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
        {/* Category */}
        <Box display="flex" gap={1}>
          <TextField
            select
            label="Category"
            name="category"
            value={form.category}
            onChange={handleChange}
            required
            error={!form.category}
            helperText={!form.category ? 'Category is required' : ''}
          >
            {categoryOptions.map((cat) => (
              <MenuItem key={cat.id} value={cat.label}>
                {cat.label}
              </MenuItem>
            ))}
          </TextField>
          <Button
            onClick={async () => {
              const newVal = prompt('Enter new category:');
              if (!newVal) return;
              const added = await addNewCategory(newVal);
              if (added) {
                setForm((prev) => ({ ...prev, category: newVal }));
                await refreshCategoryOptions();
              }
            }}
          >
            ➕
          </Button>
        </Box>

        {/* Type */}
        <Box display="flex" gap={1}>
          <TextField
            select
            label="Type"
            name="type"
            value={form.type}
            onChange={handleChange}
            required
            error={!form.type}
            helperText={!form.type ? 'Type is required' : ''}
          >
            {[...typeOptions]
              .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }))
              .map((typ) => (
                <MenuItem key={typ.id} value={typ.label}>
                  {typ.label}
                </MenuItem>
              ))}
          </TextField>
          <Button
            onClick={async () => {
              const newVal = prompt('Enter new type:');
              if (!newVal) return;
              const added = await addNewType(newVal);
              if (added) {
                setForm((prev) => ({ ...prev, type: newVal }));
                await refreshTypeOptions();
              }
            }}
          >
            ➕
          </Button>
        </Box>

        {/* Name */}
        <Box display="flex" gap={1}>
          <TextField
            select
            label="Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            error={!form.name}
            helperText={!form.name ? 'Name is required' : ''}
          >
            {[...filteredNameOptions]
              .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }))
              .map((nam) => (
                <MenuItem key={nam.id} value={nam.label}>
                  {nam.label}
                </MenuItem>
              ))}
          </TextField>
          <Button
            onClick={async () => {
              const newVal = prompt('Enter new name:');
              if (!newVal || !form.category) return;

              const added = await addNewName(newVal, form.category);
              if (added) {
                setForm((prev) => ({ ...prev, name: newVal }));
                await refreshNameOptions();
              }
            }}
          >
            ➕
          </Button>
        </Box>

        {/* Other fields */}
        <TextField label="Botanical Name" name="botanical_name" value={form.botanical_name} onChange={handleChange} />
        <TextField label="Color" name="color" value={form.color} onChange={handleChange} />
        <FormControlLabel
          control={
            <Checkbox
              checked={form.is_active}
              onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
              name="is_active"
            />
          }
          label="Active?"
        />
        <Box display="flex" gap={1}>
          <TextField
            select
            label="Source"
            name="source"
            value={form.source}
            onChange={handleChange}
            required
            error={!form.source}
            helperText={!form.source ? 'Source is required' : ''}
          >
            {sourceOptions.map((sour) => (
              <MenuItem key={sour.id} value={sour.label}>
                {sour.label}
              </MenuItem>
            ))}
          </TextField>
          <Button
            onClick={async () => {
              const newVal = prompt('Enter new source:');
              if (!newVal) return;
              const added = await addNewSource(newVal);
              if (added) {
                setForm((prev) => ({ ...prev, source: newVal }));
                await refreshSourceOptions();
              }
            }}
          >
            ➕
          </Button>
        </Box>

        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Date Received"
            value={form.date_received ? new Date(form.date_received) : null}
            onChange={(newDate) =>
              setForm((prev) => ({
                ...prev,
                date_received: newDate ? newDate.toISOString() : '',
              }))
            }
            slotProps={{
              textField: { fullWidth: true, required: true },
            }}
          />
        </LocalizationProvider>

        {/* Images (multi-select before creating the seed) */}
        <Box mt={1} display="flex" flexDirection="column" gap={1}>
          <Typography variant="subtitle1">Images</Typography>
          <Button variant="outlined" component="label">
            Select Images
            <input
              type="file"
              hidden
              accept="image/*"
              multiple
              onChange={(e) => {
                const fl = e.target.files;
                if (!fl || fl.length === 0) return;
                setFiles((prev) => [...prev, ...Array.from(fl)]);
              }}
            />
          </Button>

          {previews.length > 0 && (
            <Box display="flex" flexWrap="wrap" gap={1}>
              {previews.map((src, idx) => (
                <Box key={idx} position="relative" sx={{ width: 110, height: 90, borderRadius: 1, overflow: 'hidden', border: '1px solid #ddd' }}>
                  <img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="preview" />
                  <IconButton
                    size="small"
                    onClick={() => {
                      setFiles((prev) => prev.filter((_, i) => i !== idx));
                    }}
                    sx={{
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      bgcolor: 'rgba(255,255,255,0.8)',
                      '&:hover': { bgcolor: 'white' },
                    }}
                    aria-label="Remove image"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit}>Submit</Button>
      </DialogActions>
    </Dialog>
  );
}
