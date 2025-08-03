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
  Box
} from '@mui/material';
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
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: AddSeedForm) => void;
  categoryOptions: string[];
  typeOptions: string[];
  nameOptions: { name: string; category: string }[];
  sourceOptions: string[];
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
  const [filteredNameOptions, setFilteredNameOptions] = useState<string[]>([]);

  useEffect(() => {
    if (form.category) {
      const filtered = nameOptions
        .filter((n) => n.category === form.category)
        .map((n) => n.name);

      setFilteredNameOptions(filtered);
    }
  }, [form.category, nameOptions]);

  const supabase = createClient();

  const addNewCategory = async (category: string): Promise<boolean> => {
    // Step 1: get max category_code
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

    // Step 2: get max base_name_code
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

    // Step 3: Insert with both codes
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
    console.log("🔍 addNewType called with:", type);
    const { error: insertErr } = await supabase
      .from('seeds_type_options')
      .insert({
        type,
      });

    if (insertErr) {
      alert('Failed to add type: ' + insertErr.message);
      return false;
    }

    return true;
  };

  const addNewName = async (name: string, category: string): Promise<boolean> => {
    if (!category) {
      alert("Category is required.");
      return false;
    }

    const { data: categoryRow, error: catErr } = await supabase
      .from('seeds_category_options')
      .select('base_name_code')
      .eq('category', category)
      .single();

    if (catErr || !categoryRow) {
      alert("Failed to get base_name_code: " + catErr?.message);
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
      alert("Failed to get name_code: " + maxErr?.message);
      return false;
    }

    const nextCode = (maxName?.name_code ?? baseCode - 1) + 1;

    console.log('Inserting name:', { name, category, nextCode });

    const { error: insertErr } = await supabase
      .from('seeds_name_options')
      .insert({ name, category, name_code: nextCode })
      .select()
      .single();

    if (insertErr) {
      alert("Failed to insert name: " + insertErr.message);
      return false;
    }

    return true;
  };

  const addNewSource = async (source: string) => {
    const { error: insertErr } = await supabase
      .from('seeds_source_options')
      .insert({
        source,
      });

    if (insertErr) {
      alert('Failed to add source: ' + insertErr.message);
      return false;
    }

    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Update form
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'category' ? { name: '' } : {}) // clear name if category changed
    }));

    // If category changed, filter names
    if (name === 'category') {
      const filtered = nameOptions
        .filter((n) => n.category === value)
        .map((n) => n.name);
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

    onSubmit(form);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add New Seed</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
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
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </TextField>
          <Button
            onClick={async () => {
              const newVal = prompt('Enter new category:');
              if (!newVal) return;
              const added = await addNewCategory(newVal);
              if (added) {
                // Update local state
                setForm((prev) => ({ ...prev, category: newVal }));
                categoryOptions.push(newVal); // ✅ or trigger a refresh from DB
              }
            }}
          >
            ➕
          </Button>
        </Box>
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
            {typeOptions.map((typ) => (
              <MenuItem key={typ} value={typ}>
                {typ}
              </MenuItem>
            ))}
          </TextField>
          <Button
            onClick={async () => {
              const newVal = prompt('Enter new type:');
              if (!newVal) return;
              const added = await addNewType(newVal);
              if (added) {
                // Update local state
                setForm((prev) => ({ ...prev, type: newVal }));
                typeOptions.push(newVal); // ✅ or trigger a refresh from DB
              }
            }}
          >
            ➕
          </Button>
        </Box>
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
            {filteredNameOptions.map((nam) => (
              <MenuItem key={nam} value={nam}>
                {nam}
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
                setFilteredNameOptions((prev) => [...prev, newVal]);
              }
            }}
          >
            ➕
          </Button>
        </Box>
        <TextField
          label="Botanical Name"
          name="botanical_name"
          value={form.botanical_name}
          onChange={handleChange}
        />
        <TextField
          label="Color"
          name="color"
          value={form.color}
          onChange={handleChange}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={form.is_active}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, is_active: e.target.checked }))
              }
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
              <MenuItem key={sour} value={sour}>
                {sour}
              </MenuItem>
            ))}
          </TextField>
          <Button
            onClick={async () => {
              const newVal = prompt('Enter new source:');
              if (!newVal) return;
              const added = await addNewSource(newVal);
              if (added) {
                // Update local state
                setForm((prev) => ({ ...prev, source: newVal }));
                sourceOptions.push(newVal); // ✅ or trigger a refresh from DB
              }
            }}
          >
            ➕
          </Button>
        </Box>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Date Received"
            value={form.date_received ? new Date(form.date_received) : null} // ← Type-safe
            onChange={(newDate) =>
              setForm((prev) => ({
                ...prev,
                date_received: newDate ? newDate.toISOString() : '',
              }))
            }
            slotProps={{
              textField: {
                fullWidth: true,
                required: true,
              },
            }}
          />
        </LocalizationProvider>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Submit</Button>
      </DialogActions>
    </Dialog>
  );
}
