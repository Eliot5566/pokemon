const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const chardet = require('chardet');

const app = express();
const PORT = process.env.PORT || 5000;

// 允許所有cors
app.use(cors());
app.use(express.json());

// ========== 產品批次匯入 API ==========
// 支援上傳 CSV 檔案，欄位順序：name_en, name_zh, materials_en, materials_zh, price
const readline = require('readline');
const iconv = require('iconv-lite');

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

// csvMulter 必須在 uploadDir 宣告之後
const csvMulter = multer({ dest: uploadDir });

// 上傳 API
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

app.post('/api/products/import', csvMulter.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const filePath = req.file.path;
  const results = [];
  try {
    // 偵測編碼
    const detectedEncoding = chardet.detectFileSync(filePath) || 'utf8';
    console.log('📦 Detected encoding:', detectedEncoding);

    const rl = readline.createInterface({
      input: fs
        .createReadStream(filePath)
        .pipe(iconv.decodeStream(detectedEncoding)),
      crlfDelay: Infinity,
    });

    let headers = [];
    let isFirst = true;
    const rows = [];

    for await (const line of rl) {
      if (!line.trim()) continue;
      const cols = line.split(/\t|,/).map((c) => c.trim());

      if (isFirst) {
        headers = cols.map((h) => h.replace(/^\uFEFF/, '').trim());
        isFirst = false;
        continue;
      }

      const row = {};
      headers.forEach((h, i) => {
        row[h.toLowerCase()] = cols[i] || '';
      });
      rows.push(row);
    }

    // 依照連續列補齊 name_en / name_zh（避免材料斷行）
    let lastNameEn = '';
    let lastNameZh = '';
    for (const row of rows) {
      if (row['name_en']) lastNameEn = row['name_en'];
      else row['name_en'] = lastNameEn;

      if (row['name_zh']) lastNameZh = row['name_zh'];
      else row['name_zh'] = lastNameZh;
    }

    // 分組合併材料
    const productMap = {};
    for (const row of rows) {
      const name_en = row['name_en'];
      const name_zh = row['name_zh'];
      const price = parseInt(row['price']) || 0;
      const image_url = row['image_url'] || '';
      const materials_ratio = row['materials_ratio'] || '';
      const key = `${name_en}|||${name_zh}`;

      if (!productMap[key]) {
        productMap[key] = {
          name_en,
          name_zh,
          materials_en: [],
          materials_zh: [],
          price,
          image_url,
          materials_ratio,
        };
      }

      for (const h in row) {
        const val = row[h]?.trim();
        if (!val) continue;

        const lch = h.toLowerCase();
        if (
          lch.includes('material') &&
          !lch.includes('zh') &&
          !lch.includes('ratio')
        ) {
          productMap[key].materials_en.push(val);
        }
        if (
          lch.includes('material') &&
          lch.includes('zh') &&
          !lch.includes('ratio')
        ) {
          productMap[key].materials_zh.push(val);
        }
        if (lch === 'materials_ratio') {
          productMap[key].materials_ratio = val;
        }
      }
    }

    // 將合併好的產品寫入 DB
    for (const key in productMap) {
      const p = productMap[key];
      const materials_en = [...new Set(p.materials_en)].join('\n');
      const materials_zh = [...new Set(p.materials_zh)].join('\n');

      await new Promise((resolve) => {
        db.run(
          `INSERT INTO products (name_en, name_zh, materials_en, materials_zh, price, image_url, materials_ratio) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            p.name_en,
            p.name_zh,
            materials_en,
            materials_zh,
            p.price,
            p.image_url,
            p.materials_ratio,
          ],
          function (err) {
            results.push({
              name_en: p.name_en,
              name_zh: p.name_zh,
              success: !err,
              error: err?.message,
            });
            resolve();
          }
        );
      });
    }

    fs.unlinkSync(filePath); // 清除暫存 CSV
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
  // 只 fallback 非 /api 路徑
  app.get(/^\/(?!api).*/, (req, res) => {
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
    usage_record TEXT,
    materials_ratio TEXT
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
  const {
    name_en,
    name_zh,
    materials_en,
    materials_zh,
    price,
    image_url,
    materials_ratio,
  } = req.body;
  db.run(
    `INSERT INTO products (name_en, name_zh, materials_en, materials_zh, price, image_url, materials_ratio) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      name_en,
      name_zh,
      materials_en,
      materials_zh,
      price,
      image_url,
      materials_ratio,
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

// 編輯產品
app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const {
    name_en,
    name_zh,
    materials_en,
    materials_zh,
    price,
    image_url,
    materials_ratio,
  } = req.body;
  db.run(
    `UPDATE products SET name_en=?, name_zh=?, materials_en=?, materials_zh=?, price=?, image_url=?, materials_ratio=? WHERE id=?`,
    [
      name_en,
      name_zh,
      materials_en,
      materials_zh,
      price,
      image_url,
      materials_ratio,
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
  // 支援批次與單筆
  const body = Array.isArray(req.body) ? req.body : [req.body];
  let results = [];
  let error = null;
  let completed = 0;
  body.forEach((sale) => {
    const {
      date,
      customer,
      phone,
      email,
      product_id,
      quantity,
      price,
      status,
      package_cost,
      shipping_cost,
      maker,
      ratio,
    } = sale;
    db.run(
      `INSERT INTO sales (date, customer, product_id, quantity, price, status, package_cost, shipping_cost, maker, ratio) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        date,
        customer + (phone ? ` (${phone})` : '') + (email ? ` <${email}>` : ''),
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
        completed++;
        results.push({ id: this.lastID, error: err ? err.message : null });
        if (err) error = err;
        if (completed === body.length) {
          if (error) {
            res.status(500).json({ error: error.message, results });
          } else {
            res.json({ results });
          }
        }
      }
    );
  });
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

// const express = require('express');
// const cors = require('cors');
// const fs = require('fs');
// const path = require('path');
// const multer = require('multer');
// const readline = require('readline');
// const iconv = require('iconv-lite');
// const sqlite3 = require('sqlite3').verbose();

// const app = express();
// const PORT = process.env.PORT || 5000;

// // 建立 uploads 資料夾（一定要在 multer 使用前建立）
// const uploadDir = path.join(__dirname, 'uploads');
// if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// // 圖片上傳用 multer 設定
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, uploadDir);
//   },
//   filename: function (req, file, cb) {
//     const ext = path.extname(file.originalname);
//     cb(null, Date.now() + ext);
//   },
// });
// const upload = multer({ storage });

// // csv 上傳專用
// const csvMulter = multer({ dest: uploadDir });

// app.use(cors());
// app.use(express.json());

// // 上傳圖片 API
// app.post('/api/upload', upload.single('image'), (req, res) => {
//   if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
//   res.json({ url: `/uploads/${req.file.filename}` });
// });

// // 批次匯入產品 CSV
// app.post('/api/products/import', csvMulter.single('file'), async (req, res) => {
//   if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
//   const filePath = req.file.path;
//   const results = [];
//   try {
//     const rl = readline.createInterface({
//       input: fs.createReadStream(filePath).pipe(iconv.decodeStream('utf8')),
//       crlfDelay: Infinity,
//     });
//     let isFirst = true;
//     for await (const line of rl) {
//       if (isFirst) {
//         isFirst = false;
//         continue;
//       }
//       if (!line.trim()) continue;
//       const cols = line.split(/\t|,/);
//       if (cols.length < 5) continue;
//       const [name_en, name_zh, materials_en, materials_zh, price] = cols;
//       await new Promise((resolve) => {
//         db.run(
//           `INSERT INTO products (name_en, name_zh, materials_en, materials_zh, price) VALUES (?, ?, ?, ?, ?)`,
//           [
//             name_en.trim(),
//             name_zh.trim(),
//             materials_en.trim(),
//             materials_zh.trim(),
//             parseInt(price),
//           ],
//           function (err) {
//             results.push({
//               name_en,
//               name_zh,
//               success: !err,
//               error: err ? err.message : undefined,
//             });
//             resolve();
//           }
//         );
//       });
//     }
//     fs.unlinkSync(filePath);
//     res.json({ imported: results.length, results });
//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// });

// // 靜態檔案服務
// app.use('/uploads', express.static(uploadDir));

// // React 前端 build 路徑（如有）
// const frontendBuildPath = path.join(__dirname, '../frontend/build');
// if (fs.existsSync(frontendBuildPath)) {
//   app.use(express.static(frontendBuildPath));
//   app.get('*', (req, res) => {
//     res.sendFile(path.join(frontendBuildPath, 'index.html'));
//   });
// }

// // SQLite 資料庫初始化
// const dbPath = path.join(__dirname, 'poke.db');
// const db = new sqlite3.Database(dbPath, (err) => {
//   if (err) console.error('資料庫連線失敗:', err.message);
//   else console.log('已連線至 SQLite 資料庫');
// });

// // 建立資料表（如果尚未存在）
// db.serialize(() => {
//   db.run(`CREATE TABLE IF NOT EXISTS products (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     name_en TEXT,
//     name_zh TEXT,
//     materials_en TEXT,
//     materials_zh TEXT,
//     price INTEGER,
//     image_url TEXT,
//     usage_record TEXT
//   )`);

//   db.run(`CREATE TABLE IF NOT EXISTS sales (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     date TEXT,
//     customer TEXT,
//     product_id INTEGER,
//     quantity INTEGER,
//     price INTEGER,
//     status TEXT,
//     package_cost INTEGER,
//     shipping_cost INTEGER,
//     maker TEXT,
//     ratio TEXT,
//     FOREIGN KEY(product_id) REFERENCES products(id)
//   )`);

//   db.run(`CREATE TABLE IF NOT EXISTS inventory (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     product_id INTEGER,
//     component TEXT,
//     stock INTEGER,
//     FOREIGN KEY(product_id) REFERENCES products(id)
//   )`);
// });

// // ===== Products API =====
// app.get('/api/products', (req, res) => {
//   db.all('SELECT * FROM products', [], (err, rows) => {
//     if (err) res.status(500).json({ error: err.message });
//     else res.json(rows);
//   });
// });

// app.post('/api/products', (req, res) => {
//   const { name_en, name_zh, materials_en, materials_zh, price, image_url } =
//     req.body;
//   db.run(
//     `INSERT INTO products (name_en, name_zh, materials_en, materials_zh, price, image_url) VALUES (?, ?, ?, ?, ?, ?)`,
//     [name_en, name_zh, materials_en, materials_zh, price, image_url],
//     function (err) {
//       if (err) res.status(500).json({ error: err.message });
//       else res.json({ id: this.lastID });
//     }
//   );
// });

// app.put('/api/products/:id', (req, res) => {
//   const { id } = req.params;
//   const { name_en, name_zh, materials_en, materials_zh, price, image_url } =
//     req.body;
//   db.run(
//     `UPDATE products SET name_en=?, name_zh=?, materials_en=?, materials_zh=?, price=?, image_url=? WHERE id=?`,
//     [name_en, name_zh, materials_en, materials_zh, price, image_url, id],
//     function (err) {
//       if (err) res.status(500).json({ error: err.message });
//       else res.json({ changes: this.changes });
//     }
//   );
// });

// app.delete('/api/products/:id', (req, res) => {
//   const { id } = req.params;
//   db.run(`DELETE FROM products WHERE id=?`, [id], function (err) {
//     if (err) res.status(500).json({ error: err.message });
//     else res.json({ changes: this.changes });
//   });
// });

// // ===== Sales API =====
// app.get('/api/sales', (req, res) => {
//   db.all(
//     `SELECT sales.*, products.name_zh as product_name FROM sales LEFT JOIN products ON sales.product_id = products.id`,
//     [],
//     (err, rows) => {
//       if (err) res.status(500).json({ error: err.message });
//       else res.json(rows);
//     }
//   );
// });

// app.post('/api/sales', (req, res) => {
//   const {
//     date,
//     customer,
//     product_id,
//     quantity,
//     price,
//     status,
//     package_cost,
//     shipping_cost,
//     maker,
//     ratio,
//   } = req.body;
//   db.run(
//     `INSERT INTO sales (date, customer, product_id, quantity, price, status, package_cost, shipping_cost, maker, ratio) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//     [
//       date,
//       customer,
//       product_id,
//       quantity,
//       price,
//       status,
//       package_cost,
//       shipping_cost,
//       maker,
//       ratio,
//     ],
//     function (err) {
//       if (err) res.status(500).json({ error: err.message });
//       else res.json({ id: this.lastID });
//     }
//   );
// });

// app.put('/api/sales/:id', (req, res) => {
//   const { id } = req.params;
//   const {
//     date,
//     customer,
//     product_id,
//     quantity,
//     price,
//     status,
//     package_cost,
//     shipping_cost,
//     maker,
//     ratio,
//   } = req.body;
//   db.run(
//     `UPDATE sales SET date=?, customer=?, product_id=?, quantity=?, price=?, status=?, package_cost=?, shipping_cost=?, maker=?, ratio=? WHERE id=?`,
//     [
//       date,
//       customer,
//       product_id,
//       quantity,
//       price,
//       status,
//       package_cost,
//       shipping_cost,
//       maker,
//       ratio,
//       id,
//     ],
//     function (err) {
//       if (err) res.status(500).json({ error: err.message });
//       else res.json({ changes: this.changes });
//     }
//   );
// });

// app.delete('/api/sales/:id', (req, res) => {
//   const { id } = req.params;
//   db.run(`DELETE FROM sales WHERE id=?`, [id], function (err) {
//     if (err) res.status(500).json({ error: err.message });
//     else res.json({ changes: this.changes });
//   });
// });

// // ===== Inventory API =====
// app.get('/api/inventory', (req, res) => {
//   db.all(
//     `SELECT inventory.*, products.name_zh as product_name FROM inventory LEFT JOIN products ON inventory.product_id = products.id`,
//     [],
//     (err, rows) => {
//       if (err) res.status(500).json({ error: err.message });
//       else res.json(rows);
//     }
//   );
// });

// app.post('/api/inventory', (req, res) => {
//   const { product_id, component, stock } = req.body;
//   db.run(
//     `INSERT INTO inventory (product_id, component, stock) VALUES (?, ?, ?)`,
//     [product_id, component, stock],
//     function (err) {
//       if (err) res.status(500).json({ error: err.message });
//       else res.json({ id: this.lastID });
//     }
//   );
// });

// app.put('/api/inventory/:id', (req, res) => {
//   const { id } = req.params;
//   const { product_id, component, stock } = req.body;
//   db.run(
//     `UPDATE inventory SET product_id=?, component=?, stock=? WHERE id=?`,
//     [product_id, component, stock, id],
//     function (err) {
//       if (err) res.status(500).json({ error: err.message });
//       else res.json({ changes: this.changes });
//     }
//   );
// });

// app.delete('/api/inventory/:id', (req, res) => {
//   const { id } = req.params;
//   db.run(`DELETE FROM inventory WHERE id=?`, [id], function (err) {
//     if (err) res.status(500).json({ error: err.message });
//     else res.json({ changes: this.changes });
//   });
// });

// // 啟動伺服器
// app.listen(PORT, () => {
//   console.log(`後端伺服器啟動於 http://localhost:${PORT}`);
// });
