import { useState } from "react";
import { ethers } from "ethers";

import contractABI from "./contracts/DataRegistry.json";
import addresses from "./contracts/contract-address.json";

export default function RegisterData() {
  const [status, setStatus] = useState("");
  const [hashInput, setHashInput] = useState("");

  const registerData = async () => {
    try {
      setStatus("🔍 Kiểm tra MetaMask...");
      
      if (!window.ethereum) {
        alert("MetaMask chưa được cài!");
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
    } catch (err) {
      console.error("Chi tiết lỗi:", err);
      setStatus(`❌ Lỗi: ${err.message || err}`);
    }
  };

  return (
    <div>
      <h3>Đăng ký hash dataset lên Blockchain</h3>

      <input
        type="text"
        placeholder="Nhập hash SHA-256 (hex)"
        value={hashInput}
        onChange={(e) => setHashInput(e.target.value)}
      />

      <br /><br />
      <button onClick={registerData}>Đăng ký</button>

      <p>{status}</p>
    </div>
  );
}