import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  InputAdornment,
} from '@mui/material';
import ImageUpload from './ImageUpload';

function ProductForm({ product, onSave, onCancel }) {
  const isEdit = !!product.id;
  const [form, setForm] = useState({
    name_en: product.name_en || '',
    name_zh: product.name_zh || '',
    materials_en: product.materials_en || '',
    materials_zh: product.materials_zh || '',
    price: product.price || '',
    image_url: product.image_url || '',
  });
  const [uploading, setUploading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';
  const handleImageUpload = async (file) => {
    setUploading(true);
    const data = new FormData();
    data.append('image', file);
    const res = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      body: data,
    });
    const result = await res.json();
    setForm({ ...form, image_url: result.url.replace('/uploads/', '') });
    setUploading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name_en && !form.name_zh) return;
    onSave({ ...product, ...form }, isEdit);
  };

  return (
    <Dialog open onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? '編輯產品' : '新增產品'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            label="英文名稱"
            name="name_en"
            value={form.name_en}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="中文名稱"
            name="name_zh"
            value={form.name_zh}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="材料(英)"
            name="materials_en"
            value={form.materials_en}
            onChange={handleChange}
            fullWidth
            margin="normal"
            multiline
          />
          <TextField
            label="材料(中)"
            name="materials_zh"
            value={form.materials_zh}
            onChange={handleChange}
            fullWidth
            margin="normal"
            multiline
          />
          <TextField
            label="價格"
            name="price"
            value={form.price}
            onChange={handleChange}
            type="number"
            fullWidth
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">$</InputAdornment>
              ),
            }}
          />
          <Box sx={{ mt: 2 }}>
            <ImageUpload
              imageUrl={form.image_url}
              onUpload={handleImageUpload}
              uploading={uploading}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCancel}>取消</Button>
          <Button type="submit" variant="contained" disabled={uploading}>
            儲存
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default ProductForm;
