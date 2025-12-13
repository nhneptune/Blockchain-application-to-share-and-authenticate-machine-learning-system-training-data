const express = require("express");
const { getAllDatasets } = require("../metadataDB");

const router = express.Router();

/**
 * GET /contributions
 * Lấy tất cả contributions (datasets) từ versioning DB
 */
router.get("/", (req, res) => {
  try {
    const datasets = getAllDatasets();
    console.log(`\n📊 [CONTRIBUTIONS] Fetching all datasets. Count: ${datasets.length}`);

    // Transform datasets to contributions format
    const items = datasets.map((dataset) => {
      const latestVersion = dataset.versions[dataset.versions.length - 1];
      console.log(`  Dataset ${dataset.id}: ${dataset.datasetName} (${dataset.versions.length} versions)`);
      return {
        id: dataset.id,
        hash: latestVersion.hash,
        owner: dataset.ownerAddress,
        timestamp: new Date(latestVersion.uploadedAt).getTime() / 1000,
        metadata: {
          datasetName: dataset.datasetName,
          description: latestVersion.description,
          dataType: dataset.dataType,
          fileSize: latestVersion.fileSize,
          license: dataset.license,
        },
        version: latestVersion.version,
        totalVersions: dataset.versions.length,
        blockchainId: dataset.blockchainId,
      };
    });

    console.log(`✅ [CONTRIBUTIONS] Returned ${items.length} items`);
    return res.json({
      items,
      count: items.length,
      message: `Found ${items.length} datasets with versioning`,
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
 * POST /contributions
 * Thêm contribution mới
 */
router.post("/", (req, res) => {
  try {
    const { hash, owner, datasetName, description, dataType, fileSize, license } = req.body;

    if (!hash || !owner) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    let metadata = { items: [] };

    if (fs.existsSync(metadataPath)) {
      const data = fs.readFileSync(metadataPath, "utf8");
      metadata = JSON.parse(data);
    }

    const newItem = {
      id: metadata.items.length,
      hash,
      owner,
      timestamp: Math.floor(Date.now() / 1000),
      metadata: {
        datasetName: datasetName || "Unnamed",
        description: description || "",
        dataType: dataType || "raw",
        fileSize: fileSize || 0,
        license: license || "CC0",
      }
    };

    metadata.items.push(newItem);
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    return res.json({ success: true, id: newItem.id });
  } catch (err) {
    console.error("Error in POST /contributions:", err);
    return res.status(500).json({ error: "Failed to save contribution" });
  }
});

module.exports = router;

