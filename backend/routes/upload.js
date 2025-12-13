const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { hashFileServer } = require("../utils");
const { createDataset, addVersion, getDatasetById } = require("../metadataDB");

const router = express.Router();

// Tạo thư mục uploads
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const originalExt = path.extname(file.originalname);
    cb(null, `${timestamp}${originalExt}`);
  },
});

const upload = multer({ storage });

/**
 * POST /upload
 * Upload file - tạo dataset mới hoặc thêm version cho dataset hiện có
 * 
 * Query params:
 * - datasetId: (optional) ID của dataset để thêm version. Nếu không có = tạo dataset mới
 * 
 * Body:
 * - file: File upload
 * - clientHash: SHA256 hash từ client
 * - datasetName: Tên dataset (required nếu tạo mới)
 * - description: Mô tả
 * - dataType: Loại dữ liệu (required nếu tạo mới)
 * - ownerAddress: Wallet address của uploader (required)
 * - license: Giấy phép sử dụng
 * - changelog: Mô tả thay đổi (dùng khi thêm version)
 */
router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const clientHash = req.body.clientHash;
    const filePath = req.file.path;
    const datasetId = req.query.datasetId ? parseInt(req.query.datasetId) : null;

    // Validate metadata fields
    const datasetName = req.body.datasetName?.trim();
    const description = req.body.description?.trim();
    const dataType = req.body.dataType?.trim();
    const ownerAddress = req.body.ownerAddress?.trim();
    const license = req.body.license?.trim();
    const changelog = req.body.changelog?.trim();

    if (!ownerAddress) {
      fs.unlinkSync(filePath);
      return res.status(400).json({
        error: "Missing required field: ownerAddress",
      });
    }

    // Verify hash
    const serverHash = await hashFileServer(filePath);
    const match = clientHash === serverHash;

    if (!match) {
      fs.unlinkSync(filePath);
      return res.status(400).json({
        error: "Hash verification failed",
        clientHash,
        serverHash,
      });
    }

    // Lấy file size
    const stats = fs.statSync(filePath);
    const fileSize = stats.size;

    let result;

    // Case 1: Thêm version cho dataset hiện có
    if (datasetId !== null) {
      console.log(`\n📝 [UPLOAD] Adding version to existing dataset ${datasetId}`);
      const dataset = getDatasetById(datasetId);
      if (!dataset) {
        fs.unlinkSync(filePath);
        return res.status(404).json({ error: "Dataset not found" });
      }

      console.log(`📝 [UPLOAD] Found dataset: ${dataset.datasetName}`);

      // Thêm version mới
      const updatedDataset = addVersion(datasetId, {
        hash: serverHash,
        filename: req.file.filename,
        fileSize,
        description: description || dataset.versions[0].description,
        changelog: changelog || "Updated version",
      });

      console.log(`✅ [UPLOAD] Version added successfully. New version count: ${updatedDataset.versions.length}`);

      result = {
        success: true,
        type: "version_added",
        hash: serverHash,
        filename: req.file.filename,
        fileSize,
        datasetId,
        dataset: {
          id: updatedDataset.id,
          datasetName: updatedDataset.datasetName,
          currentVersion: updatedDataset.versions[updatedDataset.versions.length - 1].version,
          totalVersions: updatedDataset.versions.length,
        },
        message: "New version added successfully",
      };
    } else {
      // Case 2: Tạo dataset mới
      console.log(`\n📝 [UPLOAD] Creating new dataset`);
      if (!datasetName || !dataType) {
        fs.unlinkSync(filePath);
        return res.status(400).json({
          error: "Missing required fields for new dataset",
          required: ["datasetName", "dataType"],
        });
      }

      const newDatasetId = createDataset({
        hash: serverHash,
        datasetName,
        description: description || "",
        dataType,
        fileSize,
        ownerAddress,
        license: license || "CC0 (Public Domain)",
        filename: req.file.filename,
      });

      console.log(`✅ [UPLOAD] New dataset created with ID: ${newDatasetId}`);

      result = {
        success: true,
        type: "dataset_created",
        hash: serverHash,
        filename: req.file.filename,
        fileSize,
        datasetId: newDatasetId,
        dataset: {
          id: newDatasetId,
          datasetName,
          currentVersion: "1.0",
          totalVersions: 1,
        },
        message: "Dataset created successfully. Version 1.0",
      };
    }

    console.log(`📤 [UPLOAD] Response:`, result);
    return res.json(result);
  } catch (err) {
    console.error("Error in /upload:", err);

    // Xóa file nếu có lỗi
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ error: "Upload failed", detail: err.message });
  }
});

module.exports = router;

