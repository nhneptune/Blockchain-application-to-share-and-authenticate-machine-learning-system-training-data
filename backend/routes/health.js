const express = require("express");
const { CONTRACT_ADDRESS, RPC_URL } = require("../config");

const router = express.Router();

/**
 * GET /health
 * Health check endpoint
 */
router.get("/", (req, res) => {
  res.json({ 
    status: "OK", 
    contract: CONTRACT_ADDRESS,
    rpc: RPC_URL
  });
});

module.exports = router;
