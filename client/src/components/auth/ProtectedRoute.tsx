import React, { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Shield, LogIn } from 'lucide-react';

export interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, openAuthModal } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
        <p className="text-xs text-slate-400">Verifying session...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-lg mx-auto my-12 p-8 rounded-2xl bg-[#111827]/80 backdrop-blur-xl border border-white/10 text-center space-y-5 shadow-glass">
        <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto">
          <Shield className="w-7 h-7 text-cyan-400" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-white mb-1.5">Sign In Required</h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
            Please sign in to access your personal profile, saved items, and learning mastery history.
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
    );
  }

  return <>{children}</>;
};
