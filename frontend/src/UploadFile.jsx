import { useState } from "react";
import CryptoJS from "crypto-js";

export default function UploadFile({ onHashVerified, onUploadComplete }) {
  const [file, setFile] = useState(null);
  const [clientHash, setClientHash] = useState("");
  const [serverHash, setServerHash] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  // Metadata form fields
  const [metadata, setMetadata] = useState({
    datasetName: "",
    description: "",
    dataType: "images", // images, text, tabular, etc.
    ownerAddress: "",
    license: "CC0 (Public Domain)",
  });

  // Tính hash SHA-256 client-side
  const calculateHashClient = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const wordArray = CryptoJS.lib.WordArray.create(e.target.result);
        const hash = CryptoJS.SHA256(wordArray).toString();
        resolve(hash);
      };

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
    if (!file) {
      alert("Chưa chọn file");
      return;
    }

    if (!metadata.datasetName.trim()) {
      alert("Vui lòng nhập tên dataset");
      return;
    }

    if (!metadata.ownerAddress.trim()) {
      alert("Vui lòng nhập wallet address");
      return;
    }

    setLoading(true);

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

      if (!res.ok) {
        setResult(`❌ Lỗi: ${data.error}`);
        setLoading(false);
        return;
      }

      setServerHash(data.hash);
      setResult("✔ Upload thành công");

      // Gửi dữ liệu đã upload cho component cha
      if (onUploadComplete) {
        onUploadComplete({
          hash: data.hash,
          filename: data.filename,
          fileSize: data.fileSize,
          metadataId: data.metadataId,
          metadata: data.metadata,
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

  const dataTypes = [
    "images",
    "text",
    "tabular",
    "audio",
    "video",
    "mixed",
  ];

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
            style={{ width: "100%", padding: "8px", marginTop: "5px", boxSizing: "border-box" }}
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
            style={{ width: "100%", padding: "8px", marginTop: "5px", boxSizing: "border-box", minHeight: "60px" }}
          />
        </div>

        <div style={{ marginBottom: "12px" }}>
          <label><b>Loại dữ liệu:</b></label>
          <select
            name="dataType"
            value={metadata.dataType}
            onChange={handleMetadataChange}
            disabled={loading}
            style={{ width: "100%", padding: "8px", marginTop: "5px", boxSizing: "border-box" }}
          >
            {dataTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "12px" }}>
          <label><b>Wallet Address:</b></label>
          <input
            type="text"
            name="ownerAddress"
            value={metadata.ownerAddress}
            onChange={handleMetadataChange}
            placeholder="0x..."
            disabled={loading}
            style={{ width: "100%", padding: "8px", marginTop: "5px", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ marginBottom: "12px" }}>
          <label><b>Giấy phép sử dụng:</b></label>
          <select
            name="license"
            value={metadata.license}
            onChange={handleMetadataChange}
            disabled={loading}
            style={{ width: "100%", padding: "8px", marginTop: "5px", boxSizing: "border-box" }}
          >
            {licenses.map((license) => (
              <option key={license} value={license}>
                {license}
              </option>
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
        {loading ? "Đang upload..." : "Upload"}
      </button>

      {/* Results */}
      <div style={{ marginTop: "20px", padding: "15px", backgroundColor: "#f9f9f9", borderRadius: "4px" }}>
        <p><b>Client hash:</b> {clientHash ? clientHash.substring(0, 16) + "..." : "-"}</p>
        <p><b>Server hash:</b> {serverHash ? serverHash.substring(0, 16) + "..." : "-"}</p>
        <p><b>Trạng thái:</b> {result || "-"}</p>
      </div>
    </div>
  );
}

