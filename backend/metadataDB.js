const fs = require("fs");
const path = require("path");

const DB_FILE = path.join(__dirname, "metadata.json");

/**
 * Khởi tạo database file nếu chưa có
 */
function initDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ entries: [] }, null, 2));
  }
}

/**
 * Đọc toàn bộ metadata từ file
 */
function readDB() {
  try {
    initDB();
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading metadata DB:", err);
    return { entries: [] };
  }
}

/**
 * Ghi metadata vào file
 */
function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error writing metadata DB:", err);
    throw err;
  }
}

/**
 * Thêm metadata entry mới
 * @param {Object} metadata - Metadata object
 * @param {string} metadata.hash - SHA256 hash của file
 * @param {string} metadata.datasetName - Tên dataset
 * @param {string} metadata.description - Mô tả dataset
 * @param {string} metadata.dataType - Loại dữ liệu (images, text, tabular, etc.)
 * @param {number} metadata.fileSize - Kích thước file (bytes)
 * @param {string} metadata.ownerAddress - Wallet address của uploader
 * @param {string} metadata.license - Giấy phép sử dụng
 * @param {string} metadata.filename - Tên file được lưu
 * @returns {number} ID của entry trong metadata DB
 */
function addMetadata(metadata) {
  const db = readDB();
  
  const entry = {
    id: db.entries.length,
    hash: metadata.hash,
    datasetName: metadata.datasetName,
    description: metadata.description,
    dataType: metadata.dataType,
    fileSize: metadata.fileSize,
    ownerAddress: metadata.ownerAddress,
    license: metadata.license,
    filename: metadata.filename,
    uploadedAt: new Date().toISOString(),
    blockchainId: null, // Sẽ update sau khi register lên blockchain
  };

  db.entries.push(entry);
  writeDB(db);
  
  return entry.id;
}

/**
 * Lấy metadata theo hash
 */
function getMetadataByHash(hash) {
  const db = readDB();
  return db.entries.find((e) => e.hash === hash);
}

/**
 * Lấy metadata theo ID
 */
function getMetadataById(id) {
  const db = readDB();
  return db.entries.find((e) => e.id === id);
}

/**
 * Lấy tất cả metadata của một owner
 */
function getMetadataByOwner(ownerAddress) {
  const db = readDB();
  return db.entries.filter((e) => e.ownerAddress.toLowerCase() === ownerAddress.toLowerCase());
}

/**
 * Update blockchain ID sau khi register lên contract
 */
function updateBlockchainId(metadataId, blockchainId) {
  const db = readDB();
  const entry = db.entries.find((e) => e.id === metadataId);
  
  if (entry) {
    entry.blockchainId = blockchainId;
    writeDB(db);
  }
}

/**
 * Lấy tất cả metadata
 */
function getAllMetadata() {
  const db = readDB();
  return db.entries;
}

module.exports = {
  addMetadata,
  getMetadataByHash,
  getMetadataById,
  getMetadataByOwner,
  updateBlockchainId,
  getAllMetadata,
};
