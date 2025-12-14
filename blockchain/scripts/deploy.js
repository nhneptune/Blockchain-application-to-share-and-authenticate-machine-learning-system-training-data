const hre = require("hardhat");

async function main() {
  // 1. Deploy MLDataToken
  console.log("Deploying MLDataToken...");
  const Token = await hre.ethers.getContractFactory("MLDataToken");
  const initialSupply = hre.ethers.parseUnits("1000000", 18); // 1 million tokens with 18 decimals
  const token = await Token.deploy(initialSupply);
  await token.waitForDeployment();
  console.log("MLDataToken deployed at:", token.target);

  // 2. Deploy DataRegistry with token address
  console.log("\nDeploying DataRegistry...");
  const Registry = await hre.ethers.getContractFactory("DataRegistry");
  const registry = await Registry.deploy(token.target);
  await registry.waitForDeployment();
  console.log("DataRegistry deployed at:", registry.target);

  // 3. Set DataRegistry as minter in token contract
  console.log("\nSetting DataRegistry as token minter...");
  const setRegistryTx = await token.setDataRegistry(registry.target);
  await setRegistryTx.wait();
  console.log("DataRegistry set as minter");

  console.log("\n=== Deployment Summary ===");
  console.log("MLDataToken address:", token.target);
  console.log("DataRegistry address:", registry.target);
  console.log("Token decimals: 18");
  console.log("Initial supply: 1,000,000 MLDT");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
