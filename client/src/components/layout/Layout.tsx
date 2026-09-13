import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';

export const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Dynamic route-level title updater & favicon cache-buster
  useEffect(() => {
    const path = location.pathname;
    let pageTitle = 'AKIRA — Real-World Intelligence & Learning Assistant';

    if (path === '/' || path === '/dashboard') {
      pageTitle = 'Dashboard | AKIRA — Real-World Intelligence';
    } else if (path === '/live') {
      pageTitle = 'Live & Trending Top 10 | AKIRA';
    } else if (path === '/daily-brief') {
      pageTitle = 'Daily Brief | AKIRA';
    } else if (path === '/explore') {
      pageTitle = 'Explore Knowledge Domains | AKIRA';
    } else if (path === '/learn') {
      pageTitle = 'Learn Concepts & Pathways | AKIRA';
    } else if (path === '/library') {
      pageTitle = 'My Library | AKIRA';
    } else if (path === '/knowledge') {
      pageTitle = 'My Knowledge Mastery | AKIRA';
    } else if (path === '/profile') {
      pageTitle = 'Learner Profile | AKIRA';
    } else if (path.startsWith('/event/')) {
      pageTitle = 'Event Intelligence Breakdown | AKIRA';
    } else if (path.startsWith('/category/')) {
      const categoryName = path.split('/')[2]?.replace(/-/g, ' ') || 'Category';
      pageTitle = `${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)} | AKIRA`;
    } else if (path === '/search') {
      pageTitle = 'Search Real-World Intelligence | AKIRA';
    } else if (path === '/all-news') {
      pageTitle = 'All News Stream | AKIRA';
    }

    document.title = pageTitle;

    // Ensure AKIRA favicon is active
    let favicon = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.type = 'image/svg+xml';
    favicon.href = '/favicon.svg';
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0B0F17] dark:text-slate-100 flex flex-col transition-colors">
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
