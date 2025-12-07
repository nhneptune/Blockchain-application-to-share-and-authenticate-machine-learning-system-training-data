import { useState } from "react";
import ConnectWallet from "./ConnectWallet";
import UploadFile from "./UploadFile";
import RegisterData from "./RegisterData";
import ContributionsTable from "./ContributionsTable";

function App() {
  const [verifiedHash, setVerifiedHash] = useState("");
  const [uploadData, setUploadData] = useState(null);

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "10px" }}>🔗 Blockchain ML Data Sharing Platform</h1>
      <p style={{ color: "#666", marginBottom: "30px" }}>
        Ứng dụng Blockchain để xác thực và chia sẻ dữ liệu huấn luyện mô hình AI giữa nhiều bên
      </p>

      <ConnectWallet />
      <UploadFile
        onHashVerified={setVerifiedHash}
        onUploadComplete={setUploadData}
      />
      <RegisterData
        verifiedHash={verifiedHash}
        uploadData={uploadData}
      />
      <ContributionsTable />
    </div>
  );
}

export default App;


