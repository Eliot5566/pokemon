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
  // 材料比重動態編輯，材料名稱自動帶入
  const parseRatio = (str) => {
    if (!str) return [];
    return str
      .split(';')
      .map((m) => {
        const [name, ratio] = m.split(':');
        return name && ratio
          ? { name: name.trim(), ratio: ratio.replace('%', '').trim() }
          : null;
      })
      .filter(Boolean);
  };
  const parseMaterials = (str) => {
    if (!str) return [];
    return str
      .split(/\n|,/)
      .map((m) => m.trim())
      .filter(Boolean);
  };
  const [form, setForm] = useState({
    name_en: product.name_en || '',
    name_zh: product.name_zh || '',
    materials_en: product.materials_en || '',
    materials_zh: product.materials_zh || '',
    price: product.price || '',
    image_url: product.image_url || '',
  });
  // 初始化比重欄位：有比重資料則用比重，否則自動帶入材料名稱
  const initialRatios = (() => {
    const ratioList = parseRatio(product.materials_ratio);
    if (ratioList.length > 0) return ratioList;
    // 以材料(中)為主，若無則用材料(英)
    const mats =
      parseMaterials(product.materials_zh) ||
      parseMaterials(product.materials_en);
    return mats.map((name) => ({ name, ratio: '' }));
  })();
  const [ratios, setRatios] = useState(initialRatios);
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
    // 組合材料比重
    const materials_ratio = ratios
      .filter((r) => r.name && r.ratio)
      .map((r) => `${r.name}:${r.ratio}%`)
      .join(';');
    onSave({ ...product, ...form, materials_ratio }, isEdit);
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
          <Box sx={{ mt: 2, mb: 1 }}>
            <b>材料比重</b>
            {ratios.map((r, idx) => (
              <Box key={idx} sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <TextField
                  label="材料名稱"
                  value={r.name}
                  size="small"
                  onChange={(e) => {
                    const newRatios = [...ratios];
                    newRatios[idx].name = e.target.value;
                    setRatios(newRatios);
                  }}
                  sx={{ width: 160 }}
                />
                <TextField
                  label="比重%"
                  value={r.ratio}
                  size="small"
                  type="number"
                  onChange={(e) => {
                    const newRatios = [...ratios];
                    newRatios[idx].ratio = e.target.value;
                    setRatios(newRatios);
                  }}
                  sx={{ width: 80 }}
                  inputProps={{ min: 0, max: 100 }}
                />
                <Button
                  color="error"
                  onClick={() => {
                    setRatios(ratios.filter((_, i) => i !== idx));
                  }}
                >
                  移除
                </Button>
              </Box>
            ))}
            <Button
              variant="outlined"
              size="small"
              sx={{ mt: 1 }}
              onClick={() => setRatios([...ratios, { name: '', ratio: '' }])}
            >
              新增材料
            </Button>
          </Box>
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
