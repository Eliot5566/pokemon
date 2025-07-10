import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
} from '@mui/material';

function InventoryForm({ item, products, onSave, onCancel }) {
  const isEdit = !!item.id;
  const [form, setForm] = useState({
    product_id: item.product_id || '',
    component: item.component || '',
    stock: item.stock || '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...item, ...form }, isEdit);
  };

  return (
    <Dialog open onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? '編輯庫存' : '新增庫存'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            select
            label="產品"
            name="product_id"
            value={form.product_id}
            onChange={handleChange}
            fullWidth
            margin="normal"
          >
            {products.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.name_zh || p.name_en}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="零件"
            name="component"
            value={form.component}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="庫存"
            name="stock"
            type="number"
            value={form.stock}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onCancel}>取消</Button>
          <Button type="submit" variant="contained">
            儲存
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default InventoryForm;
