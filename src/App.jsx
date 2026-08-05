import React, { useState } from 'react';
import { LayoutDashboard, Users, Bell, Map, Menu, X } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Drivers from './pages/Drivers';
import Announcements from './pages/Announcements';
import LiveTracking from './pages/LiveTracking';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', id: 'dashboard', icon: LayoutDashboard },
    { name: 'Şoförler', id: 'drivers', icon: Users },
    { name: 'Canlı Takip', id: 'live-tracking', icon: Map },
    { name: 'Duyurular', id: 'announcements', icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex-shrink-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <h1 className="text-xl font-bold text-primary">ServisNoktam</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                  currentPage === item.id
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <div className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between px-4 py-2 relative">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg absolute left-4"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex-1 flex justify-center">
              <span className="text-lg font-bold text-primary">Admin Panel</span>
            </div>
            <div className="w-10 lg:hidden"></div>
          </div>
        </div>

        {/* Page content */}
        <div className="p-6">
          {currentPage === 'dashboard' && <Dashboard />}
          {currentPage === 'drivers' && <Drivers />}
          {currentPage === 'live-tracking' && <LiveTracking />}
          {currentPage === 'announcements' && <Announcements />}
        </div>
      </div>
    </div>
  );
}

export default App;
