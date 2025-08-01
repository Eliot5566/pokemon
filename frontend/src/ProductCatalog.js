import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Grid,
  Button,
  TextField,
  Box,
} from '@mui/material';

function ProductCatalog({ products, onPurchase }) {
  const [success, setSuccess] = useState(false);
  const [quantities, setQuantities] = useState({});
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '' });

  const handleQuantityChange = (id, value) => {
    setQuantities({ ...quantities, [id]: value });
  };

  const handleAddToCart = (product) => {
    const qty = parseInt(quantities[product.id], 10) || 0;
    if (qty > 0) {
      // 檢查購物車是否已有此商品
      const exist = cart.find((item) => item.product_id === product.id);
      let newCart;
      if (exist) {
        newCart = cart.map((item) =>
          item.product_id === product.id ? { ...item, quantity: qty } : item
        );
      } else {
        newCart = [
          ...cart,
          {
            product_id: product.id,
            name_zh: product.name_zh,
            name_en: product.name_en,
            price: product.price,
            image_url: product.image_url,
            quantity: qty,
          },
        ];
      }
      setCart(newCart);
      setQuantities({ ...quantities, [product.id]: '' });
    }
  };

  const handleRemoveFromCart = (product_id) => {
    setCart(cart.filter((item) => item.product_id !== product_id));
  };

  const handleSubmitCart = () => {
    setCheckout(true);
  };

  const handleConfirmCheckout = async () => {
    // 批次送出購買清單，帶入消費者資訊
    const payload = cart.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      customer: customer.name,
      phone: customer.phone,
      email: customer.email,
      date: new Date().toISOString().slice(0, 10),
      price: item.price,
      status: '待處理',
      package_cost: 0,
      shipping_cost: 0,
      maker: '',
      ratio: '',
    }));
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/sales`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      if (res.ok) {
        setSuccess(true);
        setCart([]);
        setCheckout(false);
        setShowCart(false);
        setCustomer({ name: '', phone: '', email: '' });
      }
    } catch {
      alert('送出失敗，請稍後再試');
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        寶可夢球型錄
      </Typography>
      <Grid container spacing={3} alignItems="stretch" justifyContent="center">
        {products.map((p) => (
          <Grid
            item
            xs={12}
            sm={6}
            md={3}
            key={p.id}
            sx={{ display: 'flex', justifyContent: 'center' }}
          >
            <Box sx={{ width: 260, height: 400, display: 'flex' }}>
              <Card
                sx={{
                  boxShadow: 4,
                  borderRadius: 4,
                  height: '100%',
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  alignItems: 'stretch',
                  transition: 'box-shadow 0.2s',
                  '&:hover': { boxShadow: 8 },
                }}
              >
                <Box
                  sx={{
                    width: '100%',
                    height: 180,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: '#f8f8f8',
                    borderTopLeftRadius: 16,
                    borderTopRightRadius: 16,
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={
                      p.image_url?.startsWith('http')
                        ? p.image_url
                        : `/uploads/${p.image_url}`
                    }
                    alt={p.name_zh}
                    style={{
                      width: '140px',
                      height: '140px',
                      objectFit: 'cover',
                      borderRadius: 12,
                      boxShadow: '0 2px 8px #ccc',
                      display: 'block',
                    }}
                  />
                </Box>
                <CardContent
                  sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    px: 2,
                    py: 1,
                  }}
                >
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700, fontSize: 20, mb: 0.5 }}
                    >
                      {p.name_zh}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: 14 }}
                    >
                      {p.name_en}
                    </Typography>
                    {/* <Typography variant="body2" sx={{ mt: 1, fontSize: 14 }}>
                      材料：{p.materials_zh}
                      {p.materials_ratio && (
                        <Box
                          sx={{ mt: 1, fontSize: 13, color: 'text.secondary' }}
                        >
                          {p.materials_ratio.split(';').map((m, idx) => {
                            const [mat, ratio] = m.split(':');
                            if (!mat || !ratio) return null;
                            return (
                              <div key={idx}>
                                {mat.trim()} <b>{ratio.trim()}</b>
                              </div>
                            );
                          })}
                        </Box>
                      )}
                    </Typography> */}
                    <Typography
                      variant="body2"
                      sx={{
                        mb: 1,
                        fontSize: 15,
                        color: 'primary.main',
                        fontWeight: 600,
                      }}
                    >
                      價格：${p.price}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      mt: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <TextField
                      label="購買數量"
                      type="number"
                      size="small"
                      value={quantities[p.id] || ''}
                      onChange={(e) =>
                        handleQuantityChange(p.id, e.target.value)
                      }
                      sx={{ width: 80, mr: 1 }}
                      inputProps={{ min: 1, style: { textAlign: 'center' } }}
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleAddToCart(p)}
                      disabled={
                        !quantities[p.id] || parseInt(quantities[p.id], 10) <= 0
                      }
                      sx={{ ml: 1, minWidth: 90 }}
                    >
                      加入購物車
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Grid>
        ))}
      </Grid>
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Button
          variant="outlined"
          color="secondary"
          onClick={() => setShowCart(!showCart)}
          disabled={cart.length === 0}
        >
          {showCart ? '隱藏購物車' : `查看購物車 (${cart.length})`}
        </Button>
      </Box>
      {showCart && !checkout && (
        <Box sx={{ mt: 2, p: 2, border: '1px solid #ccc', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            購物車
          </Typography>
          {cart.length === 0 ? (
            <Typography>購物車目前是空的</Typography>
          ) : (
            <>
              {cart.map((item) => (
                <Box
                  key={item.product_id}
                  sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
                >
                  <img
                    src={
                      item.image_url?.startsWith('http')
                        ? item.image_url
                        : `/uploads/${item.image_url}`
                    }
                    alt={item.name_zh}
                    style={{
                      width: 60,
                      height: 60,
                      objectFit: 'cover',
                      marginRight: 8,
                      borderRadius: 8,
                    }}
                  />
                  <Typography sx={{ flex: 1 }}>
                    {item.name_zh} x {item.quantity}
                  </Typography>
                  <Typography sx={{ width: 80 }}>
                    NT$ {item.price * item.quantity}
                  </Typography>
                  <Button
                    color="error"
                    onClick={() => handleRemoveFromCart(item.product_id)}
                    sx={{ ml: 2 }}
                  >
                    移除
                  </Button>
                </Box>
              ))}
              <Box sx={{ textAlign: 'right', mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmitCart}
                >
                  前往結帳
                </Button>
              </Box>
            </>
          )}
        </Box>
      )}

      {/* 結帳頁 */}
      {showCart && checkout && !success && (
        <Box
          sx={{
            mt: 2,
            p: 2,
            border: '2px solid #1976d2',
            borderRadius: 2,
            background: '#f5f5ff',
          }}
        >
          <Typography variant="h6" gutterBottom>
            結帳資訊
          </Typography>
          <Box sx={{ mb: 2 }}>
            <TextField
              label="姓名"
              value={customer.name}
              onChange={(e) =>
                setCustomer({ ...customer, name: e.target.value })
              }
              sx={{ mr: 2, width: 180 }}
              required
            />
            <TextField
              label="電話"
              value={customer.phone}
              onChange={(e) =>
                setCustomer({ ...customer, phone: e.target.value })
              }
              sx={{ mr: 2, width: 180 }}
            />
            <TextField
              label="Email"
              value={customer.email}
              onChange={(e) =>
                setCustomer({ ...customer, email: e.target.value })
              }
              sx={{ width: 220 }}
            />
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1">購買明細：</Typography>
            {cart.map((item) => (
              <Box
                key={item.product_id}
                sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
              >
                <Typography sx={{ flex: 1 }}>
                  {item.name_zh} x {item.quantity}
                </Typography>
                <Typography sx={{ width: 80 }}>
                  NT$ {item.price * item.quantity}
                </Typography>
              </Box>
            ))}
            <Typography sx={{ textAlign: 'right', fontWeight: 'bold', mt: 1 }}>
              總計：NT${' '}
              {cart.reduce((sum, item) => sum + item.price * item.quantity, 0)}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleConfirmCheckout}
              disabled={!customer.name}
            >
              完成結帳
            </Button>
            <Button
              variant="outlined"
              sx={{ ml: 2 }}
              onClick={() => setCheckout(false)}
            >
              返回購物車
            </Button>
          </Box>
        </Box>
      )}

      {/* 購買成功頁面 */}
      {showCart && checkout && success && (
        <Box
          sx={{
            mt: 2,
            p: 2,
            border: '2px solid #4caf50',
            borderRadius: 2,
            background: '#e8f5e9',
            textAlign: 'center',
          }}
        >
          <Typography variant="h5" color="success.main" gutterBottom>
            購買成功！
          </Typography>
          <Typography sx={{ mb: 2 }}>感謝您的購買，我們已收到訂單。</Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              setSuccess(false);
              setCheckout(false);
              setShowCart(false);
            }}
          >
            返回型錄
          </Button>
        </Box>
      )}
    </Box>
  );
}

export default ProductCatalog;
