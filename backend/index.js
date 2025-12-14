require("dotenv").config();
const express = require("express");
const cors = require("cors");

// Import routes
const uploadRouter = require("./routes/upload");
const contributionsRouter = require("./routes/contributions");
const collaborationsRouter = require("./routes/collaborations");
const mlRouter = require("./routes/ml");
const healthRouter = require("./routes/health");
const versionsRouter = require("./routes/versions");
const debugRouter = require("./routes/debug");

// Initialize app
const app = express();
app.use(cors());
app.use(express.json());

// ==================== ROUTES ====================

// Health check
app.use("/health", healthRouter);

// Upload file
app.use("/upload", uploadRouter);

// Blockchain contributions
app.use("/contributions", contributionsRouter);

// Collaborations (multiple contributors)
app.use("/collaborations", collaborationsRouter);

// Versioning
app.use("/versions", versionsRouter);

// Machine Learning
app.use("/ml", mlRouter);

// Debug routes
app.use("/debug", debugRouter);

// ==================== START SERVER ====================

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Backend listening on port ${PORT}`);
  console.log(`📋 Routes:`);
  console.log(`   GET  /health`);
  console.log(`   POST /upload`);
  console.log(`   GET  /contributions`);
  console.log(`   POST /collaborations/:datasetId/add-contributor`);
  console.log(`   DELETE /collaborations/:datasetId/remove-contributor/:address`);
  console.log(`   GET  /collaborations/:datasetId/contributors`);
  console.log(`   GET  /collaborations/my-datasets/:address`);
  console.log(`   POST /versions/create`);
  console.log(`   GET  /versions/all`);
  console.log(`   GET  /versions/:dataId`);
  console.log(`   GET  /versions/:dataId/latest`);
  console.log(`   POST /versions/register-on-blockchain`);
  console.log(`   POST /ml/train`);
  console.log(`PID: ${process.pid}`);
});

