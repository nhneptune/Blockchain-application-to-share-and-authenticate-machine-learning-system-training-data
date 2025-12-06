import React from 'react';
    import { Link } from 'react-router-dom';

    const Dashboard: React.FC = () => {
      return (
        <div className="max-w-6xl mx-auto p-6 text-center">
          <h1 className="text-3xl font-bold text-slate-800 my-8">Bảng điều khiển AI phi tập trung</h1>
          <p className="text-slate-600 mb-4">
            Chào mừng! Hãy bắt đầu đóng góp dữ liệu hoặc xem tiến trình huấn luyện mô hình.
          </p>
          <Link to="/upload" className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition shadow-lg">
            Đóng góp Dữ liệu ngay!
          </Link>
          {/* Dashboard chính thức sẽ được nhét vào đây, ví dụ: list contributions, training log */}
        </div>
      );
    };

    export default Dashboard;