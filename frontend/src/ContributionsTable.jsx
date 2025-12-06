import { useEffect, useState } from "react";

export default function ContributionsTable() {
  const [items, setItems] = useState([]);
  const [ownerFilter, setOwnerFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Danh sách Dataset Contributions</h2>

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
          className="bg-blue-500 text-white px-3 py-1 rounded"
          onClick={handleFilter}
        >
          Lọc
        </button>

        <button
          className="bg-gray-500 text-white px-3 py-1 rounded"
          onClick={() => {
            setOwnerFilter("");
            fetchData();
          }}
        >
          Reset
        </button>
      </div>

      {/* ----- Loading + Error ----- */}
      {loading && <p>Đang tải dữ liệu...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {/* ----- Table ----- */}
      {!loading && !error && (
        <table className="w-full border border-gray-300 text-left">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">ID</th>
              <th className="border p-2">Owner</th>
              <th className="border p-2">Hash (SHA-256)</th>
              <th className="border p-2">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center p-3">
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  <td className="border p-2">{item.id}</td>
                  <td className="border p-2 font-mono">{item.owner}</td>
                  <td className="border p-2 font-mono break-all">
                    {item.hash}
                  </td>
                  <td className="border p-2">
                    {new Date(item.timestamp * 1000).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
