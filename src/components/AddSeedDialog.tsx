import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { useState } from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';


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
  nameOptions: string[];
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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
          {nameOptions.map((nam) => (
            <MenuItem key={nam} value={nam}>
              {nam}
            </MenuItem>
          ))}
        </TextField>
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
