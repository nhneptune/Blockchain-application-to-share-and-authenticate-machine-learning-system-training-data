const express = require("express");
const { spawn } = require("child_process");
const path = require("path");
const axios = require("axios");
const trainingDB = require("../trainingDB");

const router = express.Router();

/**
 * Helper: Auto-record usage in royalty system after training completes
 */
async function recordUsageInRoyalty(datasetId, trainerAddress, model, accuracy) {
  try {
    // Default reward pool (should match what backend uses)
    const rewardPool = 100; // Or fetch from environment/config
    
    console.log(`🔄 Auto-recording royalty for dataset ${datasetId}...`);
    
    const response = await axios.post(
      `http://localhost:4000/royalty/${datasetId}/record-usage`,
      {
        trainer: trainerAddress,
        modelType: model,
        accuracy: Math.round(accuracy * 100 * 100), // Convert 0.95 to 9500 (95%)
        rewardPool
      },
      { timeout: 5000 }
    );

    console.log(`✅ Royalty recorded for dataset ${datasetId}:`, response.data);
  } catch (err) {
    console.error(`❌ Royalty auto-record failed for dataset ${datasetId}:`, err.message);
    if (err.response) {
      console.error(`   Response status: ${err.response.status}`);
      console.error(`   Response data:`, err.response.data);
    }
  }
}

/**
 * Helper: Call Python training script and return parsed JSON
 */
function runPythonTrain(args = []) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, "..", "py", "train.py");
    const backendRoot = path.join(__dirname, "..");
    const py = spawn("python3", [scriptPath, ...args], { 
      cwd: backendRoot  // Set working directory to backend root, not py folder
    });

    let stdout = "";
    let stderr = "";

    py.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    py.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    py.on("close", (code) => {
      if (stderr) {
        // Include stderr in error for debugging
        return reject(new Error(`Python stderr: ${stderr}`));
      }
      try {
        const parsed = JSON.parse(stdout);
        if (parsed && parsed.success) {
          resolve(parsed);
        } else {
          reject(new Error("Python script reported failure: " + JSON.stringify(parsed)));
        }
      } catch (err) {
        reject(new Error("Failed to parse python stdout: " + stdout + " | err: " + err.message));
      }
    });

    py.on("error", (err) => {
      reject(new Error(`Failed to spawn Python process: ${err.message}`));
    });
  });
}

/**
 * POST /train
 * Train ML model (Iris by default, or from CSV files)
 * 
 * Body:
 *   {
 *     mode: "iris" | "csv",
 *     files: ["path/to/file1.csv", "path/to/file2.csv"],  // only for csv mode
 *     trainerAddress: "0x...",  // wallet address của người train
 *     datasetName: "Dataset name",
 *     datasetHash: "0x..." // SHA-256 hash từ blockchain
 *   }
 */
router.post("/train", async (req, res) => {
  try {
    const { mode = "iris", model = "randomforest", files = [], trainerAddress, datasetName, datasetHash, datasetId } = req.body;

    // Validate required fields
    if (!trainerAddress) {
      return res.status(400).json({ ok: false, error: "trainerAddress is required" });
    }

    // Convert file paths to absolute paths
    const absoluteFiles = files.map(f => {
      if (path.isAbsolute(f)) {
        return f;
      }
      // Resolve relative to backend root (process.cwd())
      const backendRoot = path.resolve(__dirname, "..");
      return path.resolve(backendRoot, f);
    });

    // Create training record (pass datasetId for royalty system)
    const trainingRecord = trainingDB.createTrainingRecord(
      trainerAddress,
      datasetName || "Unnamed Dataset",
      datasetHash || "unknown",
      mode,
      absoluteFiles,
      datasetId  // ← Pass datasetId
    );

    // Update status to 'training'
    trainingDB.updateTrainingStatus(trainingRecord.trainingId, "training");

    // Prepare args for Python script
    const args = [];
    args.push("--mode", mode);
    args.push("--model", model);
    if (mode === "csv" && absoluteFiles.length > 0) {
      args.push("--files", ...absoluteFiles);
    }

    // Run Python training in background
    runPythonTrain(args)
      .then((result) => {
        // Training success
        trainingDB.updateTrainingCompleted(trainingRecord.trainingId, result);
        console.log(`✅ Training ${trainingRecord.trainingId} completed`);
        console.log(`   Dataset ID: ${trainingRecord.datasetId || 'null (Iris mode)'}`);
        
        // AUTO-TRIGGER: Record usage in royalty system if dataset specified
        if (trainingRecord.datasetId) {
          console.log(`   → Auto-triggering reward recording...`);
          recordUsageInRoyalty(
            trainingRecord.datasetId,
            trainingRecord.trainerAddress,
            model,
            result.accuracy
          );
        } else {
          console.log(`   → No dataset specified, skipping reward recording`);
        }
      })
      .catch((err) => {
        // Training failed
        trainingDB.updateTrainingFailed(trainingRecord.trainingId, err.message);
        console.error(`❌ Training ${trainingRecord.trainingId} failed:`, err.message);
      });

    // Return immediately with training record ID
    return res.json({
      ok: true,
      trainingId: trainingRecord.trainingId,
      status: "training",
      message: "Training started in background",
    });
  } catch (err) {
    console.error("Train error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * GET /train/:trainingId
 * Lấy status và kết quả training
 */
router.get("/train/:trainingId", (req, res) => {
  try {
    const trainingId = parseInt(req.params.trainingId);
    const record = trainingDB.getTrainingById(trainingId);
    
    if (!record) {
      return res.status(404).json({ ok: false, error: "Training record not found" });
    }
    
    return res.json({ ok: true, training: record });
  } catch (err) {
    console.error("Get training error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * GET /train/trainer/:address
 * Lấy toàn bộ training records của một trainer
 */
router.get("/trainer/:address", (req, res) => {
  try {
    const trainerAddress = req.params.address;
    const records = trainingDB.getTrainingByTrainer(trainerAddress);
    return res.json({ ok: true, trainings: records });
  } catch (err) {
    console.error("Get trainer trainings error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * GET /train/dataset/:datasetHash
 * Lấy toàn bộ training records cho một dataset
 */
router.get("/dataset/:datasetHash", (req, res) => {
  try {
    const datasetHash = req.params.datasetHash;
    const records = trainingDB.getTrainingByDataset(datasetHash);
    return res.json({ ok: true, trainings: records });
  } catch (err) {
    console.error("Get dataset trainings error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * GET /train/all
 * Lấy tất cả training records
 */
router.get("/all", (req, res) => {
  try {
    const records = trainingDB.getAllTraining();
    return res.json({ ok: true, trainings: records });
  } catch (err) {
    console.error("Get all trainings error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
