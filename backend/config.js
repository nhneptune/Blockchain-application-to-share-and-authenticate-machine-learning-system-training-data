const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");

// ==================== BLOCKCHAIN SETUP ====================

// Load ABI từ DataRegistry.json
// Thử tìm trong 2 vị trí: backend folder hoặc blockchain/artifacts
function findArtifact() {
  const paths = [
    path.join(__dirname, "DataRegistry.json"),
    path.join(__dirname, "..", "blockchain", "artifacts", "contracts", "DataRegistry.sol", "DataRegistry.json")
  ];
  
  for (const p of paths) {
    if (fs.existsSync(p)) {
      console.log(`✅ Found artifact at: ${p}`);
      return p;
    }
  }
  
  throw new Error(
    "ERROR: DataRegistry.json not found!\n" +
    "Please copy it from:\n" +
    "  blockchain/artifacts/contracts/DataRegistry.sol/DataRegistry.json\n" +
    "To:\n" +
    "  backend/DataRegistry.json"
  );
}

const artifactPath = findArtifact();
const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

// Provider (read-only)
const RPC_URL = process.env.SEPOLIA_RPC_URL || "http://127.0.0.1:8545";
const provider = new ethers.JsonRpcProvider(RPC_URL);

// Contract instance (read-only)
const CONTRACT_ADDRESS = process.env.DATAREGISTRY_ADDRESS;
if (!CONTRACT_ADDRESS) {
  console.error("ERROR: set DATAREGISTRY_ADDRESS in .env");
  process.exit(1);
}
const contract = new ethers.Contract(CONTRACT_ADDRESS, artifact.abi, provider);

// In-memory cache để giảm RPC calls
let cache = { ts: 0, data: null, ttl: 10 };

module.exports = {
  contract,
  provider,
  RPC_URL,
  CONTRACT_ADDRESS,
  cache,
  setCache: (newCache) => {
    cache = newCache;
  },
  getCache: () => cache
};
