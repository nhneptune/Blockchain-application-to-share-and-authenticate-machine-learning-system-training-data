const express = require("express");
const { contract, getCache, setCache } = require("../config");
const { fetchRangeData } = require("../utils");

const router = express.Router();

/**
 * GET /contributions
 * Đọc dữ liệu từ contract với cache
 */
router.get("/", async (req, res) => {
  try {
    // Kiểm tra cache
    const now = Math.floor(Date.now() / 1000);
    const currentCache = getCache();
    
    if (currentCache.data && (now - currentCache.ts) < currentCache.ttl) {
      return res.json({ 
        fromCache: true, 
        count: currentCache.data.length, 
        items: currentCache.data,
        cacheAge: now - currentCache.ts
      });
    }

    // Đọc tổng số bản ghi từ contract
    const totalBN = await contract.count();
    const total = Number(totalBN);

    // Query params
    const qOwner = (req.query.owner || "").toLowerCase();
    const qLimit = req.query.limit ? Math.min(Number(req.query.limit), 1000) : null;

    // Fetch dữ liệu từ contract (chunked)
    const CHUNK = 50;
    let results = [];
    
    for (let start = 0; start < total; start += CHUNK) {
      const end = Math.min(start + CHUNK, total);
      const chunkData = await fetchRangeData(contract, start, end);
      results = results.concat(chunkData);

      // Early exit nếu đã đủ limit
      if (qLimit && results.length >= qLimit) {
        results = results.slice(0, qLimit);
        break;
      }
    }

    // Filter theo owner nếu được cung cấp
    if (qOwner) {
      results = results.filter(item => item.owner.toLowerCase() === qOwner);
    }

    // Cập nhật cache
    setCache({ ts: now, data: results, ttl: 10 });

    return res.json({ 
      fromCache: false, 
      count: results.length, 
      items: results,
      total
    });
  } catch (err) {
    console.error("Error in GET /contributions:", err);
    return res.status(500).json({ 
      error: "Cannot read contract data", 
      detail: err.toString() 
    });
  }
});

module.exports = router;
