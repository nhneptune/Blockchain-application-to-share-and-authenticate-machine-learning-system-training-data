import React from 'react';
    import { Link } from 'react-router-dom';
    import { Database, Wallet } from 'lucide-react';

    const Navbar: React.FC = () => {
      // Giả lập trạng thái ví để component không bị lỗi
      const address = "0x71C...9A23"; 

      const connectWallet = () => {
        alert("Thực hiện kết nối ví...");
      };

      return (
        <nav className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-50">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl hover:text-blue-400 transition">
              <Database className="text-blue-400" />
              <span>DecentraAI</span>
            </Link>
            <button 
              onClick={connectWallet}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
                address ? 'bg-green-600/20 text-green-400 border border-green-600' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Wallet size={18} />
              {address ? `${address.substring(0, 6)}...` : "Connect Wallet"}
            </button>
          </div>
        </nav>
      );
    };

    export default Navbar;