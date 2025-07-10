import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';

function SalesList({ sales }) {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>日期</TableCell>
            <TableCell>客戶</TableCell>
            <TableCell>產品</TableCell>
            <TableCell>數量</TableCell>
            <TableCell>單價</TableCell>
            <TableCell>狀態</TableCell>
            <TableCell>包材成本</TableCell>
            <TableCell>運費</TableCell>
            <TableCell>製作者</TableCell>
            <TableCell>分潤</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sales.map((s) => (
            <TableRow key={s.id}>
              <TableCell>{s.id}</TableCell>
              <TableCell>{s.date}</TableCell>
              <TableCell>{s.customer}</TableCell>
              <TableCell>{s.product_name}</TableCell>
              <TableCell>{s.quantity}</TableCell>
              <TableCell>{s.price}</TableCell>
              <TableCell>{s.status}</TableCell>
              <TableCell>{s.package_cost}</TableCell>
              <TableCell>{s.shipping_cost}</TableCell>
              <TableCell>{s.maker}</TableCell>
              <TableCell>{s.ratio}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default SalesList;
