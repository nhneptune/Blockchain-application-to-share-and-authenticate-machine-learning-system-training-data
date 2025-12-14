const fs = require("fs");
const path = require("path");

const DB_FILE = path.join(__dirname, "metadata.json");

/**
 * Khởi tạo database file nếu chưa có
 */
function initDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(
      DB_FILE,
      JSON.stringify(
        {
          nextDatasetId: 0,
          datasets: [],
        },
        null,
        2
      )
    );
  }
}

/**
 * Đọc toàn bộ metadata từ file
 */
function readDB() {
  try {
    initDB();
    const data = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(data);
    
    // Support legacy format (entries) - convert to new format if needed
    if (parsed.entries && !parsed.datasets) {
      console.log("🔄 [DB] Converting legacy format to new format...");
      return convertLegacyFormat(parsed);
    }
    
    console.log(`📖 [DB] Read database: ${parsed.datasets?.length || 0} datasets`);
    return parsed;
  } catch (err) {
    console.error("❌ [DB] Error reading metadata DB:", err);
    return { nextDatasetId: 0, datasets: [] };
  }
}

/**
 * Convert old format (entries) to new format (datasets with versions)
 */
function convertLegacyFormat(legacyData) {
  const datasets = (legacyData.entries || []).map((entry) => ({
    id: entry.id,
    datasetName: entry.datasetName,
    dataType: entry.dataType,
    ownerAddress: entry.ownerAddress,
    license: entry.license,
    createdAt: entry.uploadedAt || new Date().toISOString(),
    blockchainId: entry.blockchainId || null,
    versions: [
      {
        version: "1.0",
        hash: entry.hash,
        filename: entry.filename,
        fileSize: entry.fileSize,
        description: entry.description || "",
        changelog: "Initial version",
        uploadedAt: entry.uploadedAt || new Date().toISOString(),
        blockchainId: entry.blockchainId || null,
      },
    ],
  }));

  return {
    nextDatasetId: datasets.length,
    datasets,
  };
}

/**
 * Ghi metadata vào file
 */
function writeDB(data) {
  try {
    console.log(`💾 [DB] Writing database: ${data.datasets?.length || 0} datasets, nextId=${data.nextDatasetId}`);
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    console.log(`✅ [DB] Database written successfully`);
  } catch (err) {
    console.error("❌ [DB] Error writing metadata DB:", err);
    throw err;
  }
}

/**
 * Tạo dataset mới với version 1.0
 * @param {Object} metadata
 * @param {string} metadata.hash - SHA256 hash của file
 * @param {string} metadata.datasetName - Tên dataset
 * @param {string} metadata.description - Mô tả dataset
 * @param {string} metadata.dataType - Loại dữ liệu
 * @param {number} metadata.fileSize - Kích thước file (bytes)
 * @param {string} metadata.ownerAddress - Wallet address
 * @param {string} metadata.license - Giấy phép
 * @param {string} metadata.filename - Tên file được lưu
 * @returns {number} ID của dataset mới
 */
function createDataset(metadata) {
  const db = readDB();
  const normalizedHash = metadata.hash.toLowerCase().replace(/^0x/, "");

  const dataset = {
    id: db.nextDatasetId,
    datasetName: metadata.datasetName,
    dataType: metadata.dataType,
    ownerAddress: metadata.ownerAddress.toLowerCase(),
    license: metadata.license,
    createdAt: new Date().toISOString(),
    blockchainId: null,
    // 🔥 Thêm contributors array - owner tự động là contributor
    contributors: [
      {
        address: metadata.ownerAddress.toLowerCase(),
        role: "owner",
        addedAt: new Date().toISOString(),
      },
    ],
    versions: [
      {
        version: "1.0",
        hash: normalizedHash,
        filename: metadata.filename,
        fileSize: metadata.fileSize,
        description: metadata.description || "",
        changelog: "Initial version",
        uploadedAt: new Date().toISOString(),
        blockchainId: null,
      },
    ],
  };

  db.datasets.push(dataset);
  db.nextDatasetId += 1;
  writeDB(db);

  return dataset.id;
}

/**
 * Thêm version mới cho dataset hiện có
 * @param {number} datasetId - ID của dataset
 * @param {Object} versionData
 * @param {string} versionData.hash - Hash của file mới
 * @param {string} versionData.filename - Tên file mới
 * @param {number} versionData.fileSize - Kích thước file
 * @param {string} versionData.description - Mô tả dataset
 * @param {string} versionData.changelog - Mô tả thay đổi
 * @returns {Object} Dataset với version mới
 */
function addVersion(datasetId, versionData) {
  console.log(`[addVersion] Adding version for dataset ${datasetId}:`, versionData);
  
  const db = readDB();
  const dataset = db.datasets.find((d) => d.id === datasetId);

  if (!dataset) {
    throw new Error(`Dataset with ID ${datasetId} not found`);
  }

  const normalizedHash = versionData.hash.toLowerCase().replace(/^0x/, "");

  // Auto-generate next version (1.0 → 1.1 → 1.2 → 2.0)
  const latestVersion = dataset.versions[dataset.versions.length - 1].version;
  const nextVersion = generateNextVersion(latestVersion);

  const newVersion = {
    version: nextVersion,
    hash: normalizedHash,
    filename: versionData.filename,
    fileSize: versionData.fileSize,
    description: versionData.description || "",
    changelog: versionData.changelog || "",
    uploadedAt: new Date().toISOString(),
    blockchainId: null,
  };

  console.log(`[addVersion] Created new version:`, newVersion);
  
  dataset.versions.push(newVersion);
  writeDB(db);

  console.log(`[addVersion] Dataset updated. Total versions:`, dataset.versions.length);
  console.log(`[addVersion] Updated dataset:`, dataset);

  return dataset;
}

/**
 * Generate next version string (1.0 → 1.1, 1.9 → 2.0)
 */
function generateNextVersion(currentVersion) {
  const parts = currentVersion.split(".").map(Number);
  const major = parts[0];
  const minor = parts[1] || 0;

  // Increment minor version
  if (minor < 9) {
    return `${major}.${minor + 1}`;
  }

  // If minor is 9, increment major and reset minor
  return `${major + 1}.0`;
}

/**
 * Lấy dataset theo ID
 */
function getDatasetById(id) {
  const db = readDB();
  return db.datasets.find((d) => d.id === id);
}

/**
 * Lấy tất cả datasets của owner
 */
function getDatasetsByOwner(ownerAddress) {
  const db = readDB();
  return db.datasets.filter(
    (d) => d.ownerAddress.toLowerCase() === ownerAddress.toLowerCase()
  );
}

/**
 * Lấy version cụ thể của dataset
 */
function getVersion(datasetId, version) {
  const dataset = getDatasetById(datasetId);
  if (!dataset) return null;
  return dataset.versions.find((v) => v.version === version);
}

/**
 * Lấy tất cả versions của dataset
 */
function getVersions(datasetId) {
  const dataset = getDatasetById(datasetId);
  if (!dataset) return [];
  return dataset.versions;
}

/**
 * Lấy latest version của dataset
 */
function getLatestVersion(datasetId) {
  const dataset = getDatasetById(datasetId);
  if (!dataset || dataset.versions.length === 0) return null;
  return dataset.versions[dataset.versions.length - 1];
}

/**
 * Lấy tất cả datasets
 */
function getAllDatasets() {
  const db = readDB();
  return db.datasets;
}

/**
 * Lấy metadata theo hash (tìm kiếm trong tất cả versions)
 */
function getDatasetByHash(hash) {
  const db = readDB();
  const normalizedHash = hash.toLowerCase().replace(/^0x/, "");

  for (const dataset of db.datasets) {
    for (const version of dataset.versions) {
      if (version.hash.toLowerCase() === normalizedHash) {
        return { dataset, version };
      }
    }
  }

  return null;
}

/**
 * Update blockchain ID của dataset
 */
function updateDatasetBlockchainId(datasetId, blockchainId) {
  const db = readDB();
  const dataset = db.datasets.find((d) => d.id === datasetId);

  if (dataset) {
    dataset.blockchainId = blockchainId;
    writeDB(db);
  }
}

/**
 * Update blockchain ID của version
 */
function updateVersionBlockchainId(datasetId, versionString, blockchainId) {
  const db = readDB();
  const dataset = db.datasets.find((d) => d.id === datasetId);

  if (dataset) {
    const version = dataset.versions.find((v) => v.version === versionString);
    if (version) {
      version.blockchainId = blockchainId;
      writeDB(db);
    }
  }
}

/**
 * Lấy metadata của dataset theo hash (format cũ cho compatibility)
 * @deprecated Sử dụng getDatasetByHash thay vào
 */
function getMetadataByHash(hash) {
  const result = getDatasetByHash(hash);
  if (!result) return null;

  const { dataset, version } = result;
  return {
    id: dataset.id,
    hash: version.hash,
    datasetName: dataset.datasetName,
    description: version.description,
    dataType: dataset.dataType,
    fileSize: version.fileSize,
    ownerAddress: dataset.ownerAddress,
    license: dataset.license,
    filename: version.filename,
    uploadedAt: version.uploadedAt,
    blockchainId: version.blockchainId,
  };
}

module.exports = {
  createDataset,
  addVersion,
  getDatasetById,
  getDatasetsByOwner,
  getVersion,
  getVersions,
  getLatestVersion,
  getAllDatasets,
  getDatasetByHash,
  updateDatasetBlockchainId,
  updateVersionBlockchainId,
  getMetadataByHash, // Legacy support
  readDB,
  writeDB,
};
