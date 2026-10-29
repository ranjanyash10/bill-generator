import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Settings, LogOut, PlusCircle } from 'lucide-react';

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Document History', path: '/history', icon: FileText },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-company-bg">
      {/* Sidebar */}
      <aside className="w-64 bg-company-navy text-white flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-bold tracking-wider">TENVANTA</h1>
          <p className="text-xs text-gray-400 mt-1">TECHNOLOGIES PVT LTD</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-company-blue text-white' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
          
          <div className="pt-6 mt-6 border-t border-gray-700">
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Create New
            </p>
            <Link
              to="/create/receipt"
              className="flex items-center space-x-3 px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <PlusCircle size={18} />
              <span>Proforma Invoice</span>
            </Link>
            <Link
              to="/create/bill"
              className="flex items-center space-x-3 px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <PlusCircle size={18} />
              <span>Tax Invoice</span>
            </Link>
          </div>
        </nav>
        
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex flex-col">
              <span className="text-sm font-medium">{user.username || 'User'}</span>
              <span className="text-xs text-gray-400">{user.role || 'Employee'}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
