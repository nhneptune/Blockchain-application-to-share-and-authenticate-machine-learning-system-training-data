# Frontend Setup Guide

## 📋 Prerequisites

- Node.js >= 16
- npm or yarn
- Modern web browser (Chrome, Firefox, Safari, Edge)
- MetaMask browser extension

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Copy Contract ABI from Blockchain

After deploying contracts in blockchain folder:

```bash
# Copy DataRegistry.json from blockchain artifacts to frontend
cp ../blockchain/artifacts/contracts/DataRegistry.sol/DataRegistry.json src/contracts/
```

This file contains the contract ABI needed for frontend to interact with the contract.

### 3. Update Contract Address

Edit `src/contracts/contract-address.json` with deployed contract address:

```json
{
  "DataRegistry": "0xYourDataregistryDeployAddress"
}
```

Get the address from blockchain deployment output:
```bash
# After running: npx hardhat run scripts/deploy.js --network sepolia
# Look for: "DataRegistry deployed at: 0x..."
```

### 4. Start Development Server

```bash
npm run dev
```

Expected output:
```
  VITE v5.0.0  ready in 123 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h + enter to show help
```

Open browser to `http://localhost:5173/`

### 5. Setup MetaMask

1. **Install MetaMask** - [metamask.io](https://metamask.io/)
2. **Create/Import Wallet** - Follow MetaMask setup
3. **Switch to Sepolia Network** - Settings → Networks → Add Sepolia
4. **Request Test ETH** - Visit [sepoliafaucet.com](https://www.sepoliafaucet.com/)

---

## 🏗️ Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ConnectWallet.jsx      # Wallet connection
│   │   ├── RegisterData.jsx         # Register data form
│   │   ├── UploadFile.jsx           # File upload form
│   │   └── ContributionsTable.jsx   # Display contributions
│   ├── contracts/
│   │   ├── DataRegistry.json        # Contract ABI
│   │   └── contract-address.json    # Contract address config
│   ├── App.jsx                      # Main app component
│   ├── App.css                      # App styles
│   ├── main.jsx                     # React entry point
│   └── index.css                    # Global styles
├── public/
│   └── vite.svg                     # Static assets
├── package.json                     # Dependencies
├── vite.config.js                   # Vite configuration
├── eslint.config.js                 # ESLint config
├── index.html                       # HTML template
└── README.md                        # Documentation
```


## 💡 Key Features

### 1. **Connect Wallet**
- Connect MetaMask wallet
- Display wallet address
- Show account balance

### 2. **Register Data**
- Input data hash and description
- Submit to blockchain contract
- Confirm transaction

### 3. **Upload File**
- Upload CSV/data files
- Calculate file hash
- Verify hash matches blockchain

### 4. **View Contributions**
- Display all registered data from contract
- Filter by owner address
- Show timestamp and hash
---

## 📱 UI Components

### ConnectWallet
Handles MetaMask connection and displays wallet info
- Props: `onConnect`, `onDisconnect`
- Shows: Wallet address, balance, network

### RegisterData
Form to register data on blockchain
- Input: Data hash, description
- Output: Transaction confirmation

### UploadFile
File upload with hash verification
- Input: CSV file
- Output: File hash, verification status

### ContributionsTable
Displays blockchain data
- Shows: ID, owner, hash, timestamp
- Filter: By owner address

## 🔄 Development Workflow

```
1. Deploy blockchain contracts: 
   cd blockchain && npx hardhat run scripts/deploy.js --network sepolia
   
2. Copy contract ABI: 
   cp blockchain/artifacts/contracts/DataRegistry.sol/DataRegistry.json frontend/src/contracts/
   
3. Update contract address in frontend/src/contracts/contract-address.json
   
4. Start backend: 
   cd backend && node index.js
   
5. Start frontend: 
   cd frontend && npm run dev
   
6. Open http://localhost:5173
   
7. Connect MetaMask
   
8. Test features
```
---

## 🤝 Contributing

When adding features:
1. Create component in `src/components/`
2. Import in `App.jsx`
3. Update styles in `App.css`
4. Test with backend running
5. Lint: `npm run lint`

---

## ✅ Setup Checklist

Before first run:
- [ ] Run `npm install` in frontend folder
- [ ] Deploy blockchain contracts
- [ ] Copy `DataRegistry.json` to `src/contracts/`
- [ ] Update contract address in `contract-address.json`
- [ ] Backend is running on port 4000
- [ ] MetaMask installed and configured
- [ ] Connected to Sepolia testnet
- [ ] Run `npm run dev`
