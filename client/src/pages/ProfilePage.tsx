import React, { useState } from 'react';
import { 
  User, 
  Shield, 
  LogOut, 
  LogIn, 
  CheckCircle2, 
  Bookmark, 
  Sparkles, 
  Sliders,
  Palette,
  Sun,
  Moon,
  Laptop
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme, ThemeMode } from '../context/ThemeContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { RegionType } from '../types';

export const ProfilePage: React.FC = () => {
  const { user, openAuthModal, signOut, updateProfile } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [defaultRegion, setDefaultRegion] = useState<RegionType>('India');
  const [selectedTopics, setSelectedTopics] = useState<string[]>(['Economy', 'AI & Technology']);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const availableTopics = [
    'Economy',
    'AI & Technology',
    'Tamil Nadu',
    'India Policy',
    'Cybersecurity',
    'Science & Environment',
    'Space',
  ];

  const themeOptions: { id: ThemeMode; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'light', label: 'Bright / Light', icon: <Sun className="w-4 h-4 text-amber-500" />, desc: 'Crisp light surfaces' },
    { id: 'dark', label: 'Dark Mode', icon: <Moon className="w-4 h-4 text-cyan-400" />, desc: 'Deep neon glass' },
    { id: 'system', label: 'Default / System', icon: <Laptop className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />, desc: 'Follows OS preference' },
  ];

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user && displayName.trim()) {
      await updateProfile({ displayName: displayName.trim() });
      setIsEditing(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  if (!user) {
    return (
      <div className="space-y-6 animate-fadeIn max-w-2xl mx-auto py-12">
        <div className="p-8 rounded-3xl bg-white dark:bg-[#111827]/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 text-center space-y-5 shadow-sm dark:shadow-glass">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center mx-auto text-white shadow-md shadow-cyan-500/20">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Sign In to Your Knowledge Profile</h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
              Authenticate to personalize your news feed, sync concept mastery, and store bookmarks across devices.
            </p>
          </div>
          <Button
            onClick={openAuthModal}
            size="md"
            variant="primary"
            leftIcon={<LogIn className="w-4 h-4" />}
            className="mx-auto"
          >
            Sign In / Register
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mb-1">
            <User className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>Account & Identity</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Learner Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Manage your authenticated identity, regional affinities, and cognitive learning settings.
          </p>
        </div>

        <Button
          onClick={() => signOut()}
          size="sm"
          variant="danger"
          leftIcon={<LogOut className="w-3.5 h-3.5" />}
        >
          Sign Out
        </Button>
      </div>

      {savedSuccess && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-300 rounded-xl text-xs font-semibold animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Profile updated successfully.</span>
        </div>
      )}

      {/* 2. User Identity Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111827]/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-glass space-y-6">
        
        {/* User Info Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-md shadow-cyan-500/20">
              {user.displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user.displayName}</h2>
                {user.role === 'admin' ? (
                  <Badge variant="important" size="xs">Admin</Badge>
                ) : (
                  <Badge variant="info" size="xs">Verified Learner</Badge>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{user.email}</p>
              <p className="text-[11px] text-slate-500 mt-1">User ID: <code className="text-slate-700 dark:text-slate-400 font-mono">{user.id}</code></p>
            </div>
          </div>

          <Button
            onClick={() => {
              setDisplayName(user.displayName);
              setIsEditing(!isEditing);
            }}
            size="sm"
            variant="secondary"
          >
            {isEditing ? 'Cancel Edit' : 'Edit Name'}
          </Button>
        </div>

        {/* Inline Edit Display Name */}
        {isEditing && (
          <form onSubmit={handleSaveProfile} className="p-4 bg-slate-50 dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3 animate-fadeIn">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Update Display Name</h3>
            <div className="flex gap-2">
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                placeholder="Your preferred name"
                className="flex-1"
              />
              <Button type="submit" size="sm" variant="primary">
                Save
              </Button>
            </div>
          </form>
        )}

        {/* Account Status Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/5 space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <Bookmark className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Library Storage</span>
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">Private RLS</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Row-level security active</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/5 space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Mastery Progress</span>
            </div>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">Active Sync</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Evidence-based recall logs</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/5 space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <Shield className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Session Mode</span>
            </div>
            <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">Protected JWT</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Isolated per account</p>
          </div>
        </div>

        {/* Preferences Section (Section 13) */}
        <div className="space-y-6 pt-4 border-t border-slate-200 dark:border-white/10">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>Learner Preferences</span>
          </h3>

          {/* Theme Appearance Mode Option */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Color Theme & Appearance</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {themeOptions.map((opt) => {
                const isSelected = theme === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTheme(opt.id)}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-cyan-50 dark:bg-gradient-to-r dark:from-cyan-500/20 dark:to-blue-500/20 border-cyan-500 text-cyan-900 dark:text-white shadow-sm font-semibold'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900 dark:bg-slate-900/80 dark:text-slate-400 dark:border-white/5 dark:hover:border-white/20 dark:hover:text-slate-200'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0 mt-0.5">
                      {opt.icon}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">{opt.label}</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 font-normal">{opt.desc}</span>
                      {opt.id === 'system' && (
                        <span className="text-[10px] text-cyan-700 dark:text-cyan-400 font-mono block mt-1">
                          Current: {resolvedTheme}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Default Region Preference */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Default Geographic Region
            </label>
            <div className="flex flex-wrap gap-2">
              {(['ALL', 'Tamil Nadu', 'India', 'World'] as RegionType[]).map((region) => (
                <button
                  key={region}
                  type="button"
                  onClick={() => setDefaultRegion(region)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    defaultRegion === region
                      ? 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/40 shadow-sm'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900 dark:bg-slate-900 dark:text-slate-400 dark:border-white/5 dark:hover:text-white'
                  }`}
                >
                  {region === 'ALL' ? 'Global Combined' : region}
                </button>
              ))}
            </div>
          </div>

          {/* Topic Affinities */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Primary Knowledge Interests
            </label>
            <div className="flex flex-wrap gap-2">
              {availableTopics.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => toggleTopic(topic)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    selectedTopics.includes(topic)
                      ? 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/40 shadow-sm'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900 dark:bg-slate-900 dark:text-slate-400 dark:border-white/5 dark:hover:text-white'
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
