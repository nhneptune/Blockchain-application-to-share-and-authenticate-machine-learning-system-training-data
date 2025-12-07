import { useState } from "react";
import ConnectWallet from "./ConnectWallet";
import RegisterData from "./RegisterData";
import UploadFile from "./UploadFile";
import ContributionsTable from "./ContributionsTable";
import "./App.css";

function App() {
  const [account, setAccount] = useState(null);
  const [contributions, setContributions] = useState([]);

  return (
    <div className="dashboard-container">
      {/* SIDEBAR TRÁI */}
      <aside className="sidebar">
        <div className="brand">
          <span>⚡</span> Vitality
        </div>
        
        <div className="menu">
          <div className="menu-item active">🏠 Dashboard</div>
          <div className="menu-item">⚡ Sport</div>
          <div className="menu-item">📅 Plan</div>
          <div className="menu-item">📊 Category</div>
          <div className="menu-item">🛍️ Store</div>
        </div>

        <div className="logout-btn">
           Log Out
        </div>
      </aside>

      {/* NỘI DUNG CHÍNH (PHẢI) */}
      <main className="main-content">
        {/* Header giả lập */}
        <header className="header">
          <div className="nav-links">
            <span>Popular</span>
            <span>Attention</span>
            <span>Topic</span>
          </div>
          <div className="search-bar">
            🔍 <input type="text" placeholder="Search dataset..." />
          </div>
        </header>

        <div className="dashboard-grid">
          {/* CỘT TRÁI CỦA NỘI DUNG */}
          <div className="grid-left">
            {/* 1. Wallet Card - Style giống Banner xanh trong ảnh */}
            <div className="card card-highlight">
              <h2>🚀 Web3 Registry</h2>
              <p>Connect wallet to start managing your decentralized data.</p>
              <div style={{ marginTop: '20px' }}>
                 <ConnectWallet setWallet={setAccount} />
              </div>
            </div>

            {/* 2. Upload File */}
            <div className="card">
              <h2>📤 Upload Dataset</h2>
              <p className="sub-text">Select file and upload to IPFS/Backend</p>
              <UploadFile wallet={account} />
            </div>

            {/* 3. Register Data */}
            <div className="card">
              <h2>📝 Register Metadata</h2>
              <p className="sub-text">Store dataset information on-chain</p>
              <RegisterData account={account} />
            </div>
          </div>

          {/* CỘT PHẢI CỦA NỘI DUNG (Nhỏ hơn) */}
          <div className="grid-right">
             <div className="card">
                <h2>👤 Status</h2>
                <div style={{marginTop: '15px', textAlign: 'center'}}>
                    {account ? (
                        <div style={{color: '#4fd1c5', fontWeight: 'bold'}}>Connected</div>
                    ) : (
                        <div style={{color: '#e53e3e'}}>Disconnected</div>
                    )}
                </div>
             </div>

             {/* Contributions Table */}
             <div className="card">
                <h2>📚 History</h2>
                <ContributionsTable contributions={contributions} />
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;