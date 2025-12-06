import { useState, useEffect } from "react";
import { BrowserProvider } from "ethers";

export default function ConnectWallet() {
  const [address, setAddress] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  // Hàm connect MetaMask
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert("MetaMask chưa được cài!");
        return;
      }

      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAddress(accounts[0]);
      setIsConnected(true);
    } catch (err) {
      console.error(err);
    }
  };

  // Tự cập nhật khi user đổi account trong MetaMask
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        setAddress(accounts[0] || "");
        setIsConnected(accounts.length > 0);
      });

      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
    }
  }, []);

  return (
    <div style={{ marginTop: "20px" }}>
      {!isConnected ? (
        <button
          onClick={connectWallet}
          style={{
            padding: "10px 20px",
            background: "#4b7bec",
            color: "white",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Connect MetaMask
        </button>
      ) : (
        <div style={{ fontSize: "18px" }}>
          <b>Connected:</b> {address}
        </div>
      )}
    </div>
  );
}
