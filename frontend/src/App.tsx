import React from 'react';
// Imports bắt buộc để thiết lập định tuyến đa trang
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import các thành phần (Component và Page) bạn cần tạo trong cấu trúc mới
// Dòng này cần các file sau tồn tại: 
// 1. src/pages/Dashboard.tsx
// 2. src/pages/UploadPage.tsx
// 3. src/components/Navbar.tsx
import Dashboard from './pages/Dashboard';
import UploadPage from './pages/UploadPage';
import Navbar from './components/Navbar';

function App() {
  
  // App Component này chỉ còn chức năng định tuyến
  return (
    // Bọc toàn bộ ứng dụng trong Router để quản lý URL
    <Router>
      <div className="min-h-screen bg-slate-50">
        
        {/* Navbar: Thanh điều hướng chung, luôn hiện diện trên mọi trang */}
        <Navbar />
        
        {/* Routes: Định nghĩa danh sách các Component hiển thị theo từng đường dẫn */}
        <Routes>
          {/* Đường dẫn gốc: '/' */}
          <Route path="/" element={<Dashboard />} /> 
          
          {/* Đường dẫn đóng góp: '/upload' */}
          <Route path="/upload" element={<UploadPage />} />
          
        </Routes>
      </div>
    </Router>
  );
}

export default App;