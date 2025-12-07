// Thay địa chỉ Contract của bạn vào đây
export const addresses = {
  DataRegistry: "0x1234567890123456789012345678901234567890" 
};

// Thay ABI từ file JSON artifact của bạn vào đây
export const contractABI = {
  abi: [
    // Ví dụ một hàm giả, bạn cần copy ABI thật vào đây
    {
      "inputs": [
        { "internalType": "bytes32", "name": "_hash", "type": "bytes32" },
        { "internalType": "string", "name": "_name", "type": "string" },
        { "internalType": "string", "name": "_description", "type": "string" },
        { "internalType": "string", "name": "_dataType", "type": "string" },
        { "internalType": "uint256", "name": "_fileSize", "type": "uint256" },
        { "internalType": "string", "name": "_license", "type": "string" }
      ],
      "name": "registerData",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]
};