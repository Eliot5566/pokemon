import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Avatar,
  Tooltip,
  Box,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

function ProductList({ products, onEdit, onDelete }) {
  return (
    <TableContainer sx={{ maxWidth: 1100, mx: 'auto', px: 0, py: 2 }}>
      <Table sx={{ width: '100%', minWidth: 1000, tableLayout: 'fixed' }}>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>英文名稱</TableCell>
            <TableCell>中文名稱</TableCell>
            <TableCell>材料(英)</TableCell>
            <TableCell>材料(中)</TableCell>
            <TableCell>材料比重</TableCell>
            <TableCell>價格</TableCell>
            <TableCell>圖片</TableCell>
            <TableCell>操作</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {products.map((p) => (
            <TableRow
              key={p.id}
              sx={{
                borderBottom: '2px solid #eee',
                '&:hover': { background: '#f5f5fa' },
              }}
            >
              <TableCell
                sx={{ width: 40, fontWeight: 700, textAlign: 'center' }}
              >
                {p.id}
              </TableCell>
              <TableCell
                sx={{ width: 160, whiteSpace: 'pre-line', fontWeight: 500 }}
              >
                {p.name_en}
              </TableCell>
              <TableCell
                sx={{ width: 120, whiteSpace: 'pre-line', fontWeight: 500 }}
              >
                {p.name_zh}
              </TableCell>
              <TableCell
                sx={{
                  width: 140,
                  whiteSpace: 'pre-line',
                  fontSize: 14,
                  color: '#444',
                }}
              >
                {p.materials_en}
              </TableCell>
              <TableCell
                sx={{
                  width: 140,
                  whiteSpace: 'pre-line',
                  fontSize: 14,
                  color: '#444',
                }}
              >
                {p.materials_zh}
              </TableCell>
              <TableCell
                sx={{
                  width: 140,
                  whiteSpace: 'pre-line',
                  fontSize: 14,
                  color: '#1976d2',
                  fontWeight: 500,
                }}
              >
                {p.materials_ratio &&
                  p.materials_ratio.split(';').map((m, idx) => {
                    const [mat, ratio] = m.split(':');
                    if (!mat || !ratio) return null;
                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <span style={{ minWidth: 70 }}>{mat.trim()}</span>
                        <span style={{ color: '#d32f2f', fontWeight: 700 }}>
                          {ratio.trim()}
                        </span>
                      </div>
                    );
                  })}
              </TableCell>
              <TableCell
                sx={{ width: 80, fontWeight: 700, textAlign: 'center' }}
              >
                {p.price}
              </TableCell>
              <TableCell
                sx={{
                  width: 120,
                  textAlign: 'center',
                  verticalAlign: 'middle',
                }}
              >
                {p.image_url ? (
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      position: 'relative',
                      display: 'inline-block',
                      mx: 'auto',
                    }}
                  >
                    <Avatar
                      variant="rounded"
                      src={
                        p.image_url.startsWith('http')
                          ? p.image_url
                          : `/uploads/${p.image_url}`
                      }
                      alt={p.name_en || p.name_zh}
                      sx={{
                        width: 80,
                        height: 80,
                        transition: 'transform 0.2s',
                        cursor: 'pointer',
                        '&:hover': { transform: 'scale(1.2)' },
                      }}
                    />
                  </Box>
                ) : null}
              </TableCell>
              <TableCell>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Tooltip title="編輯">
                    <IconButton onClick={() => onEdit(p)} color="primary">
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="刪除">
                    <IconButton onClick={() => onDelete(p.id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default ProductList;
