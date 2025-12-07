const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { hashFileServer } = require("../utils");
const { addMetadata } = require("../metadataDB");

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
 * Upload file với metadata và verify hash
 * 
 * Body:
 * - file: File upload
 * - clientHash: SHA256 hash từ client
 * - datasetName: Tên dataset
 * - description: Mô tả
 * - dataType: Loại dữ liệu (images, text, tabular, etc.)
 * - ownerAddress: Wallet address của uploader
 * - license: Giấy phép sử dụng
 */
router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const clientHash = req.body.clientHash;
    const filePath = req.file.path;

    // Validate metadata fields
    const datasetName = req.body.datasetName?.trim();
    const description = req.body.description?.trim();
    const dataType = req.body.dataType?.trim();
    const ownerAddress = req.body.ownerAddress?.trim();
    const license = req.body.license?.trim();

    if (!datasetName || !dataType || !ownerAddress) {
      // Xóa file nếu metadata không hợp lệ
      fs.unlinkSync(filePath);
      return res.status(400).json({
        error: "Missing required metadata",
        required: ["datasetName", "dataType", "ownerAddress"],
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

    // Lưu metadata
    const metadataId = addMetadata({
      hash: serverHash,
      datasetName,
      description: description || "",
      dataType,
      fileSize,
      ownerAddress,
      license: license || "CC0 (Public Domain)",
      filename: req.file.filename,
    });

    return res.json({
      success: true,
      hash: serverHash,
      filename: req.file.filename,
      fileSize,
      metadataId,
      metadata: {
        datasetName,
        description,
        dataType,
        license,
        uploadedAt: new Date().toISOString(),
      },
      message: "File uploaded successfully. Now register the hash on blockchain.",
    });
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

