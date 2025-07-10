import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  Box,
} from '@mui/material';

function SalesForm({ sale, products, onSave, onCancel }) {
  const isEdit = !!sale.id;
  const [form, setForm] = useState({
    date: sale.date || '',
    customer: sale.customer || '',
    product_id: sale.product_id || '',
    quantity: sale.quantity || '',
    price: sale.price || '',
    status: sale.status || '',
    package_cost: sale.package_cost || '',
    shipping_cost: sale.shipping_cost || '',
    maker: sale.maker || '',
    ratio: sale.ratio || '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...sale, ...form }, isEdit);
  };

  return (
    <Dialog open onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? '編輯銷售紀錄' : '新增銷售紀錄'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            label="日期"
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="客戶"
            name="customer"
            value={form.customer}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
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
            label="數量"
            name="quantity"
            type="number"
            value={form.quantity}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="單價"
            name="price"
            type="number"
            value={form.price}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="狀態"
            name="status"
            value={form.status}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="包材成本"
            name="package_cost"
            type="number"
            value={form.package_cost}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="運費"
            name="shipping_cost"
            type="number"
            value={form.shipping_cost}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="製作者"
            name="maker"
            value={form.maker}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="分潤"
            name="ratio"
            value={form.ratio}
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

export default SalesForm;
