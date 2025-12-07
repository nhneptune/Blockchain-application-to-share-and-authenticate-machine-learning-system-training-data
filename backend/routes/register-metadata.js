const express = require("express");
const { ethers } = require("ethers");
const { provider, RPC_URL, CONTRACT_ADDRESS } = require("../config");
const { getMetadataById, updateBlockchainId } = require("../metadataDB");
const fs = require("fs");
const path = require("path");

const router = express.Router();

/**
 * POST /register-metadata
 * Register metadata lên blockchain
 * 
 * Body:
 * - metadataId: ID của metadata trong local DB
 * - privateKey: Private key để sign transaction
 */
router.post("/", async (req, res) => {
  try {
    const { metadataId, privateKey } = req.body;

    if (!metadataId || metadataId === undefined) {
      return res.status(400).json({ error: "metadataId is required" });
    }

    if (!privateKey) {
      return res.status(400).json({ error: "privateKey is required" });
    }

    // Lấy metadata từ local DB
    const metadata = getMetadataById(metadataId);
    if (!metadata) {
      return res.status(404).json({ error: "Metadata not found" });
    }

    // Load ABI
    const artifactPath = path.join(
      __dirname,
      "..",
      "DataRegistry.json"
    );
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

    // Create signer
    const signer = new ethers.Wallet(privateKey, provider);

    // Create contract instance with signer
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      artifact.abi,
      signer
    );

    // Call registerData function
    const tx = await contract.registerData(
      metadata.hash,
      metadata.datasetName,
      metadata.description,
      metadata.dataType,
      metadata.fileSize,
      metadata.license
    );

    // Wait for transaction confirmation
    const receipt = await tx.wait();

    // Update metadata với blockchain ID
    const blockchainId = receipt.logs ? receipt.logs.length - 1 : 0;
    updateBlockchainId(metadataId, blockchainId);

    return res.json({
      success: true,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      blockchainId,
      metadata,
      message: "Metadata registered on blockchain successfully",
    });
  } catch (err) {
    console.error("Error in POST /register-metadata:", err);
    return res.status(500).json({
      error: "Failed to register metadata",
      detail: err.message,
    });
  }
});

module.exports = router;
