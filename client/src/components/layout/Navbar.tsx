import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Sparkles, Bookmark, Menu, LogIn, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { user, openAuthModal, signOut } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#0B0F17]/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Left: Brand & Mobile toggle */}
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={onToggleSidebar}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
            aria-label="Toggle navigation"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                AKIRA <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">Intelligence</span>
              </span>
              <span className="text-[10px] text-slate-400 -mt-1 hidden sm:inline">Real-World Knowledge Engine</span>
            </div>
          </Link>
        </div>

        {/* Center: Search Bar */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-6">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events, concepts, monetary policy, AI..."
              className="w-full pl-10 pr-4 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/60 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
            />
          </div>
        </form>

        {/* Right: Quick actions, Auth & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/library"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
            title="Saved items"
          >
            <Bookmark className="h-4 w-4 text-cyan-400" />
            <span className="hidden sm:inline">Library</span>
          </Link>

          <Link
            to="/knowledge"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 transition-all text-xs font-semibold"
          >
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Mastery Loop</span>
          </Link>

          {/* Auth State Button */}
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-800/90 border border-slate-700 hover:border-cyan-500 text-slate-200 hover:text-white transition-all text-xs font-medium"
                title={user.email}
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                  {user.displayName.charAt(0)}
                </div>
                <span className="hidden md:inline max-w-[100px] truncate">{user.displayName}</span>
                {user.role === 'admin' && (
                  <span title="Administrator">
                    <Shield className="w-3 h-3 text-indigo-400" />
                  </span>
                )}
              </Link>
              <button
                onClick={() => signOut()}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={openAuthModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-cyan-500/20 transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
