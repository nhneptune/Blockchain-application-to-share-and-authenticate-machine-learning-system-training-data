import { useState, useEffect } from "react";

export default function TrainModel({ walletAddress }) {
  const [datasets, setDatasets] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState(null);
  const [trainingMode, setTrainingMode] = useState("iris");
  const [modelType, setModelType] = useState("randomforest");
  const [isTraining, setIsTraining] = useState(false);
  const [trainingId, setTrainingId] = useState(null);
  const [trainingResult, setTrainingResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [pollInterval, setPollInterval] = useState(null);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

  // Fetch available datasets
  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      console.log("📂 Fetching datasets from:", `${BACKEND_URL}/versions/all`);
      const res = await fetch(`${BACKEND_URL}/versions/all`);
      const data = await res.json();
      console.log("📥 Datasets response:", data);
      if (data.success && data.items) {
        console.log(`✅ Loaded ${data.items.length} blockchain-verified datasets`);
        setDatasets(data.items);
      } else {
        console.warn("⚠️ No datasets found or error in response");
        setDatasets([]);
      }
    } catch (err) {
      console.error("❌ Error fetching datasets:", err);
      setDatasets([]);
    }
  };

  const handleStartTraining = async () => {
    if (!walletAddress) {
      setErrorMsg("⚠️ Vui lòng kết nối ví trước!");
      return;
    }

    if (!selectedDatasetId) {
      setErrorMsg("⚠️ Vui lòng chọn dataset!");
      return;
    }

    // Find selected dataset
    const selectedDataset = datasets.find(d => d.id === selectedDatasetId);
    if (!selectedDataset) {
      setErrorMsg("⚠️ Dataset không hợp lệ!");
      return;
    }

    setErrorMsg(null);
    setIsTraining(true);
    setTrainingResult(null);

    try {
      console.log("🚀 Gửi request training:", {
        mode: trainingMode,
        trainerAddress: walletAddress,
        datasetId: selectedDataset.id,
        datasetName: selectedDataset.datasetName,
      });

      // Call backend to start training
      const res = await fetch(`${BACKEND_URL}/ml/train`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: trainingMode,
          model: modelType,
          trainerAddress: walletAddress,
          datasetId: selectedDataset.id,
          datasetName: selectedDataset.datasetName,
          datasetHash: selectedDataset.blockchainId || "unknown",
          // Nếu mode CSV, lấy file path từ dataset
          files: trainingMode === "csv" && selectedDataset.versions && selectedDataset.versions.length > 0
            ? selectedDataset.versions.map(v => `uploads/${v.filename}`)
            : [],
        }),
      });

      console.log("📡 Response status:", res.status);
      const data = await res.json();
      console.log("📥 Response data:", data);

      if (data.ok) {
        const tId = data.trainingId;
        setTrainingId(tId);
        console.log(`✅ Training started with ID: ${tId}`);

        // Start polling for result
        pollTrainingStatus(tId);
      } else {
        setErrorMsg(`❌ Lỗi: ${data.error}`);
        setIsTraining(false);
      }
    } catch (err) {
      console.error("❌ Training error:", err);
      setErrorMsg(`❌ Lỗi kết nối: ${err.message}`);
      setIsTraining(false);
    }
  };

  const pollTrainingStatus = (tId) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/ml/train/${tId}`);
        const data = await res.json();

        if (data.ok) {
          const training = data.training;

          if (training.status === "completed") {
            setTrainingResult(training);
            setIsTraining(false);
            clearInterval(interval);
            console.log("✅ Training completed!");
          } else if (training.status === "failed") {
            setErrorMsg(`❌ Training failed: ${training.error}`);
            setIsTraining(false);
            clearInterval(interval);
          }
          // Still training, keep polling
        }
      } catch (err) {
        console.error("Poll error:", err);
      }
    }, 2000); // Poll every 2 seconds

    setPollInterval(interval);
  };

  const resetForm = () => {
    setSelectedDatasetId(null);
    setTrainingId(null);
    setTrainingResult(null);
    setErrorMsg(null);
    setIsTraining(false);
    setModelType("randomforest");
  };

  return (
    <div>
      <h2 className="page-title">🤖 Train Model</h2>

      {errorMsg && (
        <div
          className="vitality-card"
          style={{
            backgroundColor: "#fed7d7",
            borderLeft: "4px solid #f56565",
            marginBottom: "20px",
          }}
        >
          <p style={{ color: "#742a2a", margin: 0 }}>{errorMsg}</p>
        </div>
      )}

      {!isTraining && !trainingResult && (
        <div className="vitality-card">
          {datasets.length === 0 ? (
            <div
              style={{
                padding: "20px",
                backgroundColor: "#fef3c7",
                borderLeft: "4px solid #f59e0b",
                borderRadius: "6px",
              }}
            >
              <p style={{ color: "#92400e", margin: 0, fontWeight: "bold" }}>
                ⚠️ Không có dataset được xác thực blockchain
              </p>
              <p style={{ color: "#92400e", margin: "10px 0 0 0", fontSize: "14px" }}>
                Vui lòng đăng ký dataset lên blockchain trước khi huấn luyện model.
              </p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "10px", fontWeight: "bold" }}>
                  📊 Chọn Dataset
                </label>
                <select
                  value={selectedDatasetId || ""}
                  onChange={(e) => {
                    setSelectedDatasetId(e.target.value ? parseInt(e.target.value) : null);
                  }}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e0",
                    fontSize: "14px",
                  }}
                >
                  <option value="">-- Chọn dataset --</option>
                  {datasets.map((ds) => (
                    <option key={ds.id} value={ds.id}>
                      {ds.datasetName || `Dataset ${ds.id}`} (v{ds.latestVersion}) ✓
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      )}

      {!isTraining && !trainingResult && datasets.length > 0 && (
        <div className="vitality-card">
          {selectedDatasetId && datasets.find(d => d.id === selectedDatasetId) && (
            <div
              style={{
                marginBottom: "20px",
                padding: "15px",
                backgroundColor: "#edf2f7",
                borderRadius: "6px",
              }}
            >
              {(() => {
                const selectedDataset = datasets.find(d => d.id === selectedDatasetId);
                return (
                  <>
                    <h4 style={{ marginTop: 0 }}>Dataset Info</h4>
                    <p style={{ margin: "5px 0" }}>
                      <strong>Tên:</strong> {selectedDataset.datasetName}
                    </p>
                    <p style={{ margin: "5px 0" }}>
                      <strong>Loại:</strong> {selectedDataset.dataType}
                    </p>
                    <p style={{ margin: "5px 0" }}>
                      <strong>Version:</strong> {selectedDataset.latestVersion}
                    </p>
                    <p style={{ margin: "5px 0" }}>
                      <strong>Versions:</strong> {selectedDataset.totalVersions} phiên bản
                    </p>
                    <p style={{ margin: "5px 0" }}>
                      <strong>Chủ sở hữu:</strong> {selectedDataset.ownerAddress?.substring(0, 10)}...
                    </p>
                    <p style={{ margin: "5px 0", color: "#059669" }}>
                      <strong>✓ Blockchain-verified</strong>
                    </p>
                  </>
                );
              })()}
            </div>
          )}

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "10px", fontWeight: "bold" }}>
              🎯 Mode Training
            </label>
            <div style={{ display: "flex", gap: "15px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <input
                  type="radio"
                  name="mode"
                  value="iris"
                  checked={trainingMode === "iris"}
                  onChange={(e) => setTrainingMode(e.target.value)}
                />
                Iris Dataset (Built-in)
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <input
                  type="radio"
                  name="mode"
                  value="csv"
                  checked={trainingMode === "csv"}
                  onChange={(e) => setTrainingMode(e.target.value)}
                />
                CSV Files
              </label>
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "10px", fontWeight: "bold" }}>
              🤖 Model Machine Learning
            </label>
            <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <input
                  type="radio"
                  name="model"
                  value="randomforest"
                  checked={modelType === "randomforest"}
                  onChange={(e) => setModelType(e.target.value)}
                />
                Random Forest
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <input
                  type="radio"
                  name="model"
                  value="svm"
                  checked={modelType === "svm"}
                  onChange={(e) => setModelType(e.target.value)}
                />
                SVM (Support Vector Machine)
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <input
                  type="radio"
                  name="model"
                  value="gradientboosting"
                  checked={modelType === "gradientboosting"}
                  onChange={(e) => setModelType(e.target.value)}
                />
                Gradient Boosting
              </label>
            </div>
          </div>

          <button
            onClick={handleStartTraining}
            disabled={!selectedDatasetId}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: selectedDatasetId ? "#319795" : "#cbd5e0",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: selectedDatasetId ? "pointer" : "not-allowed",
            }}
          >
            🚀 Start Training
          </button>
        </div>
      )}

      {isTraining && (
        <div
          className="vitality-card"
          style={{ backgroundColor: "#c3fae8", borderLeft: "4px solid #12b886" }}
        >
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "18px", fontWeight: "bold", color: "#155e75" }}>
              ⏳ Training in progress...
            </p>
            <p style={{ color: "#155e75" }}>Training ID: {trainingId}</p>
            <div
              style={{
                display: "inline-block",
                width: "30px",
                height: "30px",
                border: "3px solid #12b886",
                borderTop: "3px solid transparent",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        </div>
      )}

      {trainingResult && (
        <div className="vitality-card">
          <h3 style={{ color: "#22543d" }}>✅ Training Completed!</h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "15px",
              marginBottom: "20px",
            }}
          >
            <div style={{ backgroundColor: "#f0fdf4", padding: "15px", borderRadius: "6px" }}>
              <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>Accuracy</p>
              <p style={{ margin: "5px 0 0 0", fontSize: "28px", fontWeight: "bold", color: "#22c55e" }}>
                {(trainingResult.accuracy * 100).toFixed(2)}%
              </p>
            </div>

            <div style={{ backgroundColor: "#f5f3ff", padding: "15px", borderRadius: "6px" }}>
              <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>Samples</p>
              <p style={{ margin: "5px 0 0 0", fontSize: "28px", fontWeight: "bold", color: "#a855f7" }}>
                {trainingResult.nSamples}
              </p>
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <h4>Training Details</h4>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "14px",
              }}
            >
              <tbody>
                <tr>
                  <td style={{ padding: "8px", borderBottom: "1px solid #e2e8f0", fontWeight: "bold" }}>
                    Training ID
                  </td>
                  <td style={{ padding: "8px", borderBottom: "1px solid #e2e8f0" }}>
                    {trainingResult.trainingId}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "8px", borderBottom: "1px solid #e2e8f0", fontWeight: "bold" }}>
                    Trainer
                  </td>
                  <td style={{ padding: "8px", borderBottom: "1px solid #e2e8f0" }}>
                    {trainingResult.trainerAddress?.substring(0, 15)}...
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "8px", borderBottom: "1px solid #e2e8f0", fontWeight: "bold" }}>
                    Dataset
                  </td>
                  <td style={{ padding: "8px", borderBottom: "1px solid #e2e8f0" }}>
                    {trainingResult.datasetName}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "8px", borderBottom: "1px solid #e2e8f0", fontWeight: "bold" }}>
                    Mode
                  </td>
                  <td style={{ padding: "8px", borderBottom: "1px solid #e2e8f0" }}>
                    {trainingResult.mode}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "8px", borderBottom: "1px solid #e2e8f0", fontWeight: "bold" }}>
                    Model Type
                  </td>
                  <td style={{ padding: "8px", borderBottom: "1px solid #e2e8f0" }}>
                    {trainingResult.model_type || "RandomForest"}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "8px", borderBottom: "1px solid #e2e8f0", fontWeight: "bold" }}>
                    Status
                  </td>
                  <td style={{ padding: "8px", borderBottom: "1px solid #e2e8f0" }}>
                    <span style={{ color: "#22c55e", fontWeight: "bold" }}>✅ Completed</span>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "8px", fontWeight: "bold" }}>Completed At</td>
                  <td style={{ padding: "8px" }}>
                    {new Date(trainingResult.endTime).toLocaleString("vi-VN")}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {trainingResult.report && (
            <div style={{ marginBottom: "20px" }}>
              <h4>Classification Report</h4>
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "13px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: "#f7fafc" }}>
                      <th style={{ padding: "10px", textAlign: "left", fontWeight: "bold", borderBottom: "2px solid #cbd5e0" }}>
                        Class
                      </th>
                      <th style={{ padding: "10px", textAlign: "center", fontWeight: "bold", borderBottom: "2px solid #cbd5e0" }}>
                        Precision
                      </th>
                      <th style={{ padding: "10px", textAlign: "center", fontWeight: "bold", borderBottom: "2px solid #cbd5e0" }}>
                        Recall
                      </th>
                      <th style={{ padding: "10px", textAlign: "center", fontWeight: "bold", borderBottom: "2px solid #cbd5e0" }}>
                        F1-Score
                      </th>
                      <th style={{ padding: "10px", textAlign: "center", fontWeight: "bold", borderBottom: "2px solid #cbd5e0" }}>
                        Support
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(trainingResult.report)
                      .filter(([key]) => !["accuracy", "macro avg", "weighted avg"].includes(key))
                      .map(([classLabel, metrics], idx) => (
                        <tr
                          key={idx}
                          style={{
                            backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f9fafb",
                          }}
                        >
                          <td style={{ padding: "10px", borderBottom: "1px solid #e2e8f0", fontWeight: "bold" }}>
                            Class {classLabel}
                          </td>
                          <td style={{ padding: "10px", borderBottom: "1px solid #e2e8f0", textAlign: "center" }}>
                            {(metrics.precision * 100).toFixed(2)}%
                          </td>
                          <td style={{ padding: "10px", borderBottom: "1px solid #e2e8f0", textAlign: "center" }}>
                            {(metrics.recall * 100).toFixed(2)}%
                          </td>
                          <td style={{ padding: "10px", borderBottom: "1px solid #e2e8f0", textAlign: "center" }}>
                            {(metrics["f1-score"] * 100).toFixed(2)}%
                          </td>
                          <td style={{ padding: "10px", borderBottom: "1px solid #e2e8f0", textAlign: "center" }}>
                            {metrics.support}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Macro & Weighted Avg */}
              <div style={{ marginTop: "15px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                {trainingResult.report["macro avg"] && (
                  <div
                    style={{
                      padding: "12px",
                      backgroundColor: "#eff6ff",
                      borderLeft: "4px solid #3b82f6",
                      borderRadius: "6px",
                    }}
                  >
                    <p style={{ margin: "0 0 8px 0", fontWeight: "bold", color: "#1e40af" }}>
                      📊 Macro Average
                    </p>
                    <p style={{ margin: "3px 0", fontSize: "12px" }}>
                      Precision: <strong>{(trainingResult.report["macro avg"].precision * 100).toFixed(2)}%</strong>
                    </p>
                    <p style={{ margin: "3px 0", fontSize: "12px" }}>
                      Recall: <strong>{(trainingResult.report["macro avg"].recall * 100).toFixed(2)}%</strong>
                    </p>
                    <p style={{ margin: "3px 0", fontSize: "12px" }}>
                      F1-Score: <strong>{(trainingResult.report["macro avg"]["f1-score"] * 100).toFixed(2)}%</strong>
                    </p>
                  </div>
                )}

                {trainingResult.report["weighted avg"] && (
                  <div
                    style={{
                      padding: "12px",
                      backgroundColor: "#f0fdf4",
                      borderLeft: "4px solid #22c55e",
                      borderRadius: "6px",
                    }}
                  >
                    <p style={{ margin: "0 0 8px 0", fontWeight: "bold", color: "#166534" }}>
                      ⚖️ Weighted Average
                    </p>
                    <p style={{ margin: "3px 0", fontSize: "12px" }}>
                      Precision: <strong>{(trainingResult.report["weighted avg"].precision * 100).toFixed(2)}%</strong>
                    </p>
                    <p style={{ margin: "3px 0", fontSize: "12px" }}>
                      Recall: <strong>{(trainingResult.report["weighted avg"].recall * 100).toFixed(2)}%</strong>
                    </p>
                    <p style={{ margin: "3px 0", fontSize: "12px" }}>
                      F1-Score: <strong>{(trainingResult.report["weighted avg"]["f1-score"] * 100).toFixed(2)}%</strong>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {trainingResult.confusionMatrix && (
            <div style={{ marginBottom: "20px" }}>
              <h4>Confusion Matrix</h4>
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    borderCollapse: "collapse",
                    margin: "10px 0",
                  }}
                >
                  <thead>
                    <tr>
                      <th
                        style={{
                          padding: "8px 10px",
                          textAlign: "center",
                          fontWeight: "bold",
                          borderBottom: "2px solid #cbd5e0",
                        }}
                      >
                        Predicted →
                      </th>
                      {trainingResult.confusionMatrix[0]?.map((_, colIdx) => (
                        <th
                          key={`header-${colIdx}`}
                          style={{
                            padding: "8px 10px",
                            textAlign: "center",
                            fontWeight: "bold",
                            borderBottom: "2px solid #cbd5e0",
                            minWidth: "60px",
                          }}
                        >
                          {colIdx}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {trainingResult.confusionMatrix.map((row, rowIdx) => (
                      <tr key={`row-${rowIdx}`}>
                        <td
                          style={{
                            padding: "8px 10px",
                            textAlign: "center",
                            fontWeight: "bold",
                            borderRight: "2px solid #cbd5e0",
                            backgroundColor: "#f7fafc",
                          }}
                        >
                          {rowIdx}
                        </td>
                        {row.map((value, colIdx) => (
                          <td
                            key={`cell-${rowIdx}-${colIdx}`}
                            style={{
                              padding: "8px 10px",
                              textAlign: "center",
                              borderBottom: "1px solid #e2e8f0",
                              borderRight: colIdx < row.length - 1 ? "1px solid #e2e8f0" : "none",
                              backgroundColor:
                                rowIdx === colIdx
                                  ? "#d1fae5" // Diagonal: correct predictions (green)
                                  : value === 0
                                  ? "#ffffff"
                                  : "#fef3c7", // Misclassifications (yellow)
                              fontWeight: rowIdx === colIdx ? "bold" : "normal",
                              color: rowIdx === colIdx ? "#065f46" : "#374151",
                            }}
                          >
                            {value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
                ℹ️ <strong>Hàng</strong> = Actual label | <strong>Cột</strong> = Predicted label | 
                <span style={{ color: "#065f46", fontWeight: "bold" }}> 🟢 Đúng</span> | 
                <span style={{ color: "#b45309", fontWeight: "bold" }}> 🟡 Sai</span>
              </p>
            </div>
          )}

          <button
            onClick={resetForm}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: "#319795",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            🔄 Train Another Model
          </button>
        </div>
      )}
    </div>
  );
}
