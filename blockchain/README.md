# Blockchain Setup Guide

## 📋 Prerequisites

- Node.js >= 16
- npm or yarn
- MetaMask wallet (for testnet)
- Alchemy account (for RPC endpoint)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd blockchain
npm install
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
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
PRIVATE_KEY=your_private_key_here
```

### 3. Get Alchemy API Key

1. Go to [alchemy.com](https://www.alchemy.com/)
2. Sign up / Log in
3. Create new app → Select Sepolia network
4. Copy API Key
5. Paste into `.env`:
```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/PASTE_KEY_HERE
```

### 4. Get MetaMask Private Key

1. Open MetaMask
2. Click account avatar → Settings
3. Security & Privacy → Show Private Key
4. Copy private key
5. Paste into `.env`:
```env
PRIVATE_KEY=paste_key_here
```

⚠️ **Never commit `.env` file!** It's already in `.gitignore`

### 5. Deploy Smart Contracts

```bash
# Deploy to Sepolia testnet
npx hardhat run scripts/deploy.js --network sepolia
```

Expected output:
```
DataRegistry deployed at: .....
```

### 6. Copy Contract Address to Backend

After deployment, copy the contract address and add to `backend/.env`:

```env
DATAREGISTRY_ADDRESS=0x...  # Copy from deploy output
```

---

## 📁 Project Structure

```
blockchain/
├── contracts/
│   ├── DataRegistry.sol      # Main contract
│   └── Lock.sol              # Sample contract
├── scripts/
│   ├── deploy.js             # Deployment script
│   └── checkBalance.js        # Check account balance
├── test/
│   ├── DataRegistry.js
│   └── Lock.js
├── ignition/
│   └── modules/
│       └── Lock.js           # Hardhat Ignition module
├── hardhat.config.js         # Hardhat config (uses .env variables)
├── .env                       # Environment vars (ignored by git, created from .env.example)
├── .env.example               # Template env (committed to git)
├── package.json
└── README.md
```

### 📝 Important Files:

| File | Purpose | Git |
|------|---------|-----|
| `hardhat.config.js` | Hardhat configuration (reads from `.env`) | ✅ Commit |
| `.env` | Environment variables with secret data | ❌ Ignore |
| `.env.example` | Template for `.env` setup | ✅ Commit |
| `contracts/*.sol` | Smart contract source code | ✅ Commit |
| `scripts/*.js` | Deployment and utility scripts | ✅ Commit |


