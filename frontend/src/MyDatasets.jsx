import { useState, useEffect } from "react";
import CollaboratorsManager from "./CollaboratorsManager";
import DatasetDetail from "./DatasetDetail";

export default function MyDatasets({ walletAddress }) {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDatasetId, setSelectedDatasetId] = useState(null);

  useEffect(() => {
    if (walletAddress) {
      fetchMyDatasets();
    }
  }, [walletAddress]);

  const fetchMyDatasets = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `http://localhost:4000/collaborations/my-datasets/${walletAddress}`
      );
      const data = await res.json();

      if (data.success) {
        setDatasets(data.datasets || []);
        setError("");
      } else {
        setError(data.error || "Không thể tải danh sách");
      }
    } catch (err) {
      setError("Lỗi: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "owner":
        return "#e3f2fd";
      case "editor":
        return "#fff3e0";
      case "viewer":
        return "#f5f5f5";
      default:
        return "#f0f0f0";
    }
  };

  const getRoleBorder = (role) => {
    switch (role) {
      case "owner":
        return "1px solid #2196F3";
      case "editor":
        return "1px solid #ff9800";
      case "viewer":
        return "1px solid #ccc";
      default:
        return "1px solid #ddd";
    }
  };

  const getRoleText = (role) => {
    switch (role) {
      case "owner":
        return "👑 Owner";
      case "editor":
        return "✏️ Editor";
      case "viewer":
        return "👁️ Viewer";
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <p>⏳ Đang tải danh sách datasets của bạn...</p>
      </div>
    );
  }

  // Nếu đã chọn dataset, hiển thị DatasetDetail component
  if (selectedDatasetId) {
    return (
      <DatasetDetail 
        datasetId={selectedDatasetId} 
        walletAddress={walletAddress}
        onBack={() => setSelectedDatasetId(null)}
      />
    );
  }

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
      <h2 style={{ marginBottom: "20px" }}>📚 Datasets của Tôi</h2>

      {error && (
        <div
          style={{
            padding: "15px",
            backgroundColor: "#ffe0e0",
            color: "#d32f2f",
            borderRadius: "8px",
            marginBottom: "20px",
            border: "1px solid #ffb6c6",
          }}
        >
          ❌ {error}
        </div>
      )}

      {datasets.length === 0 ? (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            backgroundColor: "#f5f5f5",
            borderRadius: "8px",
            border: "1px solid #eee",
          }}
        >
          <p style={{ fontSize: "16px", color: "#666", margin: 0 }}>
            ℹ️ Bạn chưa là contributor của dataset nào
          </p>
          <p style={{ fontSize: "13px", color: "#999", marginTop: "8px" }}>
            Người khác sẽ cần thêm bạn làm collaborator hoặc tạo dataset của riêng bạn
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "15px" }}>
          {datasets.map((ds, idx) => (
            <div
              key={idx}
              className="vitality-card"
              onClick={() => setSelectedDatasetId(ds.id)}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: "20px",
                alignItems: "start",
                cursor: "pointer",
                transition: "all 0.3s ease",
                backgroundColor: "#fff",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f0f4f8";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#fff";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div>
                <h3 style={{ margin: "0 0 10px 0", fontSize: "18px" }}>
                  📁 {ds.datasetName}
                </h3>

                <div style={{ fontSize: "13px", color: "#666", lineHeight: "1.8" }}>
                  <p style={{ margin: "5px 0" }}>
                    <b>ID:</b> #{ds.id}
                  </p>
                  <p style={{ margin: "5px 0" }}>
                    <b>Versions:</b> {ds.totalVersions} version(s) | Latest: v{ds.latestVersion}
                  </p>
                  <p style={{ margin: "5px 0" }}>
                    <b>Loại:</b> {ds.metadata?.dataType || "N/A"}
                  </p>
                  <p style={{ margin: "5px 0" }}>
                    <b>License:</b> {ds.metadata?.license || "N/A"}
                  </p>

                  {ds.metadata?.description && (
                    <p
                      style={{
                        margin: "8px 0 0 0",
                        padding: "8px",
                        backgroundColor: "#f9f9f9",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontStyle: "italic",
                      }}
                    >
                      {ds.metadata.description.substring(0, 100)}
                      {ds.metadata.description.length > 100 ? "..." : ""}
                    </p>
                  )}
                </div>

                {ds.contributors && ds.contributors.length > 0 && (
                  <div style={{ marginTop: "12px" }}>
                    <small style={{ color: "#999", fontWeight: "bold" }}>
                      👥 {ds.contributors.length} contributor(s)
                    </small>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
                      {ds.contributors.slice(0, 5).map((c, i) => (
                        <span
                          key={i}
                          style={{
                            padding: "3px 8px",
                            backgroundColor: getRoleColor(c.role),
                            border: getRoleBorder(c.role),
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: "500",
                          }}
                        >
                          {getRoleText(c.role)}: {c.address.substring(0, 8)}...
                        </span>
                      ))}
                      {ds.contributors.length > 5 && (
                        <span style={{ padding: "3px 8px", fontSize: "11px", color: "#999" }}>
                          +{ds.contributors.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div
                style={{
                  backgroundColor: getRoleColor(ds.userRole),
                  border: getRoleBorder(ds.userRole),
                  borderRadius: "8px",
                  padding: "15px 20px",
                  textAlign: "center",
                  minWidth: "120px",
                }}
              >
                <div style={{ fontSize: "24px", marginBottom: "8px" }}>
                  {ds.userRole === "owner"
                    ? "👑"
                    : ds.userRole === "editor"
                    ? "✏️"
                    : "👁️"}
                </div>
                <div style={{ fontWeight: "bold", fontSize: "13px" }}>
                  {getRoleText(ds.userRole)}
                </div>
                <div style={{ fontSize: "11px", color: "#666", marginTop: "8px" }}>
                  {ds.userRole === "owner"
                    ? "Full Control"
                    : ds.userRole === "editor"
                    ? "Can Edit"
                    : "Read Only"}
                </div>
              </div>
            </div>
          ))}

          <p style={{ marginTop: "30px", color: "#999", fontSize: "12px", textAlign: "center" }}>
            Tổng cộng: {datasets.length} dataset
          </p>
        </div>
      )}
    </div>
  );
}
