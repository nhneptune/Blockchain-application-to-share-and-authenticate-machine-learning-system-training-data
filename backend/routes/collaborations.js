const express = require("express");
const { getDatasetById, readDB, writeDB, getAllDatasets } = require("../metadataDB");

const router = express.Router();

/**
 * POST /collaborations/:datasetId/add-contributor
 * Thêm contributor vào dataset
 * 
 * Body:
 * - contributorAddress: wallet address của contributor
 * - role: "editor" hoặc "viewer"
 * - ownerAddress: wallet address của chủ sở hữu (để verify quyền)
 */
router.post("/:datasetId/add-contributor", (req, res) => {
  try {
    const { datasetId } = req.params;
    const { contributorAddress, role = "editor", ownerAddress } = req.body;

    if (!contributorAddress || !ownerAddress) {
      return res.status(400).json({ error: "Missing required fields: contributorAddress, ownerAddress" });
    }

    if (role !== "editor" && role !== "viewer") {
      return res.status(400).json({ error: "Invalid role. Must be 'editor' or 'viewer'" });
    }

    const dataset = getDatasetById(parseInt(datasetId));
    if (!dataset) {
      return res.status(404).json({ error: "Dataset not found" });
    }

    console.log(`\n👥 [COLLABORATIONS] Adding contributor to dataset ${datasetId}`);

    // ✅ Verify: Chỉ owner mới có thể add contributor
    if (dataset.ownerAddress.toLowerCase() !== ownerAddress.toLowerCase()) {
      return res.status(403).json({ error: "Only owner can add contributors" });
    }

    // ✅ Check duplicate
    const exists = dataset.contributors?.some(
      c => c.address.toLowerCase() === contributorAddress.toLowerCase()
    );
    if (exists) {
      return res.status(400).json({ error: "Contributor already exists" });
    }

    // ✅ Không thể add chính mình (owner đã là contributor)
    if (contributorAddress.toLowerCase() === ownerAddress.toLowerCase()) {
      return res.status(400).json({ error: "Owner is already a contributor" });
    }

    // ✅ Initialize contributors array nếu chưa có
    if (!dataset.contributors) {
      dataset.contributors = [
        {
          address: dataset.ownerAddress,
          role: "owner",
          addedAt: new Date().toISOString(),
        },
      ];
    }

    // ✅ Thêm contributor
    dataset.contributors.push({
      address: contributorAddress.toLowerCase(),
      role: role,
      addedAt: new Date().toISOString(),
    });

    // ✅ Lưu changes vào database
    const db = readDB();
    const datasetIndex = db.datasets.findIndex(d => d.id === parseInt(datasetId));
    if (datasetIndex !== -1) {
      db.datasets[datasetIndex] = dataset;
    }
    writeDB(db);

    console.log(`✅ [COLLABORATIONS] Added contributor ${contributorAddress} with role: ${role}`);
    console.log(`📝 [COLLABORATIONS] Dataset now has ${dataset.contributors.length} contributors`);

    return res.json({
      success: true,
      message: `Contributor ${contributorAddress.substring(0, 10)}... added with role: ${role}`,
      contributors: dataset.contributors,
    });
  } catch (err) {
    console.error("❌ Error adding contributor:", err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /collaborations/:datasetId/remove-contributor/:address
 * Xóa contributor khỏi dataset
 */
router.delete("/:datasetId/remove-contributor/:address", (req, res) => {
  try {
    const { datasetId, address } = req.params;
    const { ownerAddress } = req.body;

    if (!ownerAddress) {
      return res.status(400).json({ error: "ownerAddress is required" });
    }

    const dataset = getDatasetById(parseInt(datasetId));
    if (!dataset) {
      return res.status(404).json({ error: "Dataset not found" });
    }

    console.log(`\n👥 [COLLABORATIONS] Removing contributor from dataset ${datasetId}`);

    // ✅ Verify: Chỉ owner mới có thể remove
    if (dataset.ownerAddress.toLowerCase() !== ownerAddress.toLowerCase()) {
      return res.status(403).json({ error: "Only owner can remove contributors" });
    }

    // ✅ Không thể remove owner
    if (address.toLowerCase() === dataset.ownerAddress.toLowerCase()) {
      return res.status(400).json({ error: "Cannot remove dataset owner" });
    }

    // ✅ Initialize contributors array nếu chưa có
    if (!dataset.contributors) {
      dataset.contributors = [
        {
          address: dataset.ownerAddress,
          role: "owner",
          addedAt: new Date().toISOString(),
        },
      ];
    }

    // ✅ Xóa contributor
    const initialLength = dataset.contributors.length;
    dataset.contributors = dataset.contributors.filter(
      c => c.address.toLowerCase() !== address.toLowerCase()
    );

    if (dataset.contributors.length === initialLength) {
      return res.status(404).json({ error: "Contributor not found" });
    }

    // ✅ Lưu changes vào database
    const db = readDB();
    const datasetIndex = db.datasets.findIndex(d => d.id === parseInt(datasetId));
    if (datasetIndex !== -1) {
      db.datasets[datasetIndex] = dataset;
    }
    writeDB(db);

    console.log(`✅ [COLLABORATIONS] Removed contributor ${address}`);
    console.log(`📝 [COLLABORATIONS] Dataset now has ${dataset.contributors.length} contributors`);

    return res.json({
      success: true,
      message: `Contributor ${address.substring(0, 10)}... removed`,
      contributors: dataset.contributors,
    });
  } catch (err) {
    console.error("❌ Error removing contributor:", err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /collaborations/:datasetId/contributors
 * Lấy danh sách contributors của dataset
 */
router.get("/:datasetId/contributors", (req, res) => {
  try {
    const { datasetId } = req.params;
    const dataset = getDatasetById(parseInt(datasetId));

    if (!dataset) {
      return res.status(404).json({ error: "Dataset not found" });
    }

    // Initialize contributors nếu chưa có
    const contributors = dataset.contributors || [
      {
        address: dataset.ownerAddress,
        role: "owner",
        addedAt: dataset.createdAt,
      },
    ];

    return res.json({
      success: true,
      datasetId: dataset.id,
      datasetName: dataset.datasetName,
      owner: dataset.ownerAddress,
      contributors: contributors,
      totalContributors: contributors.length,
    });
  } catch (err) {
    console.error("❌ Error fetching contributors:", err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /collaborations/my-datasets/:address
 * Lấy tất cả datasets mà user là contributor/owner
 */
router.get("/my-datasets/:address", (req, res) => {
  try {
    const { address } = req.params;
    const allDatasets = getAllDatasets();

    console.log(`\n👥 [COLLABORATIONS] Fetching datasets for ${address}`);

    // Filter datasets mà user là owner hoặc contributor
    const myDatasets = allDatasets.filter((d) => {
      const isOwner = d.ownerAddress.toLowerCase() === address.toLowerCase();
      const isContributor = d.contributors?.some(
        c => c.address.toLowerCase() === address.toLowerCase()
      );
      console.log(`  📊 Dataset #${d.id} (${d.datasetName}): isOwner=${isOwner}, isContributor=${isContributor}, contributors=${d.contributors?.length || 0}`);
      if (d.contributors) {
        d.contributors.forEach(c => console.log(`    - ${c.address.substring(0, 10)}... (${c.role})`));
      }
      return isOwner || isContributor;
    });

    const result = myDatasets.map((d) => {
      const contributor = d.contributors?.find(
        c => c.address.toLowerCase() === address.toLowerCase()
      );
      const userRole = d.ownerAddress.toLowerCase() === address.toLowerCase()
        ? "owner"
        : contributor?.role || "unknown";

      return {
        id: d.id,
        datasetName: d.datasetName,
        dataType: d.dataType,
        owner: d.ownerAddress,
        ownerAddress: d.ownerAddress,
        userRole: userRole,
        totalVersions: d.versions?.length || 0,
        totalContributors: d.contributors?.length || 1,
        createdAt: d.createdAt,
        // ✅ Thêm metadata để CollaboratorsManager có thể lấy owner info
        metadata: {
          ownerAddress: d.ownerAddress,
          dataType: d.dataType,
          license: d.license,
          description: d.description,
        },
        // ✅ Thêm contributors array để CollaboratorsManager có thể xác nhận owner
        contributors: d.contributors || [{
          address: d.ownerAddress,
          role: "owner",
          addedAt: d.createdAt,
        }],
        // ✅ Thêm versions nếu có
        versions: d.versions || [],
      };
    });

    console.log(`✅ Found ${result.length} datasets for user ${address}`);

    return res.json({
      success: true,
      address,
      datasets: result,
      totalDatasets: result.length,
    });
  } catch (err) {
    console.error("❌ Error fetching my datasets:", err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
