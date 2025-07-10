import React, { useRef } from 'react';
import { Button, Avatar, CircularProgress, Box } from '@mui/material';

function ImageUpload({ imageUrl, onUpload, uploading }) {
  const fileInput = useRef();

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {imageUrl && (
        <Avatar
          src={imageUrl.startsWith('http') ? imageUrl : `/uploads/${imageUrl}`}
          alt="產品圖片"
          sx={{ width: 56, height: 56 }}
        />
      )}
      <input
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        ref={fileInput}
        onChange={handleFileChange}
        disabled={uploading}
      />
      <Button
        variant="outlined"
        onClick={() => fileInput.current && fileInput.current.click()}
        disabled={uploading}
      >
        上傳圖片
      </Button>
      {uploading && <CircularProgress size={24} />}
    </Box>
  );
}

export default ImageUpload;
