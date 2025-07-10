import React, { useRef, useState } from 'react';
import { Button, CircularProgress } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';

function ImportCSV({ onSuccess }) {
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';
  const fileInput = useRef();
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e) => {
    if (!e.target.files || !e.target.files[0]) return;
    setLoading(true);
    const data = new FormData();
    data.append('file', e.target.files[0]);
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/import`, {
        method: 'POST',
        body: data,
      });
      if (!res.ok) throw new Error('匯入失敗');
      onSuccess();
    } catch {
      alert('匯入失敗，請檢查檔案格式');
    }
    setLoading(false);
    e.target.value = '';
  };

  return (
    <>
      <input
        type="file"
        accept=".csv"
        style={{ display: 'none' }}
        ref={fileInput}
        onChange={handleFileChange}
        disabled={loading}
      />
      <Button
        variant="outlined"
        startIcon={<UploadFileIcon />}
        onClick={() => fileInput.current && fileInput.current.click()}
        disabled={loading}
      >
        批次匯入
      </Button>
      {loading && <CircularProgress size={20} sx={{ ml: 1 }} />}
    </>
  );
}

export default ImportCSV;
