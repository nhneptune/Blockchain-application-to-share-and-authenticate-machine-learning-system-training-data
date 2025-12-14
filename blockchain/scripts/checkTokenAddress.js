const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const dataRegistryAddress = process.env.DATA_REGISTRY_ADDRESS;
  const mlDataTokenAddress = process.env.MLDATA_TOKEN_ADDRESS;

  console.log(`🔍 Checking DataRegistry state...`);
  console.log(`   DataRegistry address: ${dataRegistryAddress}`);
  console.log(`   Expected MLDataToken: ${mlDataTokenAddress}`);

  const Registry = await hre.ethers.getContractAt("DataRegistry", dataRegistryAddress);
  const currentTokenAddress = await Registry.tokenAddress();
  
  console.log(`\n📋 Current state on blockchain:`);
  console.log(`   tokenAddress stored: ${currentTokenAddress}`);
  console.log(`   Match expected: ${currentTokenAddress.toLowerCase() === mlDataTokenAddress.toLowerCase()}`);

  if (currentTokenAddress.toLowerCase() !== mlDataTokenAddress.toLowerCase()) {
    console.log(`\n❌ Mismatch! Fixing...`);
    const tx = await Registry.setTokenAddress(mlDataTokenAddress);
    console.log(`   TX: ${tx.hash}`);
    await tx.wait();
    console.log(`✅ Fixed!`);
  } else {
    console.log(`\n✅ Token address is correct!`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
