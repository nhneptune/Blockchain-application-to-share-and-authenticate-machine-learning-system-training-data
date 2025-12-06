const hre = require("hardhat");

async function main() {
  const address = "0xFF8128F12B5f4A1545a266713A67becFdB1dc944";
  const balance = await hre.ethers.provider.getBalance(address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });