const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const dataRegistryAddress = process.env.DATA_REGISTRY_ADDRESS;
  const mlDataTokenAddress = process.env.MLDATA_TOKEN_ADDRESS;

  console.log(`🔧 Setting token address in DataRegistry...`);
  console.log(`   DataRegistry: ${dataRegistryAddress}`);
  console.log(`   MLDataToken: ${mlDataTokenAddress}`);

  const Registry = await hre.ethers.getContractAt("DataRegistry", dataRegistryAddress);
  
  const tx = await Registry.setTokenAddress(mlDataTokenAddress);
  console.log(`   TX: ${tx.hash}`);
  
  await tx.wait();
  console.log(`✅ Token address set successfully!`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
