const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const multer = require('multer');
const fs = require('fs');

// 圖片上傳設定
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});
const upload = multer({ storage: storage });

const app = express();
const PORT = process.env.PORT || 5000;

// 允許所有cors
app.use(cors());
app.use(express.json());

// 上傳 API
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

// ========== 產品批次匯入 API ==========
// 支援上傳 CSV 檔案，欄位順序：name_en, name_zh, materials_en, materials_zh, price
const csvMulter = multer({ dest: uploadDir });
const readline = require('readline');
const iconv = require('iconv-lite');

app.post('/api/products/import', csvMulter.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const filePath = req.file.path;
  const results = [];
  try {
    // 讀取 CSV，自動偵測編碼（如有中文建議用UTF-8或Excel匯出時選UTF-8）
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath).pipe(iconv.decodeStream('utf8')),
      crlfDelay: Infinity,
    });
    let isFirst = true;
    for await (const line of rl) {
      if (isFirst) {
        isFirst = false;
        continue;
      } // 跳過標題列
      if (!line.trim()) continue;
      // 以Tab或逗號分隔
      const cols = line.split(/\t|,/);
      if (cols.length < 5) continue;
      const [name_en, name_zh, materials_en, materials_zh, price] = cols;
      await new Promise((resolve) => {
        db.run(
          `INSERT INTO products (name_en, name_zh, materials_en, materials_zh, price) VALUES (?, ?, ?, ?, ?)`,
          [
            name_en.trim(),
            name_zh.trim(),
            materials_en.trim(),
            materials_zh.trim(),
            parseInt(price),
          ],
          function (err) {
            results.push({
              name_en,
              name_zh,
              success: !err,
              error: err ? err.message : undefined,
            });
            resolve();
          }
        );
      });
    }
    fs.unlinkSync(filePath); // 匯入後刪除暫存檔
    res.json({ imported: results.length, results });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 靜態服務 uploads 目錄（圖片上傳）
app.use('/uploads', express.static(uploadDir));

// ================== Express 靜態服務 React build ==================
const frontendBuildPath = path.join(__dirname, '../frontend/build');
if (fs.existsSync(frontendBuildPath)) {
  app.use(express.static(frontendBuildPath));
  // SPA fallback: 讓所有未知路徑都回傳 index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
}

// 資料庫初始化
const dbPath = path.join(__dirname, 'poke.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('資料庫連線失敗:', err.message);
  } else {
    console.log('已連線至 SQLite 資料庫');
  }
});

// 建立資料表（如尚未存在）
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name_en TEXT,
    name_zh TEXT,
    materials_en TEXT,
    materials_zh TEXT,
    price INTEGER,
    image_url TEXT,
    usage_record TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT,
    customer TEXT,
    product_id INTEGER,
    quantity INTEGER,
    price INTEGER,
    status TEXT,
    package_cost INTEGER,
    shipping_cost INTEGER,
    maker TEXT,
    ratio TEXT,
    FOREIGN KEY(product_id) REFERENCES products(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    component TEXT,
    stock INTEGER,
    FOREIGN KEY(product_id) REFERENCES products(id)
  )`);
});

// 範例 API：取得所有產品
app.get('/api/products', (req, res) => {
  db.all('SELECT * FROM products', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// 新增產品
app.post('/api/products', (req, res) => {
  const { name_en, name_zh, materials_en, materials_zh, price, image_url } =
    req.body;
  db.run(
    `INSERT INTO products (name_en, name_zh, materials_en, materials_zh, price, image_url) VALUES (?, ?, ?, ?, ?, ?)`,
    [name_en, name_zh, materials_en, materials_zh, price, image_url],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ id: this.lastID });
      }
    }
  );
});

// 編輯產品
app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const { name_en, name_zh, materials_en, materials_zh, price, image_url } =
    req.body;
  db.run(
    `UPDATE products SET name_en=?, name_zh=?, materials_en=?, materials_zh=?, price=?, image_url=? WHERE id=?`,
    [name_en, name_zh, materials_en, materials_zh, price, image_url, id],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ changes: this.changes });
      }
    }
  );
});

// 刪除產品
app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM products WHERE id=?`, [id], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ changes: this.changes });
    }
  });
});

// ===================== 銷售紀錄 CRUD =====================
// 取得所有銷售紀錄（含產品名稱）
app.get('/api/sales', (req, res) => {
  db.all(
    `SELECT sales.*, products.name_zh as product_name FROM sales LEFT JOIN products ON sales.product_id = products.id`,
    [],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json(rows);
      }
    }
  );
});
// 新增銷售紀錄
app.post('/api/sales', (req, res) => {
  const {
    date,
    customer,
    product_id,
    quantity,
    price,
    status,
    package_cost,
    shipping_cost,
    maker,
    ratio,
  } = req.body;
  db.run(
    `INSERT INTO sales (date, customer, product_id, quantity, price, status, package_cost, shipping_cost, maker, ratio) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      date,
      customer,
      product_id,
      quantity,
      price,
      status,
      package_cost,
      shipping_cost,
      maker,
      ratio,
    ],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ id: this.lastID });
      }
    }
  );
});
// 編輯銷售紀錄
app.put('/api/sales/:id', (req, res) => {
  const { id } = req.params;
  const {
    date,
    customer,
    product_id,
    quantity,
    price,
    status,
    package_cost,
    shipping_cost,
    maker,
    ratio,
  } = req.body;
  db.run(
    `UPDATE sales SET date=?, customer=?, product_id=?, quantity=?, price=?, status=?, package_cost=?, shipping_cost=?, maker=?, ratio=? WHERE id=?`,
    [
      date,
      customer,
      product_id,
      quantity,
      price,
      status,
      package_cost,
      shipping_cost,
      maker,
      ratio,
      id,
    ],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ changes: this.changes });
      }
    }
  );
});
// 刪除銷售紀錄
app.delete('/api/sales/:id', (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM sales WHERE id=?`, [id], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ changes: this.changes });
    }
  });
});

// ===================== 庫存管理 CRUD =====================
// 取得所有庫存資料（含產品名稱）
app.get('/api/inventory', (req, res) => {
  db.all(
    `SELECT inventory.*, products.name_zh as product_name FROM inventory LEFT JOIN products ON inventory.product_id = products.id`,
    [],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json(rows);
      }
    }
  );
});
// 新增庫存
app.post('/api/inventory', (req, res) => {
  const { product_id, component, stock } = req.body;
  db.run(
    `INSERT INTO inventory (product_id, component, stock) VALUES (?, ?, ?)`,
    [product_id, component, stock],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ id: this.lastID });
      }
    }
  );
});
// 編輯庫存
app.put('/api/inventory/:id', (req, res) => {
  const { id } = req.params;
  const { product_id, component, stock } = req.body;
  db.run(
    `UPDATE inventory SET product_id=?, component=?, stock=? WHERE id=?`,
    [product_id, component, stock, id],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ changes: this.changes });
      }
    }
  );
});
// 刪除庫存
app.delete('/api/inventory/:id', (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM inventory WHERE id=?`, [id], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ changes: this.changes });
    }
  });
});

app.listen(PORT, () => {
  console.log(`後端伺服器啟動於 http://localhost:${PORT}`);
});
