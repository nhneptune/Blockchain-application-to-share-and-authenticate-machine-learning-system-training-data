const fs = require("fs");
const path = require("path");

const DB_FILE = path.join(__dirname, "training.json");

/**
 * Khởi tạo database file nếu chưa có
 */
function initDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(
      DB_FILE,
      JSON.stringify(
        {
          nextTrainingId: 0,
          trainingSessions: [],
        },
        null,
        2
      )
    );
  }
}

/**
 * Đọc toàn bộ training records từ file
 */
function readDB() {
  try {
    initDB();
    const data = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(data);
    return parsed;
  } catch (err) {
    console.error("❌ [TrainingDB] Error reading database:", err);
    return { nextTrainingId: 0, trainingSessions: [] };
  }
}

/**
 * Ghi database file
 */
function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("❌ [TrainingDB] Error writing database:", err);
  }
}

/**
 * Tạo training record mới
 * @param {string} trainerAddress - Địa chỉ ví của người train
 * @param {string} datasetName - Tên dataset
 * @param {string} datasetHash - SHA-256 hash của dataset (từ blockchain)
 * @param {string} mode - "iris" hoặc "csv"
 * @param {array} files - Danh sách file (nếu mode = csv)
 * @returns {object} Training record
 */
function createTrainingRecord(trainerAddress, datasetName, datasetHash, mode, files = []) {
  const db = readDB();
  
  const trainingId = db.nextTrainingId++;
  const now = new Date().toISOString();
  
  const record = {
    trainingId,
    trainerAddress,
    datasetName,
    datasetHash,
    mode,
    files,
    status: "pending", // pending, training, completed, failed
    startTime: now,
    endTime: null,
    accuracy: null,
    report: null,
    confusionMatrix: null,
    nSamples: null,
    modelPath: null,
    error: null,
  };
  
  db.trainingSessions.push(record);
  writeDB(db);
  
  console.log(`✅ [TrainingDB] Created training record: ${trainingId}`);
  return record;
}

/**
 * Cập nhật training record khi training hoàn thành
 * @param {number} trainingId
 * @param {object} trainingResult - Kết quả từ train.py
 */
function updateTrainingCompleted(trainingId, trainingResult) {
  const db = readDB();
  const record = db.trainingSessions.find(t => t.trainingId === trainingId);
  
  if (!record) {
    throw new Error(`Training record ${trainingId} not found`);
  }
  
  record.status = "completed";
  record.endTime = new Date().toISOString();
  record.accuracy = trainingResult.accuracy;
  record.report = trainingResult.report;
  record.confusionMatrix = trainingResult.confusion_matrix;
  record.nSamples = trainingResult.n_samples;
  record.modelPath = trainingResult.model_path;
  
  writeDB(db);
  console.log(`✅ [TrainingDB] Updated training ${trainingId}: completed`);
  return record;
}

/**
 * Cập nhật training record khi có lỗi
 * @param {number} trainingId
 * @param {string} errorMsg
 */
function updateTrainingFailed(trainingId, errorMsg) {
  const db = readDB();
  const record = db.trainingSessions.find(t => t.trainingId === trainingId);
  
  if (!record) {
    throw new Error(`Training record ${trainingId} not found`);
  }
  
  record.status = "failed";
  record.endTime = new Date().toISOString();
  record.error = errorMsg;
  
  writeDB(db);
  console.log(`❌ [TrainingDB] Updated training ${trainingId}: failed`);
  return record;
}

/**
 * Cập nhật status training thành 'training'
 * @param {number} trainingId
 */
function updateTrainingStatus(trainingId, status) {
  const db = readDB();
  const record = db.trainingSessions.find(t => t.trainingId === trainingId);
  
  if (!record) {
    throw new Error(`Training record ${trainingId} not found`);
  }
  
  record.status = status;
  writeDB(db);
  return record;
}

/**
 * Lấy tất cả training records
 */
function getAllTraining() {
  const db = readDB();
  return db.trainingSessions;
}

/**
 * Lấy training records theo trainer address
 */
function getTrainingByTrainer(trainerAddress) {
  const db = readDB();
  return db.trainingSessions.filter(t => t.trainerAddress === trainerAddress);
}

/**
 * Lấy training record theo trainingId
 */
function getTrainingById(trainingId) {
  const db = readDB();
  return db.trainingSessions.find(t => t.trainingId === trainingId);
}

/**
 * Lấy training records theo dataset
 */
function getTrainingByDataset(datasetHash) {
  const db = readDB();
  return db.trainingSessions.filter(t => t.datasetHash === datasetHash);
}

module.exports = {
  initDB,
  createTrainingRecord,
  updateTrainingCompleted,
  updateTrainingFailed,
  updateTrainingStatus,
  getAllTraining,
  getTrainingByTrainer,
  getTrainingById,
  getTrainingByDataset,
};
