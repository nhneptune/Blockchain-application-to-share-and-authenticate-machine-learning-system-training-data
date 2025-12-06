# Backend Setup Guide

## 📋 Prerequisites

- Node.js >= 16
- Python 3.10+
- Git

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install

# Install Python ML libraries
pip3 install scikit-learn numpy pandas joblib
```

### 2. Setup Environment Variables

```bash
# Copy template
cp .env.example .env

# Edit .env with your values
nano .env
```

**Required values in `.env`:**
```env
PORT=4000
SEPOLIA_RPC_URL=http://127.0.0.1:8545
DATAREGISTRY_ADDRESS=0x...  # Your deployed contract address
```

### 3. Copy Blockchain Artifact

After deploying your smart contract from `blockchain/`:

```bash
# Option A: Auto-detection (recommended)
# The app will automatically find it from:
# blockchain/artifacts/contracts/DataRegistry.sol/DataRegistry.json

# Option B: Manual copy (if needed)
cp ../blockchain/artifacts/contracts/DataRegistry.sol/DataRegistry.json ./
```

### 4. Start Backend Server

```bash
node index.js
```

Expected output:
```
🚀 Backend listening on port 4000
📋 Routes:
   GET  /health
   POST /upload
   GET  /contributions
   POST /ml/train
PID: 12345
```

### 5. Test Endpoints

```bash
# Health check
curl http://localhost:4000/health

# Train model (Iris dataset)
curl -X POST http://localhost:4000/ml/train \
  -H "Content-Type: application/json" \
  -d '{"mode": "iris"}'

# Upload file
curl -X POST http://localhost:4000/upload \
  -F "file=@data.csv" \
  -F "clientHash=abc123..."

# Get contributions from blockchain
curl http://localhost:4000/contributions
```

## 📁 Project Structure

```
backend/
├── index.js              # Entry point
├── config.js             # Blockchain setup (auto-finds DataRegistry.json)
├── utils.js              # Helper functions
├── .env.example          # Environment template
├── API.md                # API documentation
├── routes/
│   ├── health.js         # Health check
│   ├── upload.js         # File upload
│   ├── contributions.js   # Blockchain data
│   └── ml.js             # ML training
├── py/
│   └── train.py          # Python training script
├── models/               # Trained models (auto-created, ignored by git)
├── uploads/              # Uploaded files (ignored by git)
└── package.json
```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Backend server port | `4000` |
| `SEPOLIA_RPC_URL` | Blockchain RPC endpoint | `http://127.0.0.1:8545` |
| `DATAREGISTRY_ADDRESS` | Deployed contract address | `0x5FbDB2315678afccb333f8a9c36c1224f4fe52b9` |

### DataRegistry.json

- **What it is**: Smart contract ABI (Application Binary Interface)
- **Why needed**: To interact with your deployed contract
- **Where to find**: 
  - Auto-detected from `blockchain/artifacts/contracts/DataRegistry.sol/DataRegistry.json`
  - Or manually copy to `backend/DataRegistry.json`

## 🐛 Troubleshooting

### "DataRegistry.json not found"
```bash
# Solution 1: Deploy blockchain first
cd ../blockchain
npx hardhat run scripts/deploy.js --network localhost

# Solution 2: Copy manually
cp ../blockchain/artifacts/contracts/DataRegistry.sol/DataRegistry.json ./backend/
```

### "No module named 'joblib'"
```bash
# Install Python packages
pip3 install scikit-learn numpy pandas joblib
```

### Port 4000 already in use
```bash
# Change in .env
PORT=4001
```

### Contract address error
```bash
# Check your .env file has valid address
grep DATAREGISTRY_ADDRESS .env
```

## 📚 Documentation

- [API Documentation](./API.md) - Detailed endpoint documentation
- [ML Training](./py/train.py) - Python training script details

## 🔒 Security Notes

- ❌ **Never commit** `.env` file (contains sensitive data)
- ✅ **Always use** `.env.example` as template
- ✅ **Keep contract address** secret if needed
- ❌ **Don't share** private keys or RPC URLs

## 🧪 Testing

```bash
# Test all endpoints
npm test  # (if test scripts added)

# Manual testing
curl http://localhost:4000/health  # Should return status OK
```

## 📝 Common Workflows

### 1. First time setup
```bash
npm install
cp .env.example .env
# Edit .env with your contract address
node index.js
```

### 2. Train model from Iris dataset
```bash
curl -X POST http://localhost:4000/ml/train \
  -H "Content-Type: application/json" \
  -d '{"mode": "iris"}'
```

### 3. Train model from CSV file
```bash
# First upload your CSV file
curl -X POST http://localhost:4000/upload \
  -F "file=@training_data.csv" \
  -F "clientHash=..."

# Then train
curl -X POST http://localhost:4000/ml/train \
  -H "Content-Type: application/json" \
  -d '{"mode": "csv", "files": ["/path/to/training_data.csv"]}'
```

## 🤝 Contributing

When adding new features:
1. Create new route in `routes/` folder
2. Import in `index.js`
3. Update `API.md` with endpoint documentation
4. Test thoroughly before committing

## 📞 Support

For issues:
1. Check `.env` configuration
2. Verify blockchain is running
3. Check API documentation
4. Review error messages in backend logs
