import { useState, useEffect } from "react";
import { ethers } from "ethers";

// QUAN TRỌNG: Bạn cần tạo file constants.js chứa Contract ABI và Address
// import { contractABI, addresses } from "./constants"; 
// Hoặc định nghĩa tạm ở đây nếu chưa tách file (Khuyên dùng import file riêng)
import { contractABI, addresses } from "./constants"; // Giả định bạn đã có file này

export default function RegisterData({ verifiedHash, uploadData }) {
  const [status, setStatus] = useState("");
  const [hashInput, setHashInput] = useState("");
  const [metadataInfo, setMetadataInfo] = useState(null);
  const [loading, setLoading] = useState(false);

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
      const network = await provider.getNetwork();
      
      console.log(`Network: ${network.name} (${network.chainId})`);
      console.log("Signer:", signerAddress);
      
      setStatus(`🔗 Network: ${network.name} | Ví: ${signerAddress}`);

      // Create contract instances
      const contractWithSigner = new ethers.Contract(
        addresses.DataRegistry,
        contractABI.abi,
        signer
      );
      
      // For read-only calls like count()
      const contractWithProvider = new ethers.Contract(
        addresses.DataRegistry,
        contractABI.abi,
        provider
      );

      // Xử lý Hash để đảm bảo đúng định dạng bytes32 (thêm 0x nếu thiếu)
      let hashBytes32 = hashInput.trim();
      if (!hashBytes32.startsWith("0x")) {
        hashBytes32 = "0x" + hashBytes32;
      }

      console.log("Gửi transaction với hash:", hashBytes32);
      setStatus("⏳ Đang gửi transaction lên blockchain...");

      // Lấy dữ liệu an toàn (fallback nếu metadataInfo chưa có)
      const dsName = metadataInfo?.metadata?.datasetName || "Unknown Dataset";
      const dsDesc = metadataInfo?.metadata?.description || "No description";
      const dsType = metadataInfo?.metadata?.dataType || "mixed";
      const dsSize = metadataInfo?.fileSize || 0;
      const dsLicense = metadataInfo?.metadata?.license || "CC0";

      // Gọi smart contract
      const tx = await contractWithSigner.registerData(
        hashBytes32,
        dsName,
        dsDesc,
        dsType,
        dsSize,
        dsLicense
      );

      console.log("Transaction hash:", tx.hash);
      setStatus(`⏳ Đang chờ xác nhận… (tx: ${tx.hash})`);

      const receipt = await tx.wait();
      console.log("Receipt:", receipt);

      if (receipt.status === 1) {
        setStatus(`✔ Dataset registered on blockchain! Block: ${receipt.blockNumber}`);
        
        // Get dataId từ contract count (dataId = count - 1)
        let dataId = null;
        try {
          const count = await contractWithProvider.count();
          dataId = Number(count) - 1;
          console.log("✅ Dataset count:", count, "=> dataId:", dataId);
        } catch (countErr) {
          console.error("❌ Error getting count:", countErr.message);
          try {
            const iface = new ethers.Interface(contractABI.abi);
            for (const log of receipt.logs || []) {
              try {
                const parsed = iface.parseLog(log);
                if (parsed && parsed.name === "DataRegistered") {
                  dataId = Number(parsed.args[0]);
                  console.log("✅ Extracted dataId from event:", dataId);
                  break;
                }
              } catch (e) {
                // Continue
              }
            }
          } catch (parseErr) {
            console.error("❌ Error parsing logs:", parseErr.message);
          }
        }
      } else {
        setStatus(`❌ Transaction failed.`);
      }

      setLoading(false);
    } catch (err) {
      // Xử lý trường hợp người dùng từ chối
      if (err.code === "ACTION_REJECTED" || err.message?.includes("User rejected")) {
        setStatus("⚠️ Đã hủy giao dịch.");
      } else {
        console.error("Chi tiết lỗi:", err);
        setStatus(`❌ Lỗi: ${err.message || err}`);
      }
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: "30px", border: "1px solid #ddd", padding: "20px", borderRadius: "8px" }}>
      <h3>🔗 Đăng ký Dataset trên Blockchain</h3>

      {/* Display Upload Info */}
      {metadataInfo && (
        <div style={{ backgroundColor: "#f0f8ff", padding: "15px", borderRadius: "4px", marginBottom: "20px" }}>
          <h4>📊 Thông tin chuẩn bị ghi lên Chain:</h4>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <tbody>
              <tr><td style={{fontWeight: "bold", width: "120px"}}>Tên:</td><td>{metadataInfo.metadata?.datasetName}</td></tr>
              <tr><td style={{fontWeight: "bold"}}>Loại:</td><td>{metadataInfo.metadata?.dataType}</td></tr>
              <tr><td style={{fontWeight: "bold"}}>Kích thước:</td><td>{metadataInfo.fileSize ? (metadataInfo.fileSize / 1024).toFixed(2) : 0} KB</td></tr>
              <tr><td style={{fontWeight: "bold"}}>Giấy phép:</td><td>{metadataInfo.metadata?.license}</td></tr>
              <tr><td style={{fontWeight: "bold"}}>Hash:</td><td style={{ fontFamily: "monospace", fontSize: "12px" }}>{metadataInfo.hash?.substring(0, 32)}...</td></tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Hash Input */}
      <div style={{ marginBottom: "15px" }}>
        <label><b>Hash SHA-256 (Bytes32):</b></label>
        <input
          type="text"
          placeholder="Nhập hash SHA-256 (hex)"
          value={hashInput}
          onChange={(e) => setHashInput(e.target.value)}
          disabled={loading}
          style={{ width: "100%", padding: "8px", marginTop: "5px", fontFamily: "monospace" }}
        />
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
        {loading ? "⏳ Đang xử lý..." : "📝 Đăng ký Smart Contract"}
      </button>

      {/* Status Display */}
      <div style={{ marginTop: "20px", padding: "15px", backgroundColor: "#f9f9f9", borderRadius: "4px" }}>
        <p><b>Trạng thái:</b></p>
        <p style={{ 
          color: status.includes("✔") ? "green" : status.includes("❌") ? "red" : status.includes("⏳") ? "orange" : "black",
          fontWeight: "500"
        }}>
          {status || "Sẵn sàng"}
        </p>
      </div>
    </div>
  );
}