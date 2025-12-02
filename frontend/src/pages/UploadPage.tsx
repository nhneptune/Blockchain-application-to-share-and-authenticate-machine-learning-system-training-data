import React from 'react';

    const UploadPage: React.FC = () => {
      return (
        <div className="max-w-2xl mx-auto p-6 mt-10 bg-white rounded-xl shadow-lg">
          <h1 className="text-2xl font-bold mb-4 text-blue-600">Form Đóng góp Dữ liệu</h1>
          <p className="text-slate-600 mb-6">
            Nơi bạn upload file và ký xác nhận hash lên Blockchain.
          </p>
          {/* Toàn bộ logic upload & Web3 sẽ nằm ở đây */}
          <div className="border-2 border-dashed border-slate-300 p-10 rounded-lg text-center h-48 flex items-center justify-center">
             <span className="text-slate-500">Chức năng upload chi tiết sẽ được phát triển tại đây.</span>
          </div>
        </div>
      );
    };

    export default UploadPage;