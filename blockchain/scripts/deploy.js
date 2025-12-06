const hre = require("hardhat");

async function main() {
  const Registry = await hre.ethers.getContractFactory("DataRegistry");
  const registry = await Registry.deploy();

  await registry.waitForDeployment();

  const address = await registry.getAddress();
  console.log("DataRegistry deployed at:", address);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
