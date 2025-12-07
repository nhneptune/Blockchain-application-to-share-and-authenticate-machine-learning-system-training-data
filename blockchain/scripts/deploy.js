const hre = require("hardhat");

async function main() {
  const Registry = await hre.ethers.getContractFactory("DataRegistry");
  console.log("Deploying DataRegistry...");

  const registry = await Registry.deploy();

  await registry.waitForDeployment();

  console.log("DataRegistry deployed at:", registry.target);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
