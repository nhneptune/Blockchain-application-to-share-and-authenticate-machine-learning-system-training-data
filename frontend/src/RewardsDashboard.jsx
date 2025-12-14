import { useState, useEffect } from "react";

export default function RewardsDashboard({ walletAddress }) {
  const [userRewards, setUserRewards] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

  useEffect(() => {
    if (walletAddress) {
      fetchUserRewards();
    }
  }, [walletAddress]);

  const fetchUserRewards = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BACKEND_URL}/royalty/user/${walletAddress}/total-rewards`);
      const data = await res.json();

      if (data.success) {
        setUserRewards(data);
      } else {
        setError(data.error || "Không thể tải dữ liệu");
      }
    } catch (err) {
      console.error("Error fetching rewards:", err);
      setError("Lỗi: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!walletAddress) {
    return (
      <div style={{ marginTop: "30px", padding: "20px", textAlign: "center" }}>
        <p style={{ color: "#666" }}>Vui lòng kết nối ví để xem rewards</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: "30px" }}>
      <h2 style={{ marginBottom: "20px" }}>💰 Dashboard Phần Thưởng</h2>

      {loading && <p>⏳ Đang tải dữ liệu...</p>}
      {error && <p style={{ color: "red" }}>❌ {error}</p>}

      {!loading && !error && userRewards && (
        <>
          {/* Summary Card */}
          <div
            style={{
              backgroundColor: "#4CAF50",
              color: "white",
              padding: "30px",
              borderRadius: "8px",
              marginBottom: "30px",
              textAlign: "center",
            }}
          >
            <h1 style={{ margin: "0 0 10px 0", fontSize: "48px" }}>
              {userRewards.totalRewardsEarned}
            </h1>
            <p style={{ margin: "0 0 5px 0", fontSize: "18px", opacity: 0.9 }}>
              Tổng Phần Thưởng
            </p>
            <p style={{ margin: "0", fontSize: "14px", opacity: 0.8 }}>
              Từ {userRewards.contributionCount} dataset
            </p>
          </div>

          {/* Contributions List */}
          {userRewards.contributionCount === 0 ? (
            <div
              style={{
                backgroundColor: "#fff3cd",
                padding: "20px",
                borderRadius: "4px",
                border: "1px solid #ffc107",
                textAlign: "center",
              }}
            >
              <p style={{ color: "#856404", margin: 0 }}>
                ℹ️ Bạn chưa là contributor của dataset nào.
              </p>
            </div>
          ) : (
            <div>
              <h3>📊 Chi Tiết Đóng Góp</h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                  gap: "15px",
                }}
              >
                {userRewards.contributions.map((contribution) => (
                  <div
                    key={contribution.datasetId}
                    style={{
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      padding: "15px",
                      backgroundColor: "#f9f9f9",
                    }}
                  >
                    <h4 style={{ margin: "0 0 10px 0", color: "#333" }}>
                      📁 {contribution.datasetName}
                    </h4>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "8px",
                        paddingBottom: "8px",
                        borderBottom: "1px solid #eee",
                      }}
                    >
                      <span style={{ color: "#666" }}>Dataset ID:</span>
                      <span style={{ fontWeight: "bold", color: "#2196F3" }}>
                        #{contribution.datasetId}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "8px",
                        paddingBottom: "8px",
                        borderBottom: "1px solid #eee",
                      }}
                    >
                      <span style={{ color: "#666" }}>Tỷ Lệ Đóng Góp:</span>
                      <span
                        style={{
                          fontWeight: "bold",
                          color: "#FF9800",
                          fontSize: "16px",
                        }}
                      >
                        {contribution.percentage}%
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "8px",
                        paddingBottom: "8px",
                        borderBottom: "1px solid #eee",
                      }}
                    >
                      <span style={{ color: "#666" }}>Phần Thưởng Nhận:</span>
                      <span
                        style={{
                          fontWeight: "bold",
                          color: "#4CAF50",
                          fontSize: "18px",
                        }}
                      >
                        {contribution.totalReward}
                      </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#666", fontSize: "12px" }}>Ngày Tham Gia:</span>
                      <span
                        style={{
                          color: "#999",
                          fontSize: "12px",
                        }}
                      >
                        {new Date(contribution.joinedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Statistics */}
          <div style={{ marginTop: "30px" }}>
            <h3>📈 Thống Kê</h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "15px",
              }}
            >
              <div
                style={{
                  backgroundColor: "#e3f2fd",
                  padding: "20px",
                  borderRadius: "8px",
                  textAlign: "center",
                }}
              >
                <h4 style={{ margin: "0 0 10px 0", color: "#1565c0" }}>
                  Tổng Dataset Đóng Góp
                </h4>
                <p
                  style={{
                    margin: 0,
                    fontSize: "32px",
                    fontWeight: "bold",
                    color: "#2196F3",
                  }}
                >
                  {userRewards.contributionCount}
                </p>
              </div>

              <div
                style={{
                  backgroundColor: "#f3e5f5",
                  padding: "20px",
                  borderRadius: "8px",
                  textAlign: "center",
                }}
              >
                <h4 style={{ margin: "0 0 10px 0", color: "#6a1b9a" }}>
                  Tỷ Lệ Đóng Góp Trung Bình
                </h4>
                <p
                  style={{
                    margin: 0,
                    fontSize: "32px",
                    fontWeight: "bold",
                    color: "#9c27b0",
                  }}
                >
                  {userRewards.contributionCount > 0
                    ? (
                        userRewards.contributions.reduce(
                          (sum, c) => sum + c.percentage,
                          0
                        ) / userRewards.contributionCount
                      ).toFixed(1)
                    : 0}
                  %
                </p>
              </div>

              <div
                style={{
                  backgroundColor: "#e8f5e9",
                  padding: "20px",
                  borderRadius: "8px",
                  textAlign: "center",
                }}
              >
                <h4 style={{ margin: "0 0 10px 0", color: "#1b5e20" }}>
                  Phần Thưởng Cao Nhất
                </h4>
                <p
                  style={{
                    margin: 0,
                    fontSize: "32px",
                    fontWeight: "bold",
                    color: "#4CAF50",
                  }}
                >
                  {userRewards.contributions.length > 0
                    ? Math.max(
                        ...userRewards.contributions.map((c) => c.totalReward)
                      )
                    : 0}
                </p>
              </div>
            </div>
          </div>

          {/* Refresh Button */}
          <div style={{ marginTop: "30px", textAlign: "center" }}>
            <button
              onClick={fetchUserRewards}
              style={{
                padding: "10px 20px",
                background: "#2196F3",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              🔄 Cập Nhật Dữ Liệu
            </button>
          </div>
        </>
      )}

      {!loading && !error && !userRewards && (
        <div
          style={{
            backgroundColor: "#f0f0f0",
            padding: "20px",
            borderRadius: "4px",
            textAlign: "center",
            color: "#666",
          }}
        >
          Không tìm thấy dữ liệu
        </div>
      )}
    </div>
  );
}
