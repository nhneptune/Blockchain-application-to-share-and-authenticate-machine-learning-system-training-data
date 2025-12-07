import { useState } from "react";

export default function UploadFile({ wallet }) {
  const [file, setFile] = useState(null);

  async function upload() {
    if (!wallet) return alert("Connect wallet first!");
    if (!file) return alert("Choose a file!");

    alert("File uploaded!");
  }

  return (
    <div className="upload-container">
      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
        style={{marginBottom: '15px'}}
      />

      <button
        onClick={upload}
        className="btn-primary" // Sử dụng class từ App.css
      >
        Upload Now
      </button>
    </div>
  );
}