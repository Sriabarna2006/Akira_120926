import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';

export const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0B0F17] flex flex-col text-slate-100">
      <Navbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
      
      <div className="flex flex-1 relative">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        {/* Main Content Area - Responsive with mobile bottom padding */}
        <main className="flex-1 lg:pl-64 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-8 transition-all overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation for Phone and Tablet Touch Screens */}
      <MobileBottomNav />
    </div>
  );
};
