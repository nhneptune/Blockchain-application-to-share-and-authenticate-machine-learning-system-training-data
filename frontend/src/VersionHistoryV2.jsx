import { useState, useEffect } from "react";

export default function VersionHistoryV2() {
  const [selectedDatasetId, setSelectedDatasetId] = useState(null);
  const [datasets, setDatasets] = useState([]);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Fetch datasets
  useEffect(() => {
    fetchDatasets();
    // Set up auto-refresh every 2 seconds
    const interval = setInterval(() => {
      fetchDatasets();
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchDatasets = async () => {
    try {
      const res = await fetch("http://localhost:4000/contributions");
      const data = await res.json();
      console.log("📊 Fetched datasets:", data);
      setDatasets(data.items || []);
      setError("");
    } catch (err) {
      console.error("Error fetching datasets:", err);
      setError("Không thể tải danh sách datasets");
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDatasets();
    setRefreshing(false);
  };

  // Fetch versions khi chọn dataset
  useEffect(() => {
    if (selectedDatasetId !== null) {
      fetchVersions(selectedDatasetId);
    }
  }, [selectedDatasetId]);

  const fetchVersions = async (datasetId) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`http://localhost:4000/versions/dataset/${datasetId}`);
      const data = await res.json();
      console.log("📜 Fetched versions:", data);
      
      if (data.success) {
        setVersions(data.versions || []);
      } else {
        setError("Không thể tải version history");
      }
    } catch (err) {
      console.error("Error fetching versions:", err);
      setError("Lỗi khi tải version history");
    } finally {
      setLoading(false);
    }
  };

  const selectedDataset = datasets.find((d) => d.id === selectedDatasetId);

  return (
    <div className="vitality-card" style={{ maxWidth: "1000px", margin: "20px auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h2 style={{ margin: 0 }}>📚 Version History</h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            padding: "8px 16px",
            background: refreshing ? "#ccc" : "#4b7bec",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: refreshing ? "not-allowed" : "pointer",
            fontSize: "12px",
            fontWeight: "bold",
          }}
        >
          {refreshing ? "⏳ Đang tải..." : "🔄 Refresh"}
        </button>
      </div>

      {error && (
        <p style={{ color: "red", padding: "10px", background: "#ffe0e0", borderRadius: "8px" }}>
          {error}
        </p>
      )}

      {/* Dataset Selection */}
      <div style={{ marginBottom: "25px" }}>
        <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>
          Chọn Dataset ({datasets.length} datasets)
        </label>
        <select
          value={selectedDatasetId || ""}
          onChange={(e) => {
            const datasetId = e.target.value ? parseInt(e.target.value) : null;
            setSelectedDatasetId(datasetId);
          }}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            fontSize: "14px",
          }}
        >
          <option value="">-- Chọn dataset --</option>
          {datasets.map((d) => (
            <option key={d.id} value={d.id}>
              {d.metadata?.datasetName} (ID: {d.id}, v{d.version}, {d.totalVersions} versions)
            </option>
          ))}
        </select>
      </div>

      {/* Dataset Info */}
      {selectedDataset && (
        <div
          style={{
            background: "#f0f4f8",
            padding: "15px",
            borderRadius: "8px",
            marginBottom: "25px",
          }}
        >
          <p>
            <b>Dataset:</b> {selectedDataset.metadata?.datasetName}
          </p>
          <p>
            <b>Type:</b> {selectedDataset.metadata?.dataType}
          </p>
          <p>
            <b>Owner:</b> {selectedDataset.owner.substring(0, 10)}...
          </p>
          <p>
            <b>License:</b> {selectedDataset.metadata?.license}
          </p>
        </div>
      )}

      {/* Versions List */}
      {selectedDataset && (
        <div style={{ marginTop: "25px" }}>
          <h3 style={{ marginBottom: "15px" }}>
            Version History ({versions.length} versions)
          </h3>

          {loading ? (
            <p style={{ textAlign: "center", color: "#666" }}>⏳ Đang tải...</p>
          ) : versions.length === 0 ? (
            <p style={{ textAlign: "center", color: "#999" }}>Không có version nào</p>
          ) : (
            <div>
              {versions.map((version, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "15px",
                    marginBottom: "12px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    background: idx === versions.length - 1 ? "#f0ffe0" : "#fafafa",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                    <div>
                      <p style={{ margin: "0 0 8px 0" }}>
                        <b style={{ fontSize: "16px" }}>v{version.version}</b>
                        {idx === versions.length - 1 && (
                          <span
                            style={{
                              marginLeft: "8px",
                              background: "#4CAF50",
                              color: "white",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              fontSize: "12px",
                              fontWeight: "bold",
                            }}
                          >
                            Latest
                          </span>
                        )}
                      </p>
                      <p style={{ margin: "5px 0", fontSize: "14px", color: "#666" }}>
                        <b>Hash:</b> <code style={{ fontSize: "12px" }}>{version.hash.substring(0, 16)}...</code>
                      </p>
                      <p style={{ margin: "5px 0", fontSize: "14px", color: "#666" }}>
                        <b>File:</b> {version.filename}
                      </p>
                      <p style={{ margin: "5px 0", fontSize: "14px", color: "#666" }}>
                        <b>Size:</b> {(version.fileSize / 1024).toFixed(2)} KB
                      </p>
                      <p style={{ margin: "5px 0", fontSize: "14px", color: "#666" }}>
                        <b>Changelog:</b> {version.changelog}
                      </p>
                      <p style={{ margin: "5px 0", fontSize: "12px", color: "#999" }}>
                        <b>Uploaded:</b> {new Date(version.uploadedAt).toLocaleString()}
                      </p>
                      {version.blockchainId && (
                        <p style={{ margin: "5px 0", fontSize: "12px", color: "#0066cc" }}>
                          <b>🔗 Blockchain ID:</b> {version.blockchainId}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
