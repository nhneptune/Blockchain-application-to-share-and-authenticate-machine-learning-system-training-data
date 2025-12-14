import { useState, useEffect } from "react";
import CollaboratorsManager from "./CollaboratorsManager";

export default function DatasetDetail({ datasetId, walletAddress, onBack }) {
  const [dataset, setDataset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (datasetId) {
      fetchDatasetDetails();
    }
  }, [datasetId]);

  const fetchDatasetDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `http://localhost:4000/versions/all`
      );
      const data = await res.json();

      if (data.success) {
        const found = data.items?.find((d) => d.id === datasetId);
        if (found) {
          setDataset(found);
          setError("");
        } else {
          setError("Dataset không tìm thấy");
        }
      }
    } catch (err) {
      setError("Lỗi tải dataset: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>⏳ Đang tải...</p>;
  if (error) return <p style={{ color: "red" }}>❌ {error}</p>;
  if (!dataset)
    return (
      <p>
        Dataset không tìm thấy.{" "}
        <button onClick={onBack} style={{ cursor: "pointer", background: "none", border: "none", color: "#4b7bec", textDecoration: "underline" }}>
          Quay lại
        </button>
      </p>
    );

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <button
        onClick={onBack}
        style={{
          marginBottom: "20px",
          padding: "8px 16px",
          background: "#f5f5f5",
          border: "1px solid #ddd",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "14px",
        }}
      >
        ← Quay lại
      </button>

      <div className="vitality-card" style={{ marginBottom: "25px" }}>
        <h2 style={{ marginTop: 0, marginBottom: "20px" }}>
          📊 {dataset.datasetName}
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
            marginBottom: "20px",
          }}
        >
          <div>
            <h4 style={{ margin: "0 0 15px 0" }}>Thông Tin Cơ Bản</h4>
            <table style={{ width: "100%", fontSize: "13px" }}>
              <tbody>
                <tr style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "8px 0", fontWeight: "bold", width: "120px" }}>Dataset ID:</td>
                  <td style={{ padding: "8px 0" }}>#{dataset.id}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "8px 0", fontWeight: "bold" }}>Tổng Versions:</td>
                  <td style={{ padding: "8px 0" }}>{dataset.totalVersions}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "8px 0", fontWeight: "bold" }}>Version Mới Nhất:</td>
                  <td style={{ padding: "8px 0" }}>v{dataset.latestVersion}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "8px 0", fontWeight: "bold" }}>Loại Dữ Liệu:</td>
                  <td style={{ padding: "8px 0" }}>{dataset.metadata?.dataType || "N/A"}</td>
                </tr>
                <tr>
                  <td style={{ padding: "8px 0", fontWeight: "bold" }}>License:</td>
                  <td style={{ padding: "8px 0" }}>{dataset.metadata?.license || "N/A"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <h4 style={{ margin: "0 0 15px 0" }}>📝 Mô Tả</h4>
            <p
              style={{
                margin: 0,
                padding: "12px",
                backgroundColor: "#f5f5f5",
                borderRadius: "4px",
                fontSize: "13px",
                lineHeight: "1.6",
                minHeight: "100px",
              }}
            >
              {dataset.metadata?.description || "Không có mô tả"}
            </p>
          </div>
        </div>

        {/* Recent Versions */}
        {dataset.versions && dataset.versions.length > 0 && (
          <div style={{ marginTop: "25px", paddingTop: "20px", borderTop: "1px solid #eee" }}>
            <h4 style={{ margin: "0 0 15px 0" }}>📦 Các Versions Gần Đây</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {dataset.versions.slice(-3).reverse().map((v, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "12px",
                    backgroundColor: "#f9f9f9",
                    borderRadius: "4px",
                    border: "1px solid #eee",
                    fontSize: "13px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: "bold", color: "#2196F3" }}>v{v.version}</span>
                    <span style={{ color: "#666", fontSize: "12px" }}>
                      {new Date(v.uploadedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ marginTop: "6px", color: "#555" }}>
                    {v.changelog.substring(0, 60)}
                    {v.changelog.length > 60 ? "..." : ""}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Collaborators Manager */}
      {dataset.metadata?.ownerAddress && (
        <CollaboratorsManager
          datasetId={dataset.id}
          ownerAddress={dataset.metadata.ownerAddress}
          walletAddress={walletAddress}
        />
      )}
    </div>
  );
}
