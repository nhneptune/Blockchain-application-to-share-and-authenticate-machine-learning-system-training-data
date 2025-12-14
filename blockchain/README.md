# Blockchain Setup Guide

## 📋 Prerequisites

- Node.js >= 16
- npm or yarn
- MetaMask wallet (for testnet)
- Alchemy account (for RPC endpoint)
- OpenZeppelin Contracts v5.0.0+ (ERC-20 token standard)

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
MLDATA_TOKEN_ADDRESS=0x0000000000000000000000000000000000000000  # Will be set after deploy
DATA_REGISTRY_ADDRESS=0x0000000000000000000000000000000000000000  # Will be set after deploy
RECIPIENT_ADDRESS=0x0000000000000000000000000000000000000000 #Your wallet address
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
# Deploy to Sepolia testnet (MLDataToken + DataRegistry)
npx hardhat run scripts/deploy.js --network sepolia
```

Expected output:
```
✅ MLDataToken deployed at: 0x...
✅ DataRegistry deployed at: 0x...
```

**Copy both addresses to `backend/.env`:**
```env
MLDATA_TOKEN_ADDRESS=0x...      # ERC-20 token address
DATAREGISTRY_ADDRESS=0x...      # Main contract address
```
**Copy dataregistry addresses to `frontend/src/contracts/contract-address.json`:**
```
{
  "DataRegistry": "0xYourDataregistryDeployAddress"
}

```

### 6. Setup Authorization

After deployment, run authorization script to allow DataRegistry to mint tokens:

```bash
npx hardhat run scripts/setupRegistry.js --network sepolia
```

This grants `DataRegistry` permission to call `mintReward()` on `MLDataToken`.

---
---

## 📁 Project Structure

```
blockchain/
├── contracts/
│   ├── MLDataToken.sol       # ERC-20 reward token
│   ├── DataRegistry.sol      # Main registry contract
│   └── Lock.sol              # Sample contract
├── scripts/
│   ├── deploy.js             # Deploy both contracts
│   ├── setupRegistry.js       # Authorize DataRegistry for minting
│   ├── checkBalance.js        # Check account balance
│   └── fixTokenAddress.js     # Emergency fix for token address
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
| `contracts/MLDataToken.sol` | ERC-20 reward token contract | ✅ Commit |
| `contracts/DataRegistry.sol` | Dataset & royalty management contract | ✅ Commit |
| `scripts/deploy.js` | Deploy both contracts to testnet | ✅ Commit |
| `scripts/setupRegistry.js` | Grant minting permission to DataRegistry | ✅ Commit |


