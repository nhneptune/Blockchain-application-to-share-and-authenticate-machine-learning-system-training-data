const express = require("express");
const { contract } = require("../config");
const {
  createVersion,
  getVersionsByDataId,
  generateNextVersion,
  isValidVersion,
  getAllVersions,
} = require("../versioningDB");
const {
  getDatasetById,
  getVersions,
  getLatestVersion,
  getAllDatasets,
  getDatasetsByOwner,
  updateDatasetBlockchainId,
  updateVersionBlockchainId,
} = require("../metadataDB");

const router = express.Router();

// ========== POST ROUTES ==========

/**
 * POST /versions/create
 * Tạo version mới cho dataset
 */
router.post("/create", (req, res) => {
  try {
    const { dataId, hash, changeLog, version, updatedBy, datasetName } = req.body;
    
    console.log("📨 POST /versions/create received:", {
      dataId,
      hash: hash?.substring(0, 20) + "...",
      version,
      changeLog: changeLog?.substring(0, 30),
      updatedBy,
      datasetName,
    });

    if (!dataId && dataId !== 0) {
      return res.status(400).json({ error: "dataId is required" });
    }
    if (!hash) {
      return res.status(400).json({ error: "hash is required" });
    }
    if (!updatedBy) {
      return res.status(400).json({ error: "updatedBy (wallet address) is required" });
    }
    if (!datasetName) {
      return res.status(400).json({ error: "datasetName is required" });
    }

    const existingVersions = getVersionsByDataId(dataId);

    let versionString = version;
    if (!versionString) {
      versionString = generateNextVersion(existingVersions);
    } else if (!isValidVersion(versionString)) {
      return res.status(400).json({
        error: "Invalid version format",
        example: "1.0, 1.1, 2.0",
      });
    }

    const versionId = createVersion({
      dataId,
      version: versionString,
      hash,
      changeLog: changeLog || "No description",
      updatedBy,
      datasetName,
    });

    console.log(`✅ Version created: dataId=${dataId}, version=${versionString}, versionId=${versionId}`);

    return res.json({
      success: true,
      versionId,
      version: versionString,
      message: "Version created successfully",
    });
  } catch (err) {
    console.error("Error in POST /versions/create:", err);
    return res.status(500).json({ error: "Failed to create version", detail: err.message });
  }
});

/**
 * POST /versions/register-on-blockchain
 */
router.post("/register-on-blockchain", async (req, res) => {
  try {
    const { dataId, versionString, hash, changeLog } = req.body;

    if (!dataId && dataId !== 0) {
      return res.status(400).json({ error: "dataId is required" });
    }
    if (!versionString) {
      return res.status(400).json({ error: "versionString is required" });
    }
    if (!hash) {
      return res.status(400).json({ error: "hash is required" });
    }

    try {
      const tx = await contract.createVersion(
        dataId,
        versionString,
        hash,
        changeLog || ""
      );

      const receipt = await tx.wait();

      return res.json({
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        message: "Version registered on blockchain",
      });
    } catch (contractErr) {
      if (contractErr.code === "ACTION_REJECTED" || contractErr.message?.includes("User rejected")) {
        return res.status(400).json({ error: "Transaction cancelled by user" });
      }

      return res.status(400).json({
        error: "Blockchain registration failed",
        detail: contractErr.message,
      });
    }
  } catch (err) {
    console.error("Error in POST /versions/register-on-blockchain:", err);
    return res.status(500).json({
      error: "Failed to register version",
      detail: err.message,
    });
  }
});

/**
 * POST /versions/blockchain-id
 */
router.post("/blockchain-id", (req, res) => {
  try {
    const { datasetId, version, blockchainId } = req.body;

    if (!datasetId || !version || !blockchainId) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["datasetId", "version", "blockchainId"],
      });
    }

    updateVersionBlockchainId(datasetId, version, blockchainId);

    return res.json({
      success: true,
      message: `Blockchain ID updated for dataset ${datasetId}, version ${version}`,
    });
  } catch (err) {
    console.error("Error updating blockchain ID:", err);
    return res.status(500).json({
      error: "Failed to update blockchain ID",
      detail: err.message,
    });
  }
});

// ========== GET NAMED ROUTES (BEFORE parameter routes) ==========

/**
 * GET /versions/all
 * Lấy tất cả datasets
 */
router.get("/all", (req, res) => {
  try {
    console.log("🔍 [VERSIONS] GET /all - Fetching all datasets from metadataDB");
    const datasets = getAllDatasets();
    console.log(`✅ Found ${datasets.length} datasets`);

    return res.json({
      success: true,
      totalDatasets: datasets.length,
      items: datasets.map((d) => {
        const latestVersion = d.versions[d.versions.length - 1];
        return {
          id: d.id,
          datasetName: d.datasetName,
          dataType: d.dataType,
          ownerAddress: d.ownerAddress,
          license: d.license,
          createdAt: d.createdAt,
          totalVersions: d.versions.length,
          latestVersion: latestVersion.version,
          currentHash: latestVersion.hash,
          currentFileSize: latestVersion.fileSize,
          blockchainId: d.blockchainId,
          versions: d.versions.map((v) => ({
            version: v.version,
            hash: v.hash,
            filename: v.filename,
            fileSize: v.fileSize,
            description: v.description,
            changelog: v.changelog,
            uploadedAt: v.uploadedAt,
            blockchainId: v.blockchainId,
          })),
          metadata: {
            datasetName: d.datasetName,
            dataType: d.dataType,
            fileSize: latestVersion.fileSize,
          },
        };
      }),
    });
  } catch (err) {
    console.error("Error in GET /versions/all:", err);
    return res.status(500).json({
      error: "Failed to fetch datasets",
      detail: err.message,
    });
  }
});

/**
 * GET /versions/dataset/:datasetId
 * Lấy tất cả versions của dataset
 */
router.get("/dataset/:datasetId", (req, res) => {
  try {
    const datasetId = parseInt(req.params.datasetId);
    console.log(`\n📜 [VERSIONS] Fetching versions for dataset ${datasetId}`);
    
    const dataset = getDatasetById(datasetId);

    if (!dataset) {
      console.log(`❌ Dataset ${datasetId} not found`);
      return res.status(404).json({ error: "Dataset not found" });
    }

    console.log(`✅ Found dataset: ${dataset.datasetName} with ${dataset.versions.length} versions`);
    dataset.versions.forEach((v, idx) => {
      console.log(`  v${v.version}: ${v.hash.substring(0, 16)}... (${v.changelog})`);
    });

    return res.json({
      success: true,
      datasetId,
      datasetName: dataset.datasetName,
      totalVersions: dataset.versions.length,
      versions: dataset.versions.map((v) => ({
        version: v.version,
        hash: v.hash,
        filename: v.filename,
        fileSize: v.fileSize,
        description: v.description,
        changelog: v.changelog,
        uploadedAt: v.uploadedAt,
        blockchainId: v.blockchainId,
      })),
    });
  } catch (err) {
    console.error("❌ Error fetching versions:", err);
    return res.status(500).json({ error: "Failed to fetch versions", detail: err.message });
  }
});

/**
 * GET /versions/latest/:datasetId
 * Lấy version mới nhất của dataset
 */
router.get("/latest/:datasetId", (req, res) => {
  try {
    const datasetId = parseInt(req.params.datasetId);
    const latestVersion = getLatestVersion(datasetId);

    if (!latestVersion) {
      return res.status(404).json({ error: "No versions found for dataset" });
    }

    const dataset = getDatasetById(datasetId);

    return res.json({
      success: true,
      datasetId,
      datasetName: dataset.datasetName,
      latestVersion: {
        version: latestVersion.version,
        hash: latestVersion.hash,
        filename: latestVersion.filename,
        fileSize: latestVersion.fileSize,
        description: latestVersion.description,
        changelog: latestVersion.changelog,
        uploadedAt: latestVersion.uploadedAt,
        blockchainId: latestVersion.blockchainId,
      },
    });
  } catch (err) {
    console.error("Error fetching latest version:", err);
    return res.status(500).json({ error: "Failed to fetch latest version", detail: err.message });
  }
});

/**
 * GET /versions/owner/:ownerAddress
 * Lấy tất cả datasets của owner
 */
router.get("/owner/:ownerAddress", (req, res) => {
  try {
    const ownerAddress = req.params.ownerAddress;
    const datasets = getDatasetsByOwner(ownerAddress);

    return res.json({
      success: true,
      ownerAddress,
      totalDatasets: datasets.length,
      datasets: datasets.map((d) => ({
        id: d.id,
        datasetName: d.datasetName,
        dataType: d.dataType,
        license: d.license,
        createdAt: d.createdAt,
        totalVersions: d.versions.length,
        latestVersion: d.versions[d.versions.length - 1].version,
        currentHash: d.versions[d.versions.length - 1].hash,
        blockchainId: d.blockchainId,
      })),
    });
  } catch (err) {
    console.error("Error fetching owner datasets:", err);
    return res.status(500).json({
      error: "Failed to fetch owner datasets",
      detail: err.message,
    });
  }
});

// ========== GET PARAMETER ROUTES (AFTER named routes) ==========

/**
 * GET /versions/:dataId (legacy)
 * Backward compatibility
 */
router.get("/:dataId", (req, res) => {
  try {
    const { dataId } = req.params;

    if (!dataId || isNaN(dataId)) {
      return res.status(400).json({ error: "Invalid dataId" });
    }

    const versions = getVersionsByDataId(Number(dataId));

    return res.json({
      dataId: Number(dataId),
      count: versions.length,
      versions,
    });
  } catch (err) {
    console.error("Error in GET /versions/:dataId:", err);
    return res.status(500).json({ error: "Failed to fetch versions", detail: err.message });
  }
});

/**
 * GET /versions/:dataId/latest (legacy)
 */
router.get("/:dataId/latest", (req, res) => {
  try {
    const { dataId } = req.params;

    if (!dataId || isNaN(dataId)) {
      return res.status(400).json({ error: "Invalid dataId" });
    }

    const versions = getVersionsByDataId(Number(dataId));

    if (versions.length === 0) {
      return res.json({
        dataId: Number(dataId),
        latest: null,
        message: "No versions found",
      });
    }

    const latest = versions[0]; // Already sorted, newest first

    return res.json({
      dataId: Number(dataId),
      latest,
    });
  } catch (err) {
    console.error("Error in GET /versions/:dataId/latest:", err);
    return res.status(500).json({ error: "Failed to fetch latest version", detail: err.message });
  }
});

module.exports = router;
