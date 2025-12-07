import { useState, useEffect } from "react";
import { ethers } from "ethers";

export default function ConnectWallet({ setWallet, walletAddress }) {
  const [connected, setConnected] = useState(false);

  // Kiểm tra xem đã có ví được truyền vào từ cha chưa
  useEffect(() => {
    if (walletAddress) {
      setConnected(true);
    }
  }, [walletAddress]);

  async function connect() {
    if (!window.ethereum) return alert("Vui lòng cài đặt MetaMask!");

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setWallet(accounts[0]); // Cập nhật state ở App.js
      setConnected(true);
    } catch (error) {
      console.error("Lỗi kết nối ví:", error);
    }
  }

  // Hàm rút gọn địa chỉ ví: 0x1234...5678
  const formatAddress = (addr) => {
    return addr ? `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}` : "";
  };

  return (
    <button
      onClick={connect}
      style={{
        background: connected ? '#e6fffa' : 'white',
        color: '#319795',
        padding: '10px 20px',
        borderRadius: '12px',
        border: connected ? '1px solid #319795' : 'none',
        fontWeight: 'bold',
        cursor: 'pointer',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        display: "flex",
        alignItems: "center",
        gap: "8px"
      }}
    >
      {connected ? (
        <>
          <span>✅</span>
          <span>{formatAddress(walletAddress)}</span>
        </>
      ) : (
        "🔗 Connect Wallet"
      )}
    </button>
  );
}