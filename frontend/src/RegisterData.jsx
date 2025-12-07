import { useState, useEffect } from "react";
import { ethers } from "ethers";

import contractABI from "./contracts/DataRegistry.json";
import addresses from "./contracts/contract-address.json";

export default function RegisterData({ verifiedHash, uploadData }) {
  const [status, setStatus] = useState("");
  const [hashInput, setHashInput] = useState("");
  const [metadataInfo, setMetadataInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [privateKey, setPrivateKey] = useState("");
  const [showPrivateKeyInput, setShowPrivateKeyInput] = useState(false);

  // Tự động điền hash khi nhận được từ UploadFile
  useEffect(() => {
    if (verifiedHash) {
      setHashInput(verifiedHash);
    }
    if (uploadData) {
      setMetadataInfo(uploadData);
    }
  }, [verifiedHash, uploadData]);

  const registerDataOnBlockchain = async () => {
    try {
      setLoading(true);
      setStatus("🔍 Kiểm tra MetaMask...");
      
      if (!window.ethereum) {
        alert("MetaMask chưa được cài!");
        setLoading(false);
        return;
      }

      await window.ethereum.request({ method: "eth_requestAccounts" });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();
      
      // Debug: Hiển thị network + ví
      const network = await provider.getNetwork();
      console.log("Network:", network.name, "ChainID:", network.chainId);
      console.log("Signer Address:", signerAddress);
      console.log("Contract Address:", addresses.DataRegistry);
      
      setStatus(`🔗 Network: ${network.name} | Ví: ${signerAddress}`);

      const contract = new ethers.Contract(
        addresses.DataRegistry,
        contractABI.abi,
        signer
      );

      let hashBytes32 = hashInput;
      if (!hashInput.startsWith("0x")) {
        hashBytes32 = "0x" + hashInput;
      }

      console.log("Gửi hash:", hashBytes32);
      setStatus("⏳ Đang gửi transaction lên blockchain...");

      const tx = await contract.registerData(hashBytes32);
      console.log("Transaction hash:", tx.hash);

      setStatus(`⏳ Đang chờ xác nhận… (tx: ${tx.hash})`);

      const receipt = await tx.wait();
      console.log("Receipt:", receipt);

      setStatus(`✔ Thành công! Transaction hash: ${tx.hash}`);
      setLoading(false);
    } catch (err) {
      console.error("Chi tiết lỗi:", err);
      setStatus(`❌ Lỗi: ${err.message || err}`);
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: "30px", border: "1px solid #ddd", padding: "20px", borderRadius: "8px" }}>
      <h3>🔗 Đăng ký Dataset trên Blockchain</h3>

      {/* Display Upload Info */}
      {metadataInfo && (
        <div style={{ backgroundColor: "#f0f8ff", padding: "15px", borderRadius: "4px", marginBottom: "20px" }}>
          <h4>📊 Thông tin Dataset đã upload:</h4>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <tr style={{ borderBottom: "1px solid #ddd" }}>
                <td style={{ padding: "8px", fontWeight: "bold", width: "150px" }}>Tên:</td>
                <td style={{ padding: "8px" }}>{metadataInfo.metadata?.datasetName}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #ddd" }}>
                <td style={{ padding: "8px", fontWeight: "bold" }}>Loại dữ liệu:</td>
                <td style={{ padding: "8px" }}>{metadataInfo.metadata?.dataType}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #ddd" }}>
                <td style={{ padding: "8px", fontWeight: "bold" }}>Kích thước:</td>
                <td style={{ padding: "8px" }}>
                  {metadataInfo.fileSize ? (metadataInfo.fileSize / 1024).toFixed(2) : 0} KB
                </td>
              </tr>
              <tr style={{ borderBottom: "1px solid #ddd" }}>
                <td style={{ padding: "8px", fontWeight: "bold" }}>Giấy phép:</td>
                <td style={{ padding: "8px" }}>{metadataInfo.metadata?.license}</td>
              </tr>
              <tr>
                <td style={{ padding: "8px", fontWeight: "bold" }}>Hash:</td>
                <td style={{ padding: "8px", fontFamily: "monospace", fontSize: "12px" }}>
                  {metadataInfo.hash?.substring(0, 32)}...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Hash Input */}
      <div style={{ marginBottom: "15px" }}>
        <label><b>Hash SHA-256:</b></label>
        {hashInput ? (
          <p style={{ fontFamily: "monospace", backgroundColor: "#f5f5f5", padding: "10px", borderRadius: "4px" }}>
            {hashInput}
          </p>
        ) : (
          <input
            type="text"
            placeholder="Nhập hash SHA-256 (hex)"
            value={hashInput}
            onChange={(e) => setHashInput(e.target.value)}
            disabled={loading}
            style={{ width: "100%", padding: "8px", marginTop: "5px", boxSizing: "border-box" }}
          />
        )}
      </div>

      {/* Register Button */}
      <button
        onClick={registerDataOnBlockchain}
        disabled={!hashInput || loading}
        style={{
          padding: "10px 20px",
          backgroundColor: !hashInput || loading ? "#ccc" : "#2196F3",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: !hashInput || loading ? "not-allowed" : "pointer",
          fontSize: "14px",
          fontWeight: "bold",
        }}
      >
        {loading ? "Đang xử lý..." : "Đăng ký trên Blockchain"}
      </button>

      {/* Status Display */}
      <div style={{ marginTop: "20px", padding: "15px", backgroundColor: "#f9f9f9", borderRadius: "4px" }}>
        <p><b>Trạng thái:</b></p>
        <p style={{ color: status.includes("✔") ? "green" : status.includes("❌") ? "red" : "black" }}>
          {status || "-"}
        </p>
      </div>

      {/* Private Key Input for Backend Registration */}
      <div style={{ marginTop: "20px", padding: "15px", backgroundColor: "#fff3cd", borderRadius: "4px", border: "1px solid #ffc107" }}>
        <h4>🔐 Backend Registration (tùy chọn)</h4>
        <p style={{ fontSize: "12px", color: "#666" }}>
          Bước này sử dụng backend API để register metadata với đầy đủ thông tin trên smart contract.
        </p>
        
        {!showPrivateKeyInput ? (
          <button
            onClick={() => setShowPrivateKeyInput(true)}
            style={{
              padding: "8px 16px",
              backgroundColor: "#ff9800",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            Hiển thị Backend Option
          </button>
        ) : (
          <div>
            <input
              type="password"
              placeholder="Nhập private key"
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              disabled={loading}
              style={{ width: "100%", padding: "8px", marginTop: "5px", boxSizing: "border-box" }}
            />
            <small style={{ color: "red", display: "block", marginTop: "5px" }}>
              ⚠️ CẢNH BÁO: Không bao giờ chia sẻ private key của bạn!
            </small>
            <button
              onClick={() => setShowPrivateKeyInput(false)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#666",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
                marginTop: "10px",
              }}
            >
              Ẩn
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
