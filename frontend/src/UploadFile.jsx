import { useState } from "react";
import CryptoJS from "crypto-js";

export default function UploadFile() {
  const [file, setFile] = useState(null);
  const [clientHash, setClientHash] = useState("");
  const [serverHash, setServerHash] = useState("");
  const [result, setResult] = useState("");

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

  const handleUpload = async () => {
    if (!file) {
      alert("Chưa chọn file");
      return;
    }

    // 1) Client tự tính hash
    const hash = await calculateHashClient(file);
    setClientHash(hash);

    // 2) Gửi file + hash sang server
    const formData = new FormData();
    formData.append("file", file);
    formData.append("clientHash", hash);

    const res = await fetch("http://localhost:4000/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setServerHash(data.serverHash);
    setResult(data.match ? "✔ Hash khớp" : "❌ Hash không khớp");
  };

  return (
    <div style={{ marginTop: "30px" }}>
      <h3>Upload Dataset</h3>

      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <br /><br />

      <button onClick={handleUpload}>Upload</button>

      <div>
        <p><b>Client hash:</b> {clientHash}</p>
        <p><b>Server hash:</b> {serverHash}</p>
        <p><b>Kết quả:</b> {result}</p>
      </div>
    </div>
  );
}
