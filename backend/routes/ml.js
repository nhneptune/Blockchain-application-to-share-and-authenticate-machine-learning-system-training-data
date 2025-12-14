const express = require("express");
const { spawn } = require("child_process");
const path = require("path");
const trainingDB = require("../trainingDB");

const router = express.Router();

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
    const { mode = "iris", model = "randomforest", files = [], trainerAddress, datasetName, datasetHash } = req.body;

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

    // Create training record
    const trainingRecord = trainingDB.createTrainingRecord(
      trainerAddress,
      datasetName || "Unnamed Dataset",
      datasetHash || "unknown",
      mode,
      absoluteFiles
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
