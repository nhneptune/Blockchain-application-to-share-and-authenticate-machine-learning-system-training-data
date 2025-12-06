const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { hashFileServer } = require("../utils");

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
 * Upload file và verify hash
 */
router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const clientHash = req.body.clientHash;
    const filePath = req.file.path;

    const serverHash = await hashFileServer(filePath);

    return res.json({
      clientHash,
      serverHash,
      match: clientHash === serverHash,
      filename: req.file.filename,
    });
  } catch (err) {
    console.error("Error in /upload:", err);
    res.status(500).json({ error: "Upload failed", detail: err.message });
  }
});

module.exports = router;
