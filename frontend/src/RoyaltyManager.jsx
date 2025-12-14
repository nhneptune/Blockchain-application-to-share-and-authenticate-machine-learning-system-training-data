import { useState, useEffect } from "react";

export default function RoyaltyManager({ datasetId, ownerAddress, walletAddress }) {
  const [contributors, setContributors] = useState([]);
  const [newContributor, setNewContributor] = useState("");
  const [percentage, setPercentage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" or "error"
  const [remainingPercentage, setRemainingPercentage] = useState(100);
  const [usageHistory, setUsageHistory] = useState([]);
  const [showUsageHistory, setShowUsageHistory] = useState(false);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

  useEffect(() => {
    if (datasetId) {
      fetchContributors();
      fetchUsageHistory();
    }
  }, [datasetId]);

  const fetchContributors = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/royalty/${datasetId}/contributors`);
      const data = await res.json();
      if (data.success) {
        setContributors(data.contributors || []);
        setRemainingPercentage(data.remainingPercentage || 0);
      }
    } catch (err) {
      console.error("Error fetching contributors:", err);
    }
  };

  const fetchUsageHistory = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/royalty/${datasetId}/usage-history`);
      const data = await res.json();
      if (data.success) {
        setUsageHistory(data.usageHistory || []);
      }
    } catch (err) {
      console.error("Error fetching usage history:", err);
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

    if (percentage < 1 || percentage > remainingPercentage) {
      setMessage(`❌ Phần trăm phải từ 1 đến ${remainingPercentage}%`);
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${BACKEND_URL}/royalty/${datasetId}/add-contributor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contributorAddress: newContributor,
          percentage: parseInt(percentage),
          ownerAddress: walletAddress,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ Đã thêm contributor: ${newContributor.substring(0, 10)}... (${percentage}%)`);
        setMessageType("success");
        setNewContributor("");
        setPercentage(10);
        fetchContributors();
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
    if (!window.confirm(`Bạn có chắc muốn xóa contributor ${address.substring(0, 10)}...?`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${BACKEND_URL}/royalty/${datasetId}/remove-contributor/${address}`,
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
        fetchContributors();
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

  const isOwner = walletAddress?.toLowerCase() === ownerAddress?.toLowerCase();

  return (
    <div style={{ marginTop: "30px", padding: "20px", border: "1px solid #ddd", borderRadius: "8px" }}>
      <h3 style={{ marginTop: 0 }}>💰 Quản Lý Royalty</h3>

      {/* Contributors List */}
      <div style={{ marginBottom: "20px" }}>
        <h4>👥 Danh Sách Contributors</h4>
        {contributors.length === 0 ? (
          <p style={{ color: "#666" }}>Chưa có contributor</p>
        ) : (
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
                <th style={{ border: "1px solid #ddd", padding: "10px", textAlign: "left" }}>
                  Address
                </th>
                <th style={{ border: "1px solid #ddd", padding: "10px", textAlign: "center" }}>
                  Royalty %
                </th>
                <th style={{ border: "1px solid #ddd", padding: "10px", textAlign: "right" }}>
                  Total Reward
                </th>
                <th style={{ border: "1px solid #ddd", padding: "10px", textAlign: "left" }}>
                  Joined
                </th>
                {isOwner && (
                  <th style={{ border: "1px solid #ddd", padding: "10px", textAlign: "center" }}>
                    Action
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {contributors.map((contributor, idx) => (
                <tr key={idx} style={{ borderTop: "1px solid #eee" }}>
                  <td
                    style={{
                      border: "1px solid #ddd",
                      padding: "10px",
                      fontFamily: "monospace",
                      fontSize: "12px",
                    }}
                  >
                    {contributor.address?.substring(0, 12)}...
                  </td>
                  <td
                    style={{
                      border: "1px solid #ddd",
                      padding: "10px",
                      textAlign: "center",
                      fontWeight: "bold",
                      color: "#2196F3",
                    }}
                  >
                    {contributor.percentage}%
                  </td>
                  <td
                    style={{
                      border: "1px solid #ddd",
                      padding: "10px",
                      textAlign: "right",
                      color: "#4CAF50",
                      fontWeight: "bold",
                    }}
                  >
                    {contributor.totalReward || 0}
                  </td>
                  <td
                    style={{
                      border: "1px solid #ddd",
                      padding: "10px",
                      fontSize: "12px",
                      color: "#666",
                    }}
                  >
                    {contributor.joinedAt
                      ? new Date(contributor.joinedAt).toLocaleDateString()
                      : "N/A"}
                  </td>
                  {isOwner && (
                    <td style={{ border: "1px solid #ddd", padding: "10px", textAlign: "center" }}>
                      {contributor.address?.toLowerCase() !== ownerAddress?.toLowerCase() && (
                        <button
                          onClick={() => removeContributor(contributor.address)}
                          style={{
                            background: "#ff6b6b",
                            color: "white",
                            border: "none",
                            padding: "5px 10px",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px",
                          }}
                          disabled={loading}
                        >
                          🗑️ Remove
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Contributor Section */}
      {isOwner && remainingPercentage > 0 && (
        <div
          style={{
            marginBottom: "20px",
            padding: "15px",
            backgroundColor: "#f9f9f9",
            border: "1px solid #e0e0e0",
            borderRadius: "4px",
          }}
        >
          <h4 style={{ marginTop: 0 }}>➕ Thêm Contributor Mới</h4>
          <p style={{ color: "#666", fontSize: "12px" }}>
            Phần trăm còn lại: <strong>{remainingPercentage}%</strong>
          </p>

          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              Wallet Address:
            </label>
            <input
              type="text"
              placeholder="0x..."
              value={newContributor}
              onChange={(e) => setNewContributor(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontFamily: "monospace",
                fontSize: "12px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              Royalty Percentage: {percentage}%
            </label>
            <input
              type="range"
              min="1"
              max={remainingPercentage}
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
              style={{ width: "100%" }}
            />
            <small style={{ color: "#666" }}>Nhập từ 1 đến {remainingPercentage}%</small>
          </div>

          <button
            onClick={addContributor}
            disabled={loading || percentage < 1}
            style={{
              padding: "10px 20px",
              background: "#2196F3",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
              fontWeight: "bold",
            }}
          >
            {loading ? "⏳ Đang thêm..." : "➕ Thêm Contributor"}
          </button>
        </div>
      )}

      {/* Messages */}
      {message && (
        <div
          style={{
            marginBottom: "15px",
            padding: "12px",
            backgroundColor: messageType === "error" ? "#ffebee" : "#e8f5e9",
            color: messageType === "error" ? "#c62828" : "#2e7d32",
            border: `1px solid ${messageType === "error" ? "#ef5350" : "#4caf50"}`,
            borderRadius: "4px",
          }}
        >
          {message}
        </div>
      )}

      {/* Usage History Button */}
      <div style={{ marginTop: "20px" }}>
        <button
          onClick={() => setShowUsageHistory(!showUsageHistory)}
          style={{
            padding: "8px 15px",
            background: "#FF9800",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          {showUsageHistory ? "▼ Ẩn Lịch Sử Sử Dụng" : "▶ Xem Lịch Sử Sử Dụng"}
        </button>
      </div>

      {/* Usage History */}
      {showUsageHistory && (
        <div style={{ marginTop: "15px" }}>
          <h4>📊 Lịch Sử Sử Dụng Dataset</h4>
          {usageHistory.length === 0 ? (
            <p style={{ color: "#666" }}>Chưa có lịch sử sử dụng</p>
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                border: "1px solid #ddd",
                backgroundColor: "white",
                fontSize: "12px",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#f5f5f5" }}>
                  <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>
                    Model Type
                  </th>
                  <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "center" }}>
                    Accuracy
                  </th>
                  <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "right" }}>
                    Reward Pool
                  </th>
                  <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {usageHistory.map((usage, idx) => (
                  <tr key={idx} style={{ borderTop: "1px solid #eee" }}>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                      {usage.modelType}
                    </td>
                    <td
                      style={{
                        border: "1px solid #ddd",
                        padding: "8px",
                        textAlign: "center",
                        color: "#4CAF50",
                        fontWeight: "bold",
                      }}
                    >
                      {(usage.accuracy / 100).toFixed(2)}%
                    </td>
                    <td
                      style={{
                        border: "1px solid #ddd",
                        padding: "8px",
                        textAlign: "right",
                        color: "#2196F3",
                        fontWeight: "bold",
                      }}
                    >
                      {usage.rewardPool}
                    </td>
                    <td style={{ border: "1px solid #ddd", padding: "8px", color: "#666" }}>
                      {new Date(usage.timestamp).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
