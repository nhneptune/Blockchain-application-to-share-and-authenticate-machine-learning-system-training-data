const express = require("express");
const { ethers } = require("ethers");
const { provider, RPC_URL, CONTRACT_ADDRESS } = require("../config");
const { getDatasetById, updateDatasetBlockchainId } = require("../metadataDB");
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
    const { datasetId, privateKey } = req.body;

    if (!datasetId && datasetId !== 0) {
      return res.status(400).json({ error: "datasetId is required" });
    }

    if (!privateKey) {
      return res.status(400).json({ error: "privateKey is required" });
    }

    // Lấy dataset từ local DB
    const dataset = getDatasetById(datasetId);
    if (!dataset) {
      return res.status(404).json({ error: "Dataset not found" });
    }

    // Get latest version
    const latestVersion = dataset.versions[dataset.versions.length - 1];
    if (!latestVersion) {
      return res.status(404).json({ error: "No versions found for dataset" });
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

    // Call registerData function with dataset info
    const tx = await contract.registerData(
      latestVersion.hash,
      dataset.datasetName,
      dataset.description || "",
      dataset.dataType,
      latestVersion.fileSize,
      dataset.license || "CC0"
    );

    // Wait for transaction confirmation
    const receipt = await tx.wait();

    // Update dataset with blockchain ID
    const blockchainId = receipt.logs ? receipt.logs.length - 1 : 0;
    updateDatasetBlockchainId(datasetId, blockchainId);

    return res.json({
      success: true,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      blockchainId,
      dataset: {
        id: dataset.id,
        datasetName: dataset.datasetName,
        totalVersions: dataset.versions.length,
        latestVersion: latestVersion.version,
      },
      message: "Dataset registered on blockchain successfully",
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
