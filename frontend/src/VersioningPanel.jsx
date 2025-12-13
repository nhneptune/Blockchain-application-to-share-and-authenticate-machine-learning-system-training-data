import { useState } from "react";

export default function VersioningPanel({ uploadData, walletAddress }) {
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [versionForm, setVersionForm] = useState({
    changeLog: "",
    customVersion: "", // Tùy chọn: user có thể tự định nghĩa version
  });
  const [versionStatus, setVersionStatus] = useState("");
  const [loading, setLoading] = useState(false);

  if (!uploadData) {
    return null;
  }

  const handleVersionChange = (e) => {
    const { name, value } = e.target;
    setVersionForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const createNewVersion = async () => {
    if (!versionForm.changeLog.trim()) {
      alert("Vui lòng nhập mô tả thay đổi");
      return;
    }

    setLoading(true);
    setVersionStatus("📝 Đang tạo version...");

    try {
      // Call backend API để tạo version
      const res = await fetch("http://localhost:4000/versions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataId: uploadData.dataId, // Cần truyền từ RegisterData component
          hash: uploadData.hash,
          changeLog: versionForm.changeLog,
          version: versionForm.customVersion || undefined, // Auto-generate nếu để trống
          updatedBy: walletAddress,
          datasetName: uploadData.metadata?.datasetName || "Unknown",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setVersionStatus(`❌ Lỗi: ${data.error}`);
        return;
      }

      setVersionStatus(`✔ Version ${data.version} được tạo thành công!`);
      setVersionForm({ changeLog: "", customVersion: "" });

      // Reset sau 3 giây
      setTimeout(() => {
        setVersionStatus("");
      }, 3000);
    } catch (err) {
      setVersionStatus(`❌ Lỗi: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: "30px", border: "1px solid #ddd", padding: "20px", borderRadius: "8px", backgroundColor: "#f0f8ff" }}>
      <h3>📝 Tạo Version Mới</h3>

      {!isCreatingVersion ? (
        <button
          onClick={() => setIsCreatingVersion(true)}
          style={{
            padding: "10px 20px",
            backgroundColor: "#FF9800",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "bold",
          }}
        >
          + Tạo Version Mới
        </button>
      ) : (
        <div>
          <div style={{ marginBottom: "15px" }}>
            <label><b>Mô tả thay đổi:</b> <span style={{ color: "red" }}>*</span></label>
            <textarea
              name="changeLog"
              value={versionForm.changeLog}
              onChange={handleVersionChange}
              placeholder="Ví dụ: Sửa 10 mẫu dữ liệu lỗi, thêm 100 ảnh mới..."
              disabled={loading}
              style={{
                width: "100%",
                padding: "8px",
                marginTop: "5px",
                minHeight: "80px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label><b>Version (Tùy chọn):</b></label>
            <input
              type="text"
              name="customVersion"
              value={versionForm.customVersion}
              onChange={handleVersionChange}
              placeholder="VD: 1.1, 2.0 (để trống để auto-generate)"
              disabled={loading}
              style={{
                width: "100%",
                padding: "8px",
                marginTop: "5px",
                boxSizing: "border-box",
              }}
            />
            <small style={{ color: "#666" }}>
              Format: X.Y hoặc X.Y.Z. Nếu để trống, hệ thống sẽ tự động tăng version minor.
            </small>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={createNewVersion}
              disabled={loading || !versionForm.changeLog.trim()}
              style={{
                padding: "10px 20px",
                backgroundColor: loading ? "#ccc" : "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              {loading ? "Đang xử lý..." : "✔ Tạo Version"}
            </button>

            <button
              onClick={() => {
                setIsCreatingVersion(false);
                setVersionForm({ changeLog: "", customVersion: "" });
                setVersionStatus("");
              }}
              disabled={loading}
              style={{
                padding: "10px 20px",
                backgroundColor: "#666",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              Hủy
            </button>
          </div>

          {versionStatus && (
            <div style={{ marginTop: "15px", padding: "10px", backgroundColor: "#fff3cd", borderRadius: "4px" }}>
              <p style={{ color: versionStatus.includes("✔") ? "green" : "red" }}>
                {versionStatus}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
