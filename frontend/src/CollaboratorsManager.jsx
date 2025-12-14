import { useState, useEffect } from "react";

export default function CollaboratorsManager({ datasetId, ownerAddress, walletAddress }) {
  const [contributors, setContributors] = useState([]);
  const [newContributor, setNewContributor] = useState("");
  const [role, setRole] = useState("editor");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" hoặc "error"

  useEffect(() => {
    fetchContributors();
  }, [datasetId]);

  const fetchContributors = async () => {
    try {
      const res = await fetch(
        `http://localhost:4000/collaborations/${datasetId}/contributors`
      );
      const data = await res.json();
      if (data.success) {
        setContributors(data.contributors || []);
      }
    } catch (err) {
      console.error("Error fetching contributors:", err);
    }
  };

  const addContributor = async () => {
    if (!newContributor.trim()) {
      setMessage("❌ Vui lòng nhập wallet address");
      setMessageType("error");
      return;
    }

    if (!newContributor.startsWith("0x")) {
      setMessage("❌ Wallet address phải bắt đầu với 0x");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(
        `http://localhost:4000/collaborations/${datasetId}/add-contributor`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contributorAddress: newContributor,
            role: role,
            ownerAddress: walletAddress,
          }),
        }
      );

      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ Đã thêm contributor: ${newContributor.substring(0, 10)}...`);
        setMessageType("success");
        setNewContributor("");
        setContributors(data.contributors || []);
      } else {
        setMessage(`❌ ${data.error}`);
        setMessageType("error");
      }
    } catch (err) {
      setMessage(`❌ Lỗi: ${err.message}`);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const removeContributor = async (address) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa contributor ${address.substring(0, 10)}...?`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:4000/collaborations/${datasetId}/remove-contributor/${address}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ownerAddress: walletAddress }),
        }
      );

      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ Đã xóa contributor`);
        setMessageType("success");
        setContributors(data.contributors || []);
      } else {
        setMessage(`❌ ${data.error}`);
        setMessageType("error");
      }
    } catch (err) {
      setMessage(`❌ Lỗi: ${err.message}`);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  // Chỉ owner mới có thể manage contributors
  const isOwner = ownerAddress?.toLowerCase() === walletAddress?.toLowerCase();

  console.log("CollaboratorsManager Debug:", {
    ownerAddress,
    walletAddress,
    isOwner,
    datasetId,
  });

  return (
    <div
      className="vitality-card"
      style={{
        marginBottom: "20px",
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: "20px" }}>👥 Quản lý Collaborators</h3>

      {/* Contributors List */}
      <div style={{ marginBottom: "30px" }}>
        <h4 style={{ marginBottom: "15px" }}>
          Danh sách collaborators ({contributors.length})
        </h4>
        {contributors.length === 0 ? (
          <p style={{ color: "#666", fontStyle: "italic" }}>Chưa có collaborator nào</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {contributors.map((contributor, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px",
                  backgroundColor: contributor.role === "owner" ? "#f0f4f8" : "#f9f9f9",
                  border:
                    contributor.role === "owner" ? "1px solid #2196F3" : "1px solid #eee",
                  borderRadius: "6px",
                }}
              >
                <div>
                  <p style={{ margin: "0 0 5px 0", fontSize: "14px", fontWeight: "bold" }}>
                    <code style={{ backgroundColor: "#e3f2fd", padding: "2px 6px", borderRadius: "3px" }}>
                      {contributor.address.substring(0, 10)}...
                    </code>
                  </p>
                  <small style={{ color: "#666" }}>
                    Role: <strong>{contributor.role === "owner" ? "👑 Owner" : contributor.role === "editor" ? "✏️ Editor" : "👁️ Viewer"}</strong> | Added:{" "}
                    {new Date(contributor.addedAt).toLocaleDateString()}
                  </small>
                </div>
                {isOwner && contributor.role !== "owner" && (
                  <button
                    onClick={() => removeContributor(contributor.address)}
                    disabled={loading}
                    style={{
                      padding: "6px 12px",
                      background: "#ff6b6b",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: loading ? "not-allowed" : "pointer",
                      fontSize: "12px",
                      fontWeight: "bold",
                      opacity: loading ? 0.6 : 1,
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Contributor */}
      {isOwner ? (
        <div
          style={{
            padding: "15px",
            backgroundColor: "#f0f4f8",
            borderRadius: "8px",
            border: "1px solid #2196F3",
          }}
        >
          <h4 style={{ marginTop: 0, marginBottom: "15px" }}>➕ Thêm Collaborator</h4>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: "bold" }}>
              Wallet Address:
            </label>
            <input
              type="text"
              value={newContributor}
              onChange={(e) => setNewContributor(e.target.value)}
              placeholder="0x..."
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
            <small style={{ color: "#666", marginTop: "4px", display: "block" }}>
              Nhập wallet address của người muốn mời
            </small>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: "bold" }}>
              Role:
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            >
              <option value="editor">✏️ Editor - Có thể upload versions mới</option>
              <option value="viewer">👁️ Viewer - Chỉ xem, không edit</option>
            </select>
          </div>

          <button
            onClick={addContributor}
            disabled={loading || !newContributor.trim()}
            style={{
              width: "100%",
              padding: "12px",
              background: loading || !newContributor.trim() ? "#ccc" : "#4b7bec",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: loading || !newContributor.trim() ? "not-allowed" : "pointer",
              fontWeight: "bold",
              fontSize: "14px",
            }}
          >
            {loading ? "⏳ Đang thêm..." : "✅ Thêm Collaborator"}
          </button>
        </div>
      ) : (
        <div
          style={{
            padding: "15px",
            backgroundColor: "#f5f5f5",
            borderRadius: "8px",
            textAlign: "center",
            color: "#666",
          }}
        >
          <p style={{ margin: 0 }}>
            Chỉ chủ sở hữu dataset mới có thể quản lý collaborators
          </p>
        </div>
      )}

      {/* Message */}
      {message && (
        <div
          style={{
            marginTop: "15px",
            padding: "12px",
            backgroundColor:
              messageType === "success" ? "#e0ffe0" : "#ffe0e0",
            color: messageType === "success" ? "green" : "red",
            borderRadius: "4px",
            border: messageType === "success" ? "1px solid #90EE90" : "1px solid #FFB6C6",
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
}
