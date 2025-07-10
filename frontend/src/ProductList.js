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
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

function ProductList({ products, onEdit, onDelete }) {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>英文名稱</TableCell>
            <TableCell>中文名稱</TableCell>
            <TableCell>材料(英)</TableCell>
            <TableCell>材料(中)</TableCell>
            <TableCell>價格</TableCell>
            <TableCell>圖片</TableCell>
            <TableCell>操作</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {products.map((p) => (
            <TableRow key={p.id}>
              <TableCell>{p.id}</TableCell>
              <TableCell>{p.name_en}</TableCell>
              <TableCell>{p.name_zh}</TableCell>
              <TableCell style={{ whiteSpace: 'pre-line' }}>
                {p.materials_en}
              </TableCell>
              <TableCell style={{ whiteSpace: 'pre-line' }}>
                {p.materials_zh}
              </TableCell>
              <TableCell>{p.price}</TableCell>
              <TableCell>
                {p.image_url ? (
                  <Avatar
                    variant="rounded"
                    src={
                      p.image_url.startsWith('http')
                        ? p.image_url
                        : `/uploads/${p.image_url}`
                    }
                    alt={p.name_en || p.name_zh}
                    sx={{ width: 56, height: 56 }}
                  />
                ) : null}
              </TableCell>
              <TableCell>
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default ProductList;
