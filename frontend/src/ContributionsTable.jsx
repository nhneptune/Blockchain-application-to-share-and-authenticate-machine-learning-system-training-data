import React, { useEffect, useState } from "react";

export default function ContributionsTable() {
  const [items, setItems] = useState([]);
  const [ownerFilter, setOwnerFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const fetchData = async (owner = "") => {
    setLoading(true);
    setError("");

    try {
      let url = "http://localhost:4000/contributions";
      if (owner) url += `?owner=${owner}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setItems([]);
      } else {
        setItems(data.items || []);
      }
    } catch (err) {
      console.error(err);
      setError("Không thể tải dữ liệu từ backend");
    }

    setLoading(false);
  };

  // Fetch ngay khi load trang
  useEffect(() => {
    fetchData();
  }, []);

  const handleFilter = () => {
    fetchData(ownerFilter.trim());
  };

  const toggleExpanded = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">📊 Danh sách Dataset Contributions</h2>

      {/* ----- Filter owner ----- */}
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="Lọc theo owner (0x...)"
          className="border px-2 py-1 w-80 rounded"
          value={ownerFilter}
          onChange={(e) => setOwnerFilter(e.target.value)}
        />
        <button
          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
          onClick={handleFilter}
        >
          Lọc
        </button>

        <button
          className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
          onClick={() => {
            setOwnerFilter("");
            fetchData();
          }}
        >
          Reset
        </button>
      </div>

      {/* ----- Loading + Error ----- */}
      {loading && <p>⏳ Đang tải dữ liệu...</p>}
      {error && <p className="text-red-600">❌ {error}</p>}

      {/* ----- Table ----- */}
      {!loading && !error && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #ddd" }}>
            <thead>
              <tr style={{ backgroundColor: "#f5f5f5" }}>
                <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left", cursor: "pointer", width: "40px" }}>
                  📌
                </th>
                <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>ID</th>
                <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>Owner</th>
                <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>Dataset Name</th>
                <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>Data Type</th>
                <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "20px", color: "#999" }}>
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <React.Fragment key={item.id}>
                    <tr style={{ borderTop: "1px solid #eee" }}>
                      <td style={{ border: "1px solid #ddd", padding: "12px", textAlign: "center" }}>
                        <button
                          onClick={() => toggleExpanded(item.id)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "16px",
                          }}
                        >
                          {expandedId === item.id ? "▼" : "▶"}
                        </button>
                      </td>
                      <td style={{ border: "1px solid #ddd", padding: "12px", fontWeight: "bold" }}>
                        #{item.id}
                      </td>
                      <td style={{ border: "1px solid #ddd", padding: "12px", fontFamily: "monospace", fontSize: "12px" }}>
                        {item.owner.substring(0, 10)}...
                      </td>
                      <td style={{ border: "1px solid #ddd", padding: "12px" }}>
                        {item.metadata?.datasetName || "—"}
                      </td>
                      <td style={{ border: "1px solid #ddd", padding: "12px" }}>
                        <span style={{ backgroundColor: "#e3f2fd", padding: "4px 8px", borderRadius: "4px", fontSize: "12px" }}>
                          {item.metadata?.dataType || "—"}
                        </span>
                      </td>
                      <td style={{ border: "1px solid #ddd", padding: "12px", fontSize: "12px" }}>
                        {new Date(item.timestamp * 1000).toLocaleString()}
                      </td>
                    </tr>

                    {/* Expanded Row - Metadata Details */}
                    {expandedId === item.id && item.metadata && (
                      <tr style={{ backgroundColor: "#f9f9f9" }}>
                        <td colSpan="6" style={{ border: "1px solid #ddd", padding: "15px" }}>
                          <div style={{ backgroundColor: "white", padding: "15px", borderRadius: "4px", border: "1px solid #e0e0e0" }}>
                            <h4 style={{ margin: "0 0 10px 0", color: "#333" }}>📋 Chi tiết Metadata</h4>
                            <table style={{ width: "100%", fontSize: "13px" }}>
                              <tbody>
                                <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                                  <td style={{ padding: "8px", fontWeight: "bold", width: "150px" }}>Tên Dataset:</td>
                                  <td style={{ padding: "8px" }}>{item.metadata.datasetName}</td>
                                </tr>
                                <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                                  <td style={{ padding: "8px", fontWeight: "bold" }}>Mô tả:</td>
                                  <td style={{ padding: "8px" }}>{item.metadata.description || "—"}</td>
                                </tr>
                                <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                                  <td style={{ padding: "8px", fontWeight: "bold" }}>Loại dữ liệu:</td>
                                  <td style={{ padding: "8px" }}>{item.metadata.dataType}</td>
                                </tr>
                                <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                                  <td style={{ padding: "8px", fontWeight: "bold" }}>Kích thước:</td>
                                  <td style={{ padding: "8px" }}>
                                    {(item.metadata.fileSize / 1024).toFixed(2)} KB
                                  </td>
                                </tr>
                                <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                                  <td style={{ padding: "8px", fontWeight: "bold" }}>Giấy phép:</td>
                                  <td style={{ padding: "8px" }}>{item.metadata.license}</td>
                                </tr>
                                <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                                  <td style={{ padding: "8px", fontWeight: "bold" }}>Upload lúc:</td>
                                  <td style={{ padding: "8px" }}>
                                    {new Date(item.metadata.uploadedAt).toLocaleString()}
                                  </td>
                                </tr>
                                <tr>
                                  <td style={{ padding: "8px", fontWeight: "bold", verticalAlign: "top" }}>Hash:</td>
                                  <td style={{ padding: "8px", fontFamily: "monospace", fontSize: "11px", wordBreak: "break-all" }}>
                                    {item.hash}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Expanded Row - No Metadata Warning */}
                    {expandedId === item.id && !item.metadata && (
                      <tr style={{ backgroundColor: "#fff3cd" }}>
                        <td colSpan="6" style={{ border: "1px solid #ddd", padding: "15px", textAlign: "center", color: "#856404" }}>
                          ⚠️ Không có metadata cho dataset này
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
