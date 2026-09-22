import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Bookmark, Menu, LogIn, LogOut, Shield, Bell, Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SearchBar } from '../common/SearchBar';
import { NotificationsModal } from '../common/NotificationsModal';
import { SystemHealthModal } from '../common/SystemHealthModal';
import { ThemeToggle } from '../ui/ThemeToggle';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isHealthOpen, setIsHealthOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const { user, openAuthModal, signOut } = useAuth();

  useEffect(() => {
    if (user) {
      const fetchUnread = async () => {
        try {
          const { notificationService } = await import('../../services/notificationService');
          const count = await notificationService.getUnreadCount();
          setUnreadCount(count);
        } catch (e) {
          // ignore
        }
      };

      fetchUnread();
      const interval = setInterval(fetchUnread, 60000); // 1 minute refresh
      return () => clearInterval(interval);
    } else {
      setUnreadCount(0);
    }
  }, [user]);

  const handleSearch = (query: string) => {
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-white/10 bg-white/90 dark:bg-[#0B0F17]/85 backdrop-blur-xl transition-colors">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Left: Brand & Mobile Menu Toggle */}
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={onToggleSidebar}
              className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white lg:hidden transition-colors"
              aria-label="Toggle navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white font-serif">
                    AKIRA
                  </span>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30 tracking-wider">
                    Assistant
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 -mt-1 hidden sm:inline font-medium">
                  Real-World Intelligence
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Global Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-6">
            <SearchBar onSearch={handleSearch} compact />
          </div>

          {/* Right: Quick actions, Theme Toggle, System Health, Notifications, Auth */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* System Health Diagnostics Trigger */}
            <button
              type="button"
              onClick={() => setIsHealthOpen(true)}
              className="p-2 rounded-xl text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 dark:text-slate-400 dark:hover:text-cyan-400 dark:hover:bg-slate-800/80 transition-colors"
              title="System Diagnostics & Reliability"
              aria-label="View system health"
            >
              <Activity className="h-4 w-4" />
            </button>

            {/* Theme Toggle (Bright / Dark / Default Option) */}
            <ThemeToggle />

            {/* Notifications Modal Trigger */}
            <button
              type="button"
              onClick={() => setIsNotificationsOpen(true)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/80 transition-colors relative"
              title="Notifications"
              aria-label="View notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-cyan-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-[#0B0F17]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* My Library Link */}
            <Link
              to="/library"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/80 transition-colors"
              title="My Library"
            >
              <Bookmark className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              <span>Library</span>
            </Link>

            {/* Auth State Button */}
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 hover:border-cyan-500 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-all text-xs font-medium"
                  title={user.email}
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                    {user.displayName.charAt(0)}
                  </div>
                  <span className="hidden md:inline max-w-[100px] truncate">{user.displayName}</span>
                  {user.role === 'admin' && (
                    <span title="Administrator">
                      <Shield className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
                    </span>
                  )}
                </Link>
                <button
                  onClick={() => signOut()}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 dark:hover:text-rose-400 rounded-lg transition-colors"
                  title="Sign Out"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={openAuthModal}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-cyan-500/20 transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>

        </div>
      </header>

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      {/* System Health Diagnostics Modal */}
      <SystemHealthModal
        isOpen={isHealthOpen}
        onClose={() => setIsHealthOpen(false)}
      />
    </>
  );
};

