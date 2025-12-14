const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const tokenAddress = process.env.MLDATA_TOKEN_ADDRESS;
  const registryAddress = process.env.DATA_REGISTRY_ADDRESS;

  if (!tokenAddress || !registryAddress) {
    throw new Error("❌ MLDATA_TOKEN_ADDRESS or DATA_REGISTRY_ADDRESS not set in .env file");
  }

  console.log("🔧 Setting up DataRegistry as minter...");
  console.log("Token Address:", tokenAddress);
  console.log("Registry Address:", registryAddress);
  console.log();

  const token = await hre.ethers.getContractAt("MLDataToken", tokenAddress);

  try {
    const tx = await token.setDataRegistry(registryAddress);
    console.log("📝 Transaction sent:", tx.hash);
    console.log("⏳ Waiting for confirmation...\n");

    await tx.wait();

    const currentRegistry = await token.dataRegistry();
    console.log("✅ Setup successful!");
    console.log("DataRegistry is now authorized to mint tokens");
    console.log("Current minter address:", currentRegistry);
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.reason) {
      console.error("Reason:", error.reason);
    }
  }
}

main().catch(console.error);