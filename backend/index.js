require("dotenv").config();
const express = require("express");
const cors = require("cors");

// Import routes
const uploadRouter = require("./routes/upload");
const contributionsRouter = require("./routes/contributions");
const mlRouter = require("./routes/ml");
const healthRouter = require("./routes/health");

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

// Machine Learning
app.use("/ml", mlRouter);

// ==================== START SERVER ====================

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Backend listening on port ${PORT}`);
  console.log(`📋 Routes:`);
  console.log(`   GET  /health`);
  console.log(`   POST /upload`);
  console.log(`   GET  /contributions`);
  console.log(`   POST /ml/train`);
  console.log(`PID: ${process.pid}`);
});

