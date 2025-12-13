const express = require("express");
const fs = require("fs");
const path = require("path");
const { getAllDatasets, getDatasetById, updateDatasetBlockchainId } = require("../metadataDB");

const router = express.Router();

// Path to contributions.json file
const contributionsPath = path.join(__dirname, "..", "contributions.json");

// Initialize contributions.json if not exists
function initContributionsFile() {
  if (!fs.existsSync(contributionsPath)) {
    fs.writeFileSync(
      contributionsPath,
      JSON.stringify({ contributions: [] }, null, 2)
    );
  }
}

// Get all contributions from contributions.json
function getAllContributions() {
  try {
    if (!fs.existsSync(contributionsPath)) {
      return [];
    }
    const data = fs.readFileSync(contributionsPath, "utf8");
    const parsed = JSON.parse(data);
    return parsed.contributions || [];
  } catch (err) {
    console.error("Error reading contributions.json:", err);
    return [];
  }
}

// Add contribution to contributions.json
function addContribution(contribution) {
  try {
    initContributionsFile();
    const data = JSON.parse(fs.readFileSync(contributionsPath, "utf8"));
    data.contributions.push(contribution);
    fs.writeFileSync(contributionsPath, JSON.stringify(data, null, 2));
    console.log(`✅ [CONTRIBUTIONS] Added contribution entry: ${contribution.metadata.datasetName}`);
    return true;
  } catch (err) {
    console.error("Error adding contribution:", err);
    return false;
  }
}

/**
 * GET /contributions
 * Lấy tất cả contributions đã được đăng ký lên blockchain
 * Từ contributions.json (chứa tất cả upload/update entries)
 */
router.get("/", (req, res) => {
  try {
    initContributionsFile();
    const items = getAllContributions();
    
    console.log(`\n📊 [CONTRIBUTIONS] GET / - Returning ${items.length} contribution entries`);

    return res.json({
      items,
      count: items.length,
      message: `Found ${items.length} blockchain-verified contributions`,
    });
  } catch (err) {
    console.error("❌ Error reading contributions:", err);
    return res.status(500).json({
      error: "Failed to read contributions",
      detail: err.message,
    });
  }
});

/**
 * POST /contributions/register
 * Ghi contribution vào contributions.json sau khi blockchain register thành công
 * Cách 1: Chỉ ghi vào contribution sau khi blockchain confirm
 * 
 * Body:
 * - datasetId: ID của dataset
 * - blockchainId: ID trên blockchain (từ transaction receipt)
 * - type: "upload" (tạo dataset mới) hoặc "update" (cập nhật version)
 */
router.post("/register", (req, res) => {
  try {
    const { datasetId, blockchainId, type = "upload" } = req.body;

    if (!datasetId && datasetId !== 0) {
      return res.status(400).json({ error: "datasetId is required" });
    }

    // Lấy dataset từ metadataDB
    const dataset = getDatasetById(datasetId);

    if (!dataset) {
      return res.status(404).json({ error: "Dataset not found" });
    }

    console.log(`\n📝 [CONTRIBUTIONS] Registering dataset ${datasetId} with blockchainId ${blockchainId} (type: ${type})`);

    // 🔥 QUAN TRỌNG: Cập nhật blockchainId vào metadataDB
    if (blockchainId !== null && blockchainId !== undefined) {
      updateDatasetBlockchainId(datasetId, blockchainId);
      console.log(`✅ [CONTRIBUTIONS] Updated blockchainId in metadataDB: ${blockchainId}`);
    }

    const latestVersion = dataset.versions[dataset.versions.length - 1];

    // 🔥 Tạo contribution entry mới (mỗi upload/update là 1 entry)
    const contribution = {
      id: dataset.id,
      hash: latestVersion.hash,
      owner: dataset.ownerAddress,
      timestamp: Math.floor(Date.now() / 1000),
      type: type, // "upload" hoặc "update"
      version: latestVersion.version,
      blockchainId: blockchainId || dataset.blockchainId,
      metadata: {
        datasetName: dataset.datasetName,
        description: latestVersion.description,
        dataType: dataset.dataType,
        fileSize: latestVersion.fileSize,
        license: dataset.license,
      },
    };

    // 🔥 Thêm contribution vào contributions.json
    const added = addContribution(contribution);

    if (!added) {
      return res.status(500).json({ error: "Failed to save contribution" });
    }

    console.log(`✅ [CONTRIBUTIONS] Dataset registered successfully`);
    console.log(`   Dataset: ${dataset.datasetName}`);
    console.log(`   Version: ${latestVersion.version}`);
    console.log(`   Type: ${type}`);
    console.log(`   Hash: ${latestVersion.hash.substring(0, 16)}...`);
    console.log(`   BlockchainId: ${blockchainId}`);

    return res.json({
      success: true,
      contribution,
      message: "Contribution registered successfully",
    });
  } catch (err) {
    console.error("❌ Error in POST /contributions/register:", err);
    return res.status(500).json({
      error: "Failed to register contribution",
      detail: err.message,
    });
  }
});

module.exports = router;

