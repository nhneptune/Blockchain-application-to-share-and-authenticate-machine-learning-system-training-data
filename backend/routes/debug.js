const express = require("express");
const multer = require("multer");
const { hashFileServer } = require("../utils");
const fs = require("fs");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const originalExt = require("path").extname(file.originalname);
    cb(null, `${timestamp}${originalExt}`);
  },
});

const upload = multer({ storage });

/**
 * POST /debug/hash-test
 * Test hash calculation
 */
router.post("/hash-test", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const clientHash = req.body.clientHash;
    const filePath = req.file.path;

    const serverHash = await hashFileServer(filePath);

    console.log("=== HASH DEBUG ===");
    console.log("Client Hash:", clientHash);
    console.log("Server Hash:", serverHash);
    console.log("Match:", clientHash === serverHash);
    console.log("File path:", filePath);
    console.log("File size:", fs.statSync(filePath).size);

    fs.unlinkSync(filePath); // Xóa file test

    return res.json({
      clientHash,
      serverHash,
      match: clientHash === serverHash,
    });
  } catch (err) {
    console.error("Hash test error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
