const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const tokenAddress = process.env.MLDATA_TOKEN_ADDRESS;
  const recipientAddress = process.env.RECIPIENT_ADDRESS;
  
  if (!tokenAddress) {
    throw new Error("❌ MLDATA_TOKEN_ADDRESS not set in .env file");
  }
  
  if (!recipientAddress) {
    throw new Error("❌ RECIPIENT_ADDRESS not set in .env file");
  }

  const amountToMint = hre.ethers.parseEther("1000"); // 1000 MLDT

  console.log("🔄 Minting MLDataToken...");
  console.log("Token Address:", tokenAddress);
  console.log("Recipient Address:", recipientAddress);
  console.log("Amount: 1000 MLDT\n");

  const MLDataToken = await hre.ethers.getContractAt("MLDataToken", tokenAddress);

  try {
    const tx = await MLDataToken.mint(recipientAddress, amountToMint);
    console.log("📝 Transaction sent:", tx.hash);
    console.log("⏳ Waiting for confirmation...\n");

    await tx.wait();

    const balance = await MLDataToken.balanceOf(recipientAddress);
    console.log("✅ Mint successful!");
    console.log("New balance:", hre.ethers.formatEther(balance), "MLDT");
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.reason) {
      console.error("Reason:", error.reason);
    }
  }
}

main().catch(console.error);
