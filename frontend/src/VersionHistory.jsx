import { useEffect, useState } from "react";

export default function VersionHistory({ dataId }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedVersionId, setExpandedVersionId] = useState(null);

  useEffect(() => {
    if (dataId !== undefined && dataId !== null) {
      fetchVersions();
    }
  }, [dataId]);

  const fetchVersions = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`http://localhost:4000/versions/${dataId}`);
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setVersions([]);
      } else {
        setVersions(data.versions || []);
      }
    } catch (err) {
      console.error("Error fetching versions:", err);
      setError("Không thể tải lịch sử version");
    }

    setLoading(false);
  };

  const toggleExpanded = (versionId) => {
    setExpandedVersionId(expandedVersionId === versionId ? null : versionId);
  };

  if (dataId === undefined || dataId === null) {
    return null;
  }

  return (
    <div style={{ marginTop: "30px", border: "1px solid #ddd", padding: "20px", borderRadius: "8px" }}>
      <h3>📜 Lịch Sử Version</h3>

      {loading && <p>⏳ Đang tải lịch sử...</p>}
      {error && <p style={{ color: "red" }}>❌ {error}</p>}

      {!loading && !error && versions.length === 0 && (
        <p style={{ color: "#999" }}>Chưa có version nào. Tạo version đầu tiên để theo dõi lịch sử thay đổi.</p>
      )}

      {!loading && !error && versions.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #ddd" }}>
            <thead>
              <tr style={{ backgroundColor: "#f5f5f5" }}>
                <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left", width: "40px" }}>
                  🔍
                </th>
                <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>Version</th>
                <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>Ngày Tạo</th>
                <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>Người Update</th>
                <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>Thay Đổi</th>
              </tr>
            </thead>
            <tbody>
              {versions.map((version) => (
                <tr key={version.id} style={{ borderTop: "1px solid #eee" }}>
                  <td style={{ border: "1px solid #ddd", padding: "12px", textAlign: "center" }}>
                    <button
                      onClick={() => toggleExpanded(version.id)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "16px",
                      }}
                    >
                      {expandedVersionId === version.id ? "▼" : "▶"}
                    </button>
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "12px", fontWeight: "bold" }}>
                    <span style={{ backgroundColor: "#e3f2fd", padding: "4px 8px", borderRadius: "4px", fontSize: "12px" }}>
                      v{version.version}
                    </span>
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "12px", fontSize: "12px" }}>
                    {new Date(version.createdAt).toLocaleString()}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "12px", fontFamily: "monospace", fontSize: "11px" }}>
                    {version.updatedBy.substring(0, 10)}...
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "12px" }}>
                    <span style={{ color: "#666", fontSize: "12px" }}>
                      {version.changeLog.substring(0, 40)}
                      {version.changeLog.length > 40 ? "..." : ""}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Expanded Row - Version Details */}
          {expandedVersionId !== null && (
            <div style={{ marginTop: "15px", backgroundColor: "#f9f9f9", padding: "15px", borderRadius: "4px" }}>
              {versions
                .filter((v) => v.id === expandedVersionId)
                .map((version) => (
                  <div key={version.id}>
                    <h4 style={{ margin: "0 0 15px 0", color: "#333" }}>
                      📋 Chi tiết Version {version.version}
                    </h4>
                    <table style={{ width: "100%", fontSize: "13px" }}>
                      <tbody>
                        <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                          <td style={{ padding: "8px", fontWeight: "bold", width: "150px" }}>Version:</td>
                          <td style={{ padding: "8px" }}>v{version.version}</td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                          <td style={{ padding: "8px", fontWeight: "bold" }}>Ngày Tạo:</td>
                          <td style={{ padding: "8px" }}>
                            {new Date(version.createdAt).toLocaleString()}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                          <td style={{ padding: "8px", fontWeight: "bold" }}>Người Update:</td>
                          <td style={{ padding: "8px", fontFamily: "monospace", fontSize: "11px" }}>
                            {version.updatedBy}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                          <td style={{ padding: "8px", fontWeight: "bold" }}>Hash:</td>
                          <td style={{ padding: "8px", fontFamily: "monospace", fontSize: "11px", wordBreak: "break-all" }}>
                            {version.hash}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: "8px", fontWeight: "bold", verticalAlign: "top" }}>Thay Đổi:</td>
                          <td style={{ padding: "8px", whiteSpace: "pre-wrap" }}>
                            {version.changeLog}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {!loading && !error && versions.length > 0 && (
        <p style={{ marginTop: "15px", color: "#666", fontSize: "12px" }}>
          📊 Tổng cộng: {versions.length} version
        </p>
      )}
    </div>
  );
}
