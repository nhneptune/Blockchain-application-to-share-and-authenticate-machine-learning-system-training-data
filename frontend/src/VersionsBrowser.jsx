import { useEffect, useState } from "react";

export default function VersionsBrowser() {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [expandedVersionId, setExpandedVersionId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAllDatasets();
    // Auto-refresh every 3 seconds
    const interval = setInterval(() => {
      fetchAllDatasets();
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchAllDatasets = async () => {
    setError("");

    try {
      console.log("📊 [VersionsBrowser] Fetching all datasets...");
      const res = await fetch("http://localhost:4000/versions/all");
      const data = await res.json();

      console.log("📊 [VersionsBrowser] Response:", data);

      if (data.error) {
        setError(data.error);
        setDatasets([]);
      } else if (data.success) {
        const items = data.items || [];
        console.log(`✅ [VersionsBrowser] Got ${items.length} datasets`);
        items.forEach((d) => {
          console.log(`  Dataset ${d.id}: ${d.datasetName} (${d.totalVersions} versions)`);
        });
        setDatasets(items);
      } else {
        setError("Invalid response format");
        setDatasets([]);
      }
    } catch (err) {
      console.error("❌ [VersionsBrowser] Error fetching datasets:", err);
      setError("Không thể tải dữ liệu version: " + err.message);
    }

    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllDatasets();
    setRefreshing(false);
  };

  const toggleExpanded = (datasetId, versionString) => {
    const versionId = `${datasetId}-${versionString}`;
    setExpandedVersionId(expandedVersionId === versionId ? null : versionId);
  };

  // Filter datasets by name or version
  const filteredDatasets = datasets.filter((dataset) => {
    if (!searchFilter) return true;
    const datasetName = dataset.datasetName || "";
    const version = dataset.latestVersion || "";
    return (
      datasetName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      version.toLowerCase().includes(searchFilter.toLowerCase())
    );
  });

  return (
    <div style={{ marginTop: "30px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ margin: 0 }}>📊 Tra cứu Versions</h2>
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

      {/* Search Bar */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="🔍 Tìm kiếm theo tên dataset hoặc version..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            fontSize: "14px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            boxSizing: "border-box",
          }}
        />
      </div>

      {loading && <p>⏳ Đang tải dữ liệu...</p>}
      {error && <p style={{ color: "red" }}>❌ {error}</p>}

      {!loading && !error && datasets.length === 0 && (
        <div style={{ 
          backgroundColor: "#fff3cd", 
          padding: "20px", 
          borderRadius: "4px", 
          border: "1px solid #ffc107",
          textAlign: "center"
        }}>
          <p style={{ color: "#856404", fontSize: "16px", margin: 0 }}>
            ℹ️ Chưa có dataset nào được tạo.
          </p>
          <p style={{ color: "#856404", fontSize: "13px", marginTop: "8px" }}>
            Vui lòng <strong>Upload Dataset</strong> để tạo phiên bản v1.0.
          </p>
        </div>
      )}

      {!loading && !error && datasets.length > 0 && filteredDatasets.length === 0 && (
        <div style={{ 
          backgroundColor: "#f0f8ff", 
          padding: "15px", 
          borderRadius: "4px", 
          border: "1px solid #2196F3"
        }}>
          <p style={{ color: "#1565c0", margin: 0 }}>
            🔍 Không tìm thấy dataset với tên <strong>"{searchFilter}"</strong>
          </p>
          <p style={{ color: "#666", fontSize: "12px", marginTop: "8px" }}>
            Hiện có {datasets.length} dataset. Thử nhập tên khác hoặc xóa bộ lọc.
          </p>
        </div>
      )}

      {!loading && !error && filteredDatasets.length > 0 && (
        <div>
          {filteredDatasets.map((dataset) => {
            const datasetId = dataset.id;
            const datasetName = dataset.datasetName;
            const versions = dataset.versions || [];

            return (
              <div
                key={datasetId}
                style={{
                  marginBottom: "20px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  padding: "15px",
                  backgroundColor: "#f9f9f9",
                }}
              >
                {/* Dataset Header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "15px",
                  }}
                >
                  <div>
                    <h3 style={{ margin: "0 0 5px 0" }}>📁 {datasetName}</h3>
                    <small style={{ color: "#666" }}>
                      Dataset ID: #{datasetId} | {dataset.totalVersions} version(s) | Latest: v{dataset.latestVersion}
                    </small>
                  </div>
                </div>

                {/* Versions List */}
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      border: "1px solid #ddd",
                      backgroundColor: "white",
                    }}
                  >
                    <thead>
                      <tr style={{ backgroundColor: "#f5f5f5" }}>
                        <th
                          style={{
                            border: "1px solid #ddd",
                            padding: "10px",
                            textAlign: "left",
                            width: "40px",
                          }}
                        >
                          🔍
                        </th>
                        <th
                          style={{
                            border: "1px solid #ddd",
                            padding: "10px",
                            textAlign: "left",
                          }}
                        >
                          Version
                        </th>
                        <th
                          style={{
                            border: "1px solid #ddd",
                            padding: "10px",
                            textAlign: "left",
                          }}
                        >
                          Ngày Tạo
                        </th>
                        <th
                          style={{
                            border: "1px solid #ddd",
                            padding: "10px",
                            textAlign: "left",
                          }}
                        >
                          File Size
                        </th>
                        <th
                          style={{
                            border: "1px solid #ddd",
                            padding: "10px",
                            textAlign: "left",
                          }}
                        >
                          Changelog
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {versions.map((version, idx) => (
                        <tr key={idx} style={{ borderTop: "1px solid #eee" }}>
                          <td
                            style={{
                              border: "1px solid #ddd",
                              padding: "10px",
                              textAlign: "center",
                            }}
                          >
                            <button
                              onClick={() => toggleExpanded(datasetId, version.version)}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "16px",
                              }}
                            >
                              {expandedVersionId === `${datasetId}-${version.version}` ? "▼" : "▶"}
                            </button>
                          </td>
                          <td
                            style={{
                              border: "1px solid #ddd",
                              padding: "10px",
                              fontWeight: "bold",
                            }}
                          >
                            <span
                              style={{
                                backgroundColor: "#e3f2fd",
                                padding: "4px 8px",
                                borderRadius: "4px",
                                fontSize: "12px",
                              }}
                            >
                              v{version.version}
                            </span>
                          </td>
                          <td
                            style={{
                              border: "1px solid #ddd",
                              padding: "10px",
                              fontSize: "12px",
                            }}
                          >
                            {new Date(version.uploadedAt).toLocaleString()}
                          </td>
                          <td
                            style={{
                              border: "1px solid #ddd",
                              padding: "10px",
                              fontSize: "12px",
                            }}
                          >
                            {(version.fileSize / 1024).toFixed(2)} KB
                          </td>
                          <td
                            style={{
                              border: "1px solid #ddd",
                              padding: "10px",
                              color: "#666",
                              fontSize: "12px",
                            }}
                          >
                            {version.changelog.substring(0, 40)}
                            {version.changelog.length > 40 ? "..." : ""}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Expanded Details */}
                {expandedVersionId && expandedVersionId.startsWith(`${datasetId}-`) && (
                  <div style={{ marginTop: "15px" }}>
                    {versions.map((version, idx) => {
                      const versionId = `${datasetId}-${version.version}`;
                      if (expandedVersionId !== versionId) return null;
                      
                      return (
                        <div
                          key={idx}
                          style={{
                            backgroundColor: "white",
                            padding: "15px",
                            borderRadius: "4px",
                            border: "1px solid #e0e0e0",
                            marginBottom: "10px",
                          }}
                        >
                          <h4 style={{ margin: "0 0 15px 0", color: "#333" }}>
                            📋 Chi tiết Version {version.version}
                          </h4>
                          <table style={{ width: "100%", fontSize: "13px" }}>
                            <tbody>
                              <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                                <td
                                  style={{
                                    padding: "8px",
                                    fontWeight: "bold",
                                    width: "150px",
                                  }}
                                >
                                  Version:
                                </td>
                                <td style={{ padding: "8px" }}>v{version.version}</td>
                              </tr>
                              <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                                <td style={{ padding: "8px", fontWeight: "bold" }}>
                                  Dataset:
                                </td>
                                <td style={{ padding: "8px" }}>{datasetName}</td>
                              </tr>
                              <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                                <td style={{ padding: "8px", fontWeight: "bold" }}>
                                  Ngày Tạo:
                                </td>
                                <td style={{ padding: "8px" }}>
                                  {new Date(version.uploadedAt).toLocaleString()}
                                </td>
                              </tr>
                              <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                                <td style={{ padding: "8px", fontWeight: "bold" }}>
                                  File Size:
                                </td>
                                <td style={{ padding: "8px" }}>
                                  {(version.fileSize / 1024).toFixed(2)} KB
                                </td>
                              </tr>
                              <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                                <td style={{ padding: "8px", fontWeight: "bold" }}>
                                  File Name:
                                </td>
                                <td style={{ padding: "8px", fontFamily: "monospace", fontSize: "11px" }}>
                                  {version.filename}
                                </td>
                              </tr>
                              <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                                <td style={{ padding: "8px", fontWeight: "bold" }}>
                                  Hash:
                                </td>
                                <td
                                  style={{
                                    padding: "8px",
                                    fontFamily: "monospace",
                                    fontSize: "11px",
                                    wordBreak: "break-all",
                                  }}
                                >
                                  {version.hash}
                                </td>
                              </tr>
                              <tr>
                                <td
                                  style={{
                                    padding: "8px",
                                    fontWeight: "bold",
                                    verticalAlign: "top",
                                  }}
                                >
                                  Changelog:
                                </td>
                                <td
                                  style={{
                                    padding: "8px",
                                    whiteSpace: "pre-wrap",
                                  }}
                                >
                                  {version.changelog}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          <p style={{ marginTop: "30px", color: "#666", fontSize: "12px" }}>
            📊 Tổng cộng: {filteredDatasets.length} dataset
          </p>
        </div>
      )}
    </div>
  );
}
