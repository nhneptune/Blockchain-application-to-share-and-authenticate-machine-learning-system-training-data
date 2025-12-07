import { useState } from "react";
import { ethers } from "ethers";

export default function ConnectWallet({ setWallet }) {
  const [connected, setConnected] = useState(false);

  async function connect() {
    if (!window.ethereum) return alert("Install MetaMask!");

    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    setWallet(accounts[0]);
    setConnected(true);
  }

  return (
    <button
      onClick={connect}
      style={{
        background: 'white',
        color: '#319795',
        padding: '10px 20px',
        borderRadius: '12px',
        border: 'none',
        fontWeight: 'bold',
        cursor: 'pointer',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}
    >
      {connected ? "✅ Wallet Connected" : "🔗 Connect Wallet"}
    </button>
  );
}