const express = require("express");
const { spawn } = require("child_process");
const path = require("path");

const router = express.Router();

/**
 * Helper: Call Python training script and return parsed JSON
 */
function runPythonTrain(args = []) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, "..", "py", "train.py");
    const py = spawn("python3", [scriptPath, ...args], { 
      cwd: path.dirname(scriptPath) 
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
 *     files: ["path/to/file1.csv", "path/to/file2.csv"]  // only for csv mode
 *   }
 */
router.post("/train", async (req, res) => {
  try {
    const mode = (req.body && req.body.mode) || "iris";
    const files = (req.body && req.body.files) || [];

    const args = [];
    args.push("--mode", mode);
    if (mode === "csv" && files.length > 0) {
      args.push("--files", ...files);
    }

    const result = await runPythonTrain(args);
    // result contains accuracy, model_path, report, confusion_matrix, etc.
    return res.json({ ok: true, result });
  } catch (err) {
    console.error("Train error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
