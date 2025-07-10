import React, { useEffect, useState } from 'react';
import { useState as useReactState } from 'react';
import {
  Container,
  Typography,
  Button,
  Snackbar,
  Alert,
  Box,
  Paper,
} from '@mui/material';
import ProductList from './ProductList';
import ProductForm from './ProductForm';
import ImportCSV from './ImportCSV';
import SalesList from './SalesList';
import InventoryList from './InventoryList';
import SalesForm from './SalesForm';
import InventoryForm from './InventoryForm';

function App() {
  // 分頁狀態: 'products' | 'sales' | 'inventory'
  const [page, setPage] = useReactState('products');
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [sales, setSales] = useState([]);
  const [inventory, setInventory] = useState([]);

  // 取得產品列表
  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products`);
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      setSnackbar({ open: true, message: '載入產品失敗', severity: 'error' });
    }
  };

  // 取得銷售紀錄
  const fetchSales = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/sales`);
      const data = await res.json();
      setSales(data);
    } catch (err) {
      setSnackbar({
        open: true,
        message: '載入銷售紀錄失敗',
        severity: 'error',
      });
    }
  };

  // 取得庫存資料
  const fetchInventory = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/inventory`);
      const data = await res.json();
      setInventory(data);
    } catch (err) {
      setSnackbar({ open: true, message: '載入庫存失敗', severity: 'error' });
    }
  };
  // 銷售與庫存編輯狀態
  const [editingSale, setEditingSale] = useState(null);
  const [editingInventory, setEditingInventory] = useState(null);
  // 銷售紀錄 CRUD
  const handleSaveSale = async (sale, isEdit) => {
    const payload = {
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
    };
    try {
      const res = await fetch(
        isEdit
          ? `${API_BASE_URL}/api/sales/${sale.id}`
          : `${API_BASE_URL}/api/sales`,
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error('儲存失敗');
      setSnackbar({
        open: true,
        message: isEdit ? '紀錄已更新' : '紀錄已新增',
        severity: 'success',
      });
      setEditingSale(null);
      fetchSales();
    } catch {
      setSnackbar({ open: true, message: '儲存失敗', severity: 'error' });
    }
  };

  const handleDeleteSale = async (id) => {
    if (!window.confirm('確定要刪除這筆銷售紀錄嗎？')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/sales/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('刪除失敗');
      setSnackbar({ open: true, message: '紀錄已刪除', severity: 'success' });
      fetchSales();
    } catch {
      setSnackbar({ open: true, message: '刪除失敗', severity: 'error' });
    }
  };

  // 庫存 CRUD
  const handleSaveInventory = async (item, isEdit) => {
    const payload = {
      product_id: item.product_id || '',
      component: item.component || '',
      stock: item.stock || '',
    };
    try {
      const res = await fetch(
        isEdit
          ? `${API_BASE_URL}/api/inventory/${item.id}`
          : `${API_BASE_URL}/api/inventory`,
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error('儲存失敗');
      setSnackbar({
        open: true,
        message: isEdit ? '庫存已更新' : '庫存已新增',
        severity: 'success',
      });
      setEditingInventory(null);
      fetchInventory();
    } catch {
      setSnackbar({ open: true, message: '儲存失敗', severity: 'error' });
    }
  };

  const handleDeleteInventory = async (id) => {
    if (!window.confirm('確定要刪除這筆庫存資料嗎？')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/inventory/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('刪除失敗');
      setSnackbar({ open: true, message: '庫存已刪除', severity: 'success' });
      fetchInventory();
    } catch {
      setSnackbar({ open: true, message: '刪除失敗', severity: 'error' });
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (page === 'sales') fetchSales();
    if (page === 'inventory') fetchInventory();
    // eslint-disable-next-line
  }, [page]);

  // 新增或編輯產品
  const handleSave = async (product, isEdit) => {
    // 欄位同步：name_en, name_zh, materials_en, materials_zh, price, image_url
    const payload = {
      name_en: product.name_en || '',
      name_zh: product.name_zh || '',
      materials_en: product.materials_en || '',
      materials_zh: product.materials_zh || '',
      price: product.price || '',
      image_url: product.image_url || '',
    };
    try {
      const res = await fetch(
        isEdit
          ? `${API_BASE_URL}/api/products/${product.id}`
          : `${API_BASE_URL}/api/products`,
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error('儲存失敗');
      setSnackbar({
        open: true,
        message: isEdit ? '產品已更新' : '產品已新增',
        severity: 'success',
      });
      setEditingProduct(null);
      fetchProducts();
    } catch {
      setSnackbar({ open: true, message: '儲存失敗', severity: 'error' });
    }
  };

  // 刪除產品
  const handleDelete = async (id) => {
    if (!window.confirm('確定要刪除這個產品嗎？')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('刪除失敗');
      setSnackbar({ open: true, message: '產品已刪除', severity: 'success' });
      fetchProducts();
    } catch {
      setSnackbar({ open: true, message: '刪除失敗', severity: 'error' });
    }
  };

  // 批次匯入成功後刷新
  const handleImportSuccess = () => {
    setSnackbar({ open: true, message: '匯入成功', severity: 'success' });
    fetchProducts();
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom align="center">
        寶可夢 3D 列印球產品管理
      </Typography>
      {/* 分頁切換按鈕 */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 3 }}>
        <Button
          variant={page === 'products' ? 'contained' : 'outlined'}
          onClick={() => setPage('products')}
        >
          產品管理
        </Button>
        <Button
          variant={page === 'sales' ? 'contained' : 'outlined'}
          onClick={() => setPage('sales')}
        >
          銷售紀錄
        </Button>
        <Button
          variant={page === 'inventory' ? 'contained' : 'outlined'}
          onClick={() => setPage('inventory')}
        >
          庫存管理
        </Button>
      </Box>

      {/* 產品管理頁 */}
      {page === 'products' && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setEditingProduct({})}
            >
              新增產品
            </Button>
            <ImportCSV onSuccess={handleImportSuccess} />
          </Box>
          <Paper sx={{ p: 2, mb: 2 }}>
            <ProductList
              products={products}
              onEdit={setEditingProduct}
              onDelete={handleDelete}
            />
          </Paper>
          {editingProduct !== null && (
            <ProductForm
              product={editingProduct}
              onSave={handleSave}
              onCancel={() => setEditingProduct(null)}
            />
          )}
        </>
      )}

      {/* 銷售紀錄分頁 CRUD */}
      {page === 'sales' && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button variant="contained" onClick={() => setEditingSale({})}>
              新增銷售紀錄
            </Button>
          </Box>
          <Paper sx={{ p: 2, mb: 2 }}>
            <SalesList
              sales={sales}
              onEdit={setEditingSale}
              onDelete={handleDeleteSale}
            />
          </Paper>
          {editingSale !== null && (
            <SalesForm
              sale={editingSale}
              products={products}
              onSave={handleSaveSale}
              onCancel={() => setEditingSale(null)}
            />
          )}
        </>
      )}

      {/* 庫存管理分頁 CRUD */}
      {page === 'inventory' && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button variant="contained" onClick={() => setEditingInventory({})}>
              新增庫存
            </Button>
          </Box>
          <Paper sx={{ p: 2, mb: 2 }}>
            <InventoryList
              inventory={inventory}
              onEdit={setEditingInventory}
              onDelete={handleDeleteInventory}
            />
          </Paper>
          {editingInventory !== null && (
            <InventoryForm
              item={editingInventory}
              products={products}
              onSave={handleSaveInventory}
              onCancel={() => setEditingInventory(null)}
            />
          )}
        </>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default App;
