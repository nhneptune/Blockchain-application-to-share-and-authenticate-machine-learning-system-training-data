// file: src/Layout.jsx

import { Outlet, NavLink } from "react-router-dom";



export default function Layout({ account, handleLogout }) {

  return (

    <div className="dashboard-container">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-logo">⚡</div>

          <h2>DataChain Hub</h2>

        </div>



        <nav className="menu">

          <p className="menu-title">Main Menu</p>
         
          <NavLink to="/" className={({ isActive }) => (isActive ? "menu-item active" : "menu-item")}>

            <span>🏠</span> Dashboard

          </NavLink>

          <NavLink to="/upload" className={({ isActive }) => (isActive ? "menu-item active" : "menu-item")}>

            <span>📤</span> Upload Data

          </NavLink>

          <NavLink to="/update" className={({ isActive }) => (isActive ? "menu-item active" : "menu-item")}>

            <span>🔄</span> Update Data

          </NavLink>

          <NavLink to="/my-datasets" className={({ isActive }) => (isActive ? "menu-item active" : "menu-item")}>

            <span>📚</span> My Datasets

          </NavLink>

          <NavLink to="/versions" className={({ isActive }) => (isActive ? "menu-item active" : "menu-item")}>

            <span>📜</span> Versions

          </NavLink>

          <NavLink to="/history" className={({ isActive }) => (isActive ? "menu-item active" : "menu-item")}>

            <span>📚</span> History

          </NavLink>

          <NavLink to="/train" className={({ isActive }) => (isActive ? "menu-item active" : "menu-item")}>

            <span>🤖</span> Train Model

          </NavLink>

          <NavLink to="/rewards" className={({ isActive }) => (isActive ? "menu-item active" : "menu-item")}>

            <span>💰</span> Dashboard Phần Thưởng

          </NavLink>

        </nav>



        <div className="logout-section">

          <button className="logout-btn" onClick={handleLogout}>

             Go Out

          </button>

        </div>

      </aside>



      {/* MAIN CONTENT AREA */}

      <main className="main-wrapper">

        <header className="top-header">

          <div className="header-tabs">

            <span>Overview</span>

            <span>Analytics</span>

            <span>Reports</span>

          </div>

         

          <div className="header-right">

            <div className="search-box">

              🔍 <input type="text" placeholder="Search..." />

            </div>

            <div className="user-profile">

              <div className="notification-dot">🔔</div>

              <div className="avatar">

                {account ? "🟢" : "⚪"}

              </div>

            </div>

          </div>

        </header>



        <div className="content-area">

          {/* Nội dung các trang sẽ thay đổi ở đây */}

          <Outlet />

        </div>

      </main>

    </div>

  );

}