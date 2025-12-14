import { useState, useEffect } from "react";
import CryptoJS from "crypto-js";
import { ethers } from "ethers";
import { contractABI, addresses } from "./constants";

export default function UpdateData({ walletAddress }) {
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [userRole, setUserRole] = useState(null); // owner, editor, viewer, or null
  const [newFile, setNewFile] = useState(null);
  const [changelog, setChangelog] = useState("");
  const [clientHash, setClientHash] = useState("");
  const [serverHash, setServerHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [hashInput, setHashInput] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerStatus, setRegisterStatus] = useState("");

  // Fetch danh sách datasets từ backend
  useEffect(() => {
    if (walletAddress) {
      fetchDatasets();
    }
  }, [walletAddress]);

  // Fetch user role for selected dataset (từ collaborations API)
  useEffect(() => {
    if (selectedDataset) {
      fetchUserRole();
    }
  }, [selectedDataset]);

  const fetchDatasets = async () => {
    try {
      // 🔒 Chỉ lấy datasets mà user là owner hoặc editor
      const res = await fetch(
        `http://localhost:4000/collaborations/my-datasets/${walletAddress}`
      );
      const data = await res.json();

      if (data.success) {
        // Filter: Chỉ lấy datasets mà user có quyền edit (owner hoặc editor)
        const editableDatasets = data.datasets?.filter(
          (d) => d.userRole === "owner" || d.userRole === "editor"
        ) || [];
        setDatasets(editableDatasets);
      } else {
        setError("Không thể tải danh sách datasets");
        setDatasets([]);
      }
    } catch (err) {
      console.error("Error fetching datasets:", err);
      setError("Không thể tải danh sách datasets");
      setDatasets([]);
    }
  };

  const fetchUserRole = async () => {
    if (!selectedDataset || !walletAddress) {
      setUserRole(null);
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:4000/collaborations/my-datasets/${walletAddress}`
      );
      const data = await res.json();

      if (data.success) {
        const datasetData = data.datasets?.find(
          (d) => d.id === selectedDataset.id
        );
        if (datasetData) {
          setUserRole(datasetData.userRole);
        } else {
          setUserRole(null);
        }
      }
    } catch (err) {
      console.error("Error fetching user role:", err);
      setUserRole(null);
    }
  };

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

  const handleUpdate = async () => {
    if (!selectedDataset) {
      setError("Vui lòng chọn dataset để cập nhật");
      return;
    }

    // Check permissions: Only owner or editor can update
    if (userRole && !["owner", "editor"].includes(userRole)) {
      setError(
        `❌ Bạn không có quyền cập nhật dataset này. Vai trò của bạn: ${userRole}`
      );
      return;
    }

    if (!newFile) {
      setError("Vui lòng chọn file mới");
      return;
    }

    if (!changelog.trim()) {
      setError("Vui lòng nhập mô tả thay đổi");
      return;
    }

    setLoading(true);
    setError("");
    setResult("");
    setClientHash("");
    setServerHash("");

    try {
      const newHash = await calculateHashClient(newFile);
      setClientHash(newHash);

      const formData = new FormData();
      formData.append("file", newFile);
      formData.append("clientHash", newHash);
      formData.append("ownerAddress", walletAddress);
      formData.append("datasetName", selectedDataset.metadata.datasetName);
      formData.append("dataType", selectedDataset.metadata.dataType);
      formData.append("description", selectedDataset.metadata.description);
      formData.append("license", selectedDataset.metadata.license);
      formData.append("changelog", changelog);

      // Upload with datasetId query param to add version
      const res = await fetch(`http://localhost:4000/upload?datasetId=${selectedDataset.id}`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      setServerHash(data.hash);

      // Check if hash matches
      const hashMatch = data.hash === newHash;

      if (data.success && hashMatch) {
        setResult(`✔ Upload thành công!\n${data.dataset.currentVersion} được tạo`);
        setHashInput(data.hash);
        // Reset form
        setNewFile(null);
        setChangelog("");
      } else if (data.success && !hashMatch) {
        setResult(`❌ Hash không khớp`);
      } else {
        throw new Error("Upload failed: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Update error:", err);
      setError(`Lỗi: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const registerVersionOnBlockchain = async () => {
    try {
      setRegisterLoading(true);
      setRegisterStatus("🔍 Kiểm tra MetaMask...");
      
      if (!window.ethereum) {
        alert("MetaMask chưa được cài!");
        setRegisterLoading(false);
        return;
      }

      if (!selectedDataset) {
        setRegisterStatus("❌ Vui lòng chọn dataset");
        setRegisterLoading(false);
        return;
      }

      if (!hashInput) {
        setRegisterStatus("❌ Vui lòng upload file trước");
        setRegisterLoading(false);
        return;
      }

      await window.ethereum.request({ method: "eth_requestAccounts" });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();
      
      setRegisterStatus(`🔗 Ví: ${signerAddress}`);

      const contractWithSigner = new ethers.Contract(
        addresses.DataRegistry,
        contractABI.abi,
        signer
      );

      // Xử lý Hash
      let hashBytes32 = hashInput.trim();
      if (!hashBytes32.startsWith("0x")) {
        hashBytes32 = "0x" + hashBytes32;
      }

      setRegisterStatus("⏳ Đang gửi transaction lên blockchain...");

      const dsName = selectedDataset.datasetName || selectedDataset.metadata?.datasetName || "Unknown Dataset";
      const dsDesc = changelog || selectedDataset.metadata?.description || "Version update";
      const dsType = selectedDataset.metadata?.dataType || "mixed";
      const dsLicense = selectedDataset.metadata?.license || "CC0";

      // Gọi smart contract với blockchain ID của dataset
      const tx = await contractWithSigner.registerData(
        hashBytes32,
        dsName,
        dsDesc,
        dsType,
        selectedDataset.fileSize || 0,
        dsLicense
      );

      setRegisterStatus(`⏳ Đang chờ xác nhận… (tx: ${tx.hash})`);

      const receipt = await tx.wait();

      if (receipt.status === 1) {
        setRegisterStatus(`✔ Version registered on blockchain! Block: ${receipt.blockNumber}`);
        
        // 🔥 Ghi vào Contribution sau khi blockchain confirm
        if (selectedDataset) {
          try {
            setRegisterStatus(`📝 Đang ghi vào Contribution...`);
            const contributionRes = await fetch(
              "http://localhost:4000/contributions/register",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  datasetId: selectedDataset.id,
                  blockchainId: receipt.blockNumber,
                  type: "update", // 🔥 Phân biệt: update thay vì upload
                }),
              }
            );

            const contributionData = await contributionRes.json();
            if (contributionRes.ok) {
              setRegisterStatus(
                `✔ Hoàn tất! Version mới đã được ghi vào Contribution\nDatasetId: ${selectedDataset.id}\nBlock: ${receipt.blockNumber}`
              );
            } else {
              setRegisterStatus(
                `⚠️ Blockchain register OK nhưng lỗi ghi Contribution\n${contributionData.error}`
              );
            }
          } catch (err) {
            console.error("Error registering contribution:", err);
            setRegisterStatus(
              `⚠️ Blockchain register OK nhưng lỗi ghi Contribution\n${err.message}`
            );
          }
        }
      } else {
        setRegisterStatus(`❌ Transaction thất bại`);
      }
    } catch (err) {
      console.error("Register error:", err);
      setRegisterStatus(`❌ ${err.message}`);
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      {/* PHẦN 1: Chọn Dataset */}
      <div className="vitality-card" style={{ marginBottom: "25px" }}>
        <h3 style={{ marginTop: 0 }}>1️⃣ Chọn Dataset để Cập nhật</h3>
        
        {error && <p style={{ color: "red", padding: "10px", background: "#ffe0e0", borderRadius: "8px", marginBottom: "15px" }}>{error}</p>}

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>
            Dataset
          </label>
          <select
            value={selectedDataset ? selectedDataset.id : ""}
            onChange={(e) => {
              const dataset = datasets.find((d) => d.id === parseInt(e.target.value));
              setSelectedDataset(dataset);
              setNewFile(null);
              setChangelog("");
              setHashInput("");
              setResult("");
            }}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              fontSize: "14px",
            }}
          >
            <option value="">-- Chọn dataset --</option>
            {datasets.map((d) => (
              <option key={d.id} value={d.id}>
                {d.datasetName || d.metadata?.datasetName || `Dataset #${d.id}`}
              </option>
            ))}
          </select>
        </div>

        {/* Show Selected Dataset Info */}
        {selectedDataset && (
          <div
            style={{
              background: "#f0f4f8",
              padding: "12px",
              borderRadius: "8px",
              fontSize: "13px",
              lineHeight: "1.6",
            }}
          >
            <p style={{ margin: "5px 0" }}>
              <b>📊 Dataset:</b> {selectedDataset.datasetName || selectedDataset.metadata?.datasetName}
            </p>
            <p style={{ margin: "5px 0" }}>
              <b>📝 Loại:</b> {selectedDataset.dataType || selectedDataset.metadata?.dataType}
            </p>
            <p style={{ margin: "5px 0" }}>
              <b>📦 Kích thước:</b> {selectedDataset.fileSize ? (selectedDataset.fileSize / 1024).toFixed(2) : "N/A"} KB
            </p>
            <p style={{ margin: "5px 0" }}>
              <b>🔗 Hash hiện tại:</b> {selectedDataset.hash?.substring(0, 16)}...
            </p>
            <p style={{ margin: "5px 0" }}>
              <b>👤 Vai trò của bạn:</b>{" "}
              {userRole === "owner" ? (
                <span style={{ color: "#4b7bec", fontWeight: "bold" }}>👑 Owner</span>
              ) : userRole === "editor" ? (
                <span style={{ color: "#ff9800", fontWeight: "bold" }}>✏️ Editor</span>
              ) : userRole === "viewer" ? (
                <span style={{ color: "#999", fontWeight: "bold" }}>👁️ Viewer (Chỉ xem)</span>
              ) : (
                <span style={{ color: "#ccc" }}>Đang tải...</span>
              )}
            </p>
            {userRole === "viewer" && (
              <p style={{ margin: "10px 0 0 0", color: "#d32f2f", fontWeight: "bold" }}>
                ❌ Bạn không có quyền cập nhật dataset này
              </p>
            )}
          </div>
        )}
      </div>

      {/* PHẦN 2: Upload File & Hash */}
      {selectedDataset && (
        <div className="vitality-card" style={{ marginBottom: "25px" }}>
          <h3 style={{ marginTop: 0 }}>2️⃣ Upload File Mới & Hash</h3>

          {/* File Selection */}
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>
              Chọn File
            </label>
            <input
              type="file"
              onChange={(e) => setNewFile(e.target.files[0])}
              disabled={loading}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #ccc",
              }}
            />
            {newFile && <p style={{ color: "green", fontSize: "12px", marginTop: "5px" }}>✓ {newFile.name}</p>}
          </div>

          {/* Changelog (Mô tả) */}
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>
              Mô Tả Thay Đổi
            </label>
            <textarea
              value={changelog}
              onChange={(e) => setChangelog(e.target.value)}
              placeholder="Ví dụ: Sửa lỗi dữ liệu, thêm 50 mẫu mới..."
              disabled={loading}
              style={{
                width: "100%",
                minHeight: "80px",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                fontSize: "14px",
                fontFamily: "Arial",
              }}
            />
          </div>

          {/* Upload & Hash Button */}
          <button
            onClick={handleUpdate}
            disabled={loading || !newFile}
            style={{
              width: "100%",
              padding: "12px",
              background: loading ? "#ccc" : "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: loading ? "not-allowed" : "pointer",
              marginBottom: "15px",
            }}
          >
            {loading ? "Đang Upload & Tính Hash..." : "📤 Upload & Hash"}
          </button>

          {/* Hash Results */}
          <div style={{ padding: "12px", background: "#f9f9f9", borderRadius: "8px", fontSize: "13px", lineHeight: "1.6" }}>
            <p style={{ margin: "5px 0" }}>
              <b>Client Hash:</b> {clientHash ? clientHash.substring(0, 20) + "..." : "-"}
            </p>
            <p style={{ margin: "5px 0" }}>
              <b>Server Hash:</b> {serverHash ? serverHash.substring(0, 20) + "..." : "-"}
            </p>
            {result && (
              <p
                style={{
                  margin: "8px 0 0 0",
                  padding: "8px",
                  background: result.includes("✔") ? "#e0ffe0" : "#ffe0e0",
                  borderRadius: "6px",
                  color: result.includes("✔") ? "green" : "red",
                }}
              >
                {result}
              </p>
            )}
          </div>
        </div>
      )}

      {/* PHẦN 3: Register on Blockchain */}
      {selectedDataset && hashInput && (
        <div className="vitality-card">
          <h3 style={{ marginTop: 0 }}>3️⃣ Đăng Ký Version Lên Blockchain</h3>

          <button
            onClick={registerVersionOnBlockchain}
            disabled={registerLoading}
            style={{
              width: "100%",
              padding: "12px",
              background: registerLoading ? "#ccc" : "#4b7bec",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: registerLoading ? "not-allowed" : "pointer",
              marginBottom: "15px",
            }}
          >
            {registerLoading ? "Đang Đăng Ký..." : "🔗 Đăng Ký Blockchain"}
          </button>

          {registerStatus && (
            <p
              style={{
                padding: "10px",
                background: registerStatus.includes("✔") ? "#e0ffe0" : registerStatus.includes("❌") ? "#ffe0e0" : "#e3f2fd",
                borderRadius: "8px",
                color: registerStatus.includes("✔") ? "green" : registerStatus.includes("❌") ? "red" : "#1976d2",
                fontSize: "14px",
              }}
            >
              {registerStatus}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
