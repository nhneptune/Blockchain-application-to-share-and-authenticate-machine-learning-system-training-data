import { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Layout from "./Layout";
import ConnectWallet from "./ConnectWallet";
import RegisterData from "./RegisterData";
import UploadFile from "./UploadFile";
import UpdateData from "./UpdateData";
import ContributionsTable from "./ContributionsTable";
import VersionsBrowser from "./VersionsBrowser";
import TrainModel from "./TrainModel";
import "./App.css";

// --- Trang Dashboard (Trang chủ) ---
function DashboardHome({ account, setAccount }) {
  return (
    <div>
      <h1 className="page-title">Dashboard Overview</h1>
      
      {/* Card chính để kết nối ví */}
      <div className="vitality-card card-blue">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '28px', color: 'white' }}>Blockchain ML Platform</h2>
            <p style={{ opacity: 0.9, marginTop: '10px', color: '#e6fffa' }}>
              Xác thực và chia sẻ dữ liệu huấn luyện AI phi tập trung.
            </p>
            <div style={{ marginTop: '20px' }}>
              {/* Truyền setAccount vào để cập nhật trạng thái ví */}
              {/* Sửa: Truyền walletAddress để hiển thị ví đã connect */}
              <ConnectWallet setWallet={setAccount} walletAddress={account} /> 
            </div>
          </div>
          <div style={{ fontSize: '80px', opacity: 0.3 }}>🔗</div>
        </div>
      </div>

      {/* Các widget thống kê nhỏ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        <div className="vitality-card">
          <h3>Trạng thái ví</h3>
          <p style={{ fontSize: '16px', fontWeight: 'bold', margin: '15px 0', color: account ? '#319795' : '#e53e3e' }}>
            {account ? "🟢 Đã kết nối" : "🔴 Chưa kết nối"}
          </p>
          <span style={{ fontSize: '12px', color: '#a0aec0' }}>
            {account ? `${account.substring(0, 15)}...` : "Vui lòng kết nối ví"}
          </span>
        </div>
        
        <div className="vitality-card">
          <h3>Hệ thống</h3>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#f6ad55', margin: '10px 0' }}>Sepolia</p>
          <span style={{ fontSize: '12px', color: 'green' }}>Testnet Active</span>
        </div>
      </div>
    </div>
  );
}

// --- App Chính ---
function App() {
  // 1. State quản lý ví (Dùng chung cho cả app)
  const [account, setAccount] = useState(null);

  // 2. State logic nghiệp vụ
  const [verifiedHash, setVerifiedHash] = useState("");
  const [uploadData, setUploadData] = useState(null);

  // Hook điều hướng trang
  const navigate = useNavigate();

  // Hàm xử lý khi Upload xong -> Tự động chuyển sang trang Register
  const handleUploadSuccess = (data) => {
    setUploadData(data);
    // Chuyển hướng sang trang register
    navigate("/register"); 
  };

  return (
    <Routes>
      {/* Layout bao bọc bên ngoài (Sidebar + Header) */}
      <Route path="/" element={<Layout account={account} handleLogout={() => setAccount(null)} />}>
        
        {/* TRANG 1: Dashboard (Mặc định) */}
        <Route index element={<DashboardHome account={account} setAccount={setAccount} />} />

        {/* TRANG 2: Upload File */}
        <Route path="upload" element={
          <div>
            <h2 className="page-title">📤 Upload Dataset</h2>
            <div className="vitality-card" style={{ maxWidth: '800px' }}>
              <p className="sub-text">Tải file lên IPFS/Server để lấy Hash xác thực.</p>
              
              <UploadFile
                onHashVerified={setVerifiedHash}
                onUploadComplete={handleUploadSuccess} // Sử dụng hàm mới để điều hướng
                walletAddress={account} // QUAN TRỌNG: Sửa 'wallet' thành 'walletAddress' cho khớp với file UploadFile.jsx
              />
            </div>
          </div>
        } />

        {/* TRANG 3: Update Data */}
        <Route path="update" element={
          <div>
            <h2 className="page-title">🔄 Update Data</h2>
            <UpdateData walletAddress={account} />
          </div>
        } />

        {/* TRANG 4: Register Metadata */}
        <Route path="register" element={
          <div>
            <h2 className="page-title">📝 Register Metadata</h2>
            <div className="vitality-card">
              <p className="sub-text">Ghi thông tin Dataset lên Blockchain.</p>
              
              {/* Kiểm tra xem đã có hash chưa để hiển thị cảnh báo */}
              {!verifiedHash ? (
                <div style={{ color: "#d69e2e", backgroundColor: "#fffaf0", padding: "10px", borderRadius: "5px" }}>
                  ⚠️ Vui lòng <b style={{cursor: "pointer", textDecoration:"underline"}} onClick={() => navigate("/upload")}>Upload File</b> trước để lấy Hash.
                </div>
              ) : (
                <RegisterData
                  verifiedHash={verifiedHash}
                  uploadData={uploadData}
                />
              )}
            </div>
          </div>
        } />

        {/* TRANG 5: Versions Browser */}
        <Route path="versions" element={
          <div>
            <h2 className="page-title">📜 Dataset versions</h2>
            <div className="vitality-card">
              <p className="sub-text">Xem tất cả version của các dataset.</p>
              <VersionsBrowser />
            </div>
          </div>
        } />

        {/* TRANG 6: History Table */}
        <Route path="history" element={
          <div>
            <ContributionsTable />
          </div>
        } />

        {/* TRANG 7: Train Model */}
        <Route path="train" element={
          <div>
            <TrainModel walletAddress={account} />
          </div>
        } />

      </Route>
    </Routes>
  );
}

// Lưu ý: App cần được bọc trong <BrowserRouter> ở file index.js hoặc main.jsx
export default App;