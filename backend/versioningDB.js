const fs = require("fs");
const path = require("path");

const DB_FILE = path.join(__dirname, "versions.json");

/**
 * Khởi tạo database file nếu chưa có
 */
function initDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ entries: [] }, null, 2));
  }
}

/**
 * Đọc toàn bộ version từ file
 */
function readDB() {
  try {
    initDB();
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading versions DB:", err);
    return { entries: [] };
  }
}

/**
 * Ghi version vào file
 */
function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error writing versions DB:", err);
    throw err;
  }
}

/**
 * Tạo version entry mới
 * @param {Object} versionData
 * @param {number} versionData.dataId - ID của dataset
 * @param {string} versionData.version - Version string (1.0, 1.1, 2.0)
 * @param {string} versionData.hash - Hash của file version này
 * @param {string} versionData.changeLog - Mô tả thay đổi
 * @param {string} versionData.updatedBy - Wallet address của người update
 * @param {string} versionData.datasetName - Tên dataset
 * @returns {number} ID của version entry
 */
function createVersion(versionData) {
  const db = readDB();
  
  // Normalize hash
  const normalizedHash = versionData.hash.toLowerCase().replace(/^0x/, "");
  
  const entry = {
    id: db.entries.length,
    dataId: versionData.dataId,
    version: versionData.version,
    hash: normalizedHash,
    changeLog: versionData.changeLog,
    updatedBy: versionData.updatedBy.toLowerCase(),
    datasetName: versionData.datasetName,
    createdAt: new Date().toISOString(),
    blockchainId: null, // Sẽ update sau khi register lên blockchain
  };

  db.entries.push(entry);
  writeDB(db);
  
  return entry.id;
}

/**
 * Lấy lịch sử version của dataset
 */
function getVersionsByDataId(dataId) {
  const db = readDB();
  return db.entries.filter((e) => e.dataId === dataId).sort((a, b) => {
    // Sort theo version (descending) - latest first
    const aParts = a.version.split(".").map(Number);
    const bParts = b.version.split(".").map(Number);
    
    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const aVal = aParts[i] || 0;
      const bVal = bParts[i] || 0;
      if (aVal !== bVal) return bVal - aVal;
    }
    return 0;
  });
}

/**
 * Lấy version cụ thể
 */
function getVersion(versionId) {
  const db = readDB();
  return db.entries.find((e) => e.id === versionId);
}

/**
 * Update blockchain ID của version
 */
function updateBlockchainId(versionId, blockchainId) {
  const db = readDB();
  const entry = db.entries.find((e) => e.id === versionId);
  
  if (entry) {
    entry.blockchainId = blockchainId;
    writeDB(db);
  }
}

/**
 * Lấy tất cả versions
 */
function getAllVersions() {
  const db = readDB();
  return db.entries;
}

/**
 * Auto-generate version string dựa trên last version
 * @param {Array} existingVersions - Array versions hiện có
 * @returns {string} Version string mới (e.g., "1.1", "2.0")
 */
function generateNextVersion(existingVersions) {
  if (existingVersions.length === 0) {
    return "1.0";
  }

  // Lấy version mới nhất
  const latestVersion = existingVersions[0]; // Already sorted descending
  const parts = latestVersion.version.split(".").map(Number);
  
  // Increment minor version
  parts[1] = (parts[1] || 0) + 1;
  
  return parts.join(".");
}

/**
 * Kiểm tra version string có valid không
 */
function isValidVersion(versionString) {
  // Format: X.Y hoặc X.Y.Z
  const regex = /^\d+\.\d+(\.\d+)?$/;
  return regex.test(versionString);
}

module.exports = {
  createVersion,
  getVersionsByDataId,
  getVersion,
  updateBlockchainId,
  getAllVersions,
  generateNextVersion,
  isValidVersion,
};
