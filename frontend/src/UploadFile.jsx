import { useState, useEffect } from "react";
// QUAN TRỌNG: Cần cài đặt thư viện này: npm install crypto-js
import CryptoJS from "crypto-js"; 

export default function UploadFile({ onHashVerified, onUploadComplete, walletAddress }) {
  const [file, setFile] = useState(null);
  const [clientHash, setClientHash] = useState("");
  const [serverHash, setServerHash] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  // Metadata form fields
  const [metadata, setMetadata] = useState({
    datasetName: "",
    description: "",
    dataType: "images",
    ownerAddress: "", // Sẽ tự động điền từ props
    license: "CC0 (Public Domain)",
  });

  // Tự động điền wallet address nếu người dùng đã kết nối ví
  useEffect(() => {
    if (walletAddress) {
      setMetadata((prev) => ({ ...prev, ownerAddress: walletAddress }));
    }
  }, [walletAddress]);

  // Tính hash SHA-256 client-side
  const calculateHashClient = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const wordArray = CryptoJS.lib.WordArray.create(e.target.result);
          const hash = CryptoJS.SHA256(wordArray).toString();
          resolve(hash);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  };

  const handleMetadataChange = (e) => {
    const { name, value } = e.target;
    setMetadata((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpload = async () => {
    if (!file) return alert("Chưa chọn file");
    if (!metadata.datasetName.trim()) return alert("Vui lòng nhập tên dataset");
    if (!metadata.ownerAddress.trim()) return alert("Vui lòng nhập wallet address");

    setLoading(true);
    setResult("");

    try {
      // 1) Client tự tính hash
      const hash = await calculateHashClient(file);
      setClientHash(hash);

      // 2) Gửi file + metadata + hash sang server
      const formData = new FormData();
      formData.append("file", file);
      formData.append("clientHash", hash);
      formData.append("datasetName", metadata.datasetName);
      formData.append("description", metadata.description);
      formData.append("dataType", metadata.dataType);
      formData.append("ownerAddress", metadata.ownerAddress);
      formData.append("license", metadata.license);

      const res = await fetch("http://localhost:4000/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Upload thất bại");

      setServerHash(data.hash);
      setResult("✔ Upload thành công");

      // Gửi dữ liệu đã upload cho component cha
      if (onUploadComplete) {
        onUploadComplete({
          hash: data.hash,
          filename: data.filename,
          fileSize: data.fileSize,
          datasetId: data.datasetId, // 🔥 Thêm datasetId để sử dụng khi register blockchain
          metadata: { ...metadata }, // Dùng metadata hiện tại để đảm bảo tính nhất quán
        });
      }

      if (onHashVerified) {
        onHashVerified(data.hash);
      }
    } catch (err) {
      setResult(`❌ Lỗi: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const dataTypes = ["images", "text", "tabular", "audio", "video", "mixed"];
  const licenses = [
    "CC0 (Public Domain)",
    "CC-BY (Attribution)",
    "CC-BY-SA (Attribution-ShareAlike)",
    "CC-BY-NC (Attribution-NonCommercial)",
    "Proprietary",
  ];

  return (
    <div style={{ marginTop: "30px", border: "1px solid #ddd", padding: "20px", borderRadius: "8px" }}>
      <h3>📤 Upload Dataset</h3>

      {/* File Selection */}
      <div style={{ marginBottom: "15px" }}>
        <label><b>Chọn file:</b></label>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          disabled={loading}
          style={{ display: "block", marginTop: "5px" }}
        />
        {file && <p style={{ color: "green", fontSize: "12px" }}>✓ {file.name}</p>}
      </div>

      {/* Metadata Form */}
      <fieldset style={{ padding: "15px", marginBottom: "15px", border: "1px solid #eee" }}>
        <legend><b>📋 Thông tin Dataset</b></legend>

        <div style={{ marginBottom: "12px" }}>
          <label><b>Tên Dataset:</b></label>
          <input
            type="text"
            name="datasetName"
            value={metadata.datasetName}
            onChange={handleMetadataChange}
            placeholder="VD: Cat vs Dog Images"
            disabled={loading}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
        </div>

        <div style={{ marginBottom: "12px" }}>
          <label><b>Mô tả:</b></label>
          <textarea
            name="description"
            value={metadata.description}
            onChange={handleMetadataChange}
            placeholder="Mô tả chi tiết về dataset..."
            disabled={loading}
            style={{ width: "100%", padding: "8px", marginTop: "5px", minHeight: "60px" }}
          />
        </div>

        <div style={{ marginBottom: "12px" }}>
          <label><b>Loại dữ liệu:</b></label>
          <select
            name="dataType"
            value={metadata.dataType}
            onChange={handleMetadataChange}
            disabled={loading}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          >
            {dataTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "12px" }}>
          <label><b>Wallet Address (Owner):</b></label>
          <input
            type="text"
            name="ownerAddress"
            value={metadata.ownerAddress}
            onChange={handleMetadataChange}
            placeholder="0x..."
            // Nếu đã kết nối ví thì có thể disable để tránh sửa sai, hoặc để enable tùy logic của bạn
            disabled={loading} 
            style={{ width: "100%", padding: "8px", marginTop: "5px", backgroundColor: walletAddress ? "#f0f0f0" : "white" }}
          />
        </div>

        <div style={{ marginBottom: "12px" }}>
          <label><b>Giấy phép sử dụng:</b></label>
          <select
            name="license"
            value={metadata.license}
            onChange={handleMetadataChange}
            disabled={loading}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          >
            {licenses.map((license) => (
              <option key={license} value={license}>{license}</option>
            ))}
          </select>
        </div>
      </fieldset>

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={loading}
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
        {loading ? "Đang upload..." : "Upload & Hash"}
      </button>

      {/* Results */}
      <div style={{ marginTop: "20px", padding: "15px", backgroundColor: "#f9f9f9", borderRadius: "4px" }}>
        <p><b>Client hash:</b> {clientHash ? clientHash.substring(0, 20) + "..." : "-"}</p>
        <p><b>Server hash:</b> {serverHash ? serverHash.substring(0, 20) + "..." : "-"}</p>
        <p><b>Trạng thái:</b> {result || "-"}</p>
      </div>
    </div>
  );
}