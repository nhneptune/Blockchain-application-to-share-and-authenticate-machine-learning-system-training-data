# Backend API Documentation

## 📋 Endpoints

### 1. Health Check
```
GET /health
```
Kiểm tra trạng thái backend.

**Response:**
```json
{
  "status": "OK",
  "contract": "0x...",
  "rpc": "http://127.0.0.1:8545"
}
```

---

### 2. Upload File
```
POST /upload
```
Upload file và verify hash SHA256.

**Body:**
```json
{
  "file": <binary file>,
  "clientHash": "sha256hash..."
}
```

**Response:**
```json
{
  "clientHash": "...",
  "serverHash": "...",
  "match": true,
  "filename": "1234567890.csv"
}
```

---

### 3. Get Contributions
```
GET /contributions?owner=0x...&limit=10
```
Đọc dữ liệu từ blockchain contract.

**Query Params:**
- `owner` (optional): Lọc theo địa chỉ chủ sở hữu
- `limit` (optional): Giới hạn số kết quả (max 1000)

**Response:**
```json
{
  "fromCache": false,
  "count": 5,
  "total": 10,
  "items": [
    {
      "id": 0,
      "owner": "0x...",
      "hash": "abc123...",
      "timestamp": 1234567890
    }
  ]
}
```

---

### 4. Train ML Model
```
POST /ml/train
```
Train machine learning model (Iris dataset hoặc CSV files).

**Body - Mode Iris (default):**
```json
{
  "mode": "iris"
}
```

**Body - Mode CSV:**
```json
{
  "mode": "csv",
  "files": [
    "/path/to/file1.csv",
    "/path/to/file2.csv"
  ]
}
```

**Response:**
```json
{
  "ok": true,
  "result": {
    "success": true,
    "mode": "iris",
    "n_samples": 150,
    "accuracy": 0.98,
    "report": {
      "0": {
        "precision": 0.99,
        "recall": 0.98,
        "f1-score": 0.98,
        "support": 13
      },
      ...
    },
    "confusion_matrix": [[13, 0, 0], [0, 14, 1], [0, 1, 12]],
    "model_path": "/path/to/models/model.pkl"
  }
}
```

**CSV Format Requirement:**
- CSV phải có cột `label` (target/class)
- Các cột khác sẽ được dùng làm features
- Example:
  ```csv
  feature1,feature2,feature3,label
  1.0,2.0,3.0,0
  1.1,2.1,3.1,0
  ```

---

## 🗂️ Project Structure

```
backend/
├── index.js              # Entry point
├── config.js             # Blockchain setup
├── utils.js              # Helper functions
├── routes/
│   ├── health.js         # Health check endpoint
│   ├── upload.js         # File upload endpoint
│   ├── contributions.js   # Blockchain data endpoint
│   └── ml.js             # ML training endpoint
├── py/
│   └── train.py          # Python training script
├── models/               # Trained models (auto-created)
├── uploads/              # Uploaded files
└── package.json
```

---

## 🚀 Setup & Run

### Install Dependencies
```bash
# Node packages
npm install

# Python packages (Ubuntu/WSL)
pip3 install scikit-learn numpy pandas joblib
```

### Start Backend
```bash
node index.js
```

### Test Endpoints
```bash
# Health check
curl http://localhost:4000/health

# Train model (Iris)
curl -X POST http://localhost:4000/ml/train \
  -H "Content-Type: application/json" \
  -d '{"mode": "iris"}'

# Train model (CSV)
curl -X POST http://localhost:4000/ml/train \
  -H "Content-Type: application/json" \
  -d '{"mode": "csv", "files": ["/abs/path/to/data.csv"]}'
```

---

## 📝 Notes

- **Cache**: Endpoint `/contributions` có cache 10 giây
- **Model Path**: Models được lưu tại `backend/models/model.pkl`
- **CSV Support**: Chỉ hỗ trợ CSV với cột `label`
- **Error Handling**: Xem chi tiết error trong response `error` field
