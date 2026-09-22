import React, { useState } from 'react';
import { Download, X, Smartphone, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isIOS, isInstalled, promptInstall, dismissInstall } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  if (isInstalled || (!isInstallable && !isIOS)) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
    } else {
      await promptInstall();
    }
  };

  return (
    <>
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-40 animate-fade-in">
        <div className="bg-slate-900/95 backdrop-blur-md border border-cyan-500/30 rounded-2xl p-4 shadow-2xl shadow-cyan-950/50 flex items-center justify-between gap-3 text-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold tracking-wide flex items-center gap-1.5">
                Install AKIRA
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  Fast & Offline
                </span>
              </h4>
              <p className="text-xs text-slate-400">
                Install for instant breaking push alerts and offline review.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>
            <button
              onClick={dismissInstall}
              aria-label="Dismiss install banner"
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Add to Home Screen Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 shadow-2xl text-slate-100 relative">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">Install on iOS Safari</h3>
                <p className="text-xs text-slate-400">Add AKIRA to your Home Screen</p>
              </div>
            </div>

            <ol className="space-y-3 text-xs text-slate-300 mb-6 list-decimal list-inside bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
              <li>Tap the <span className="font-semibold text-cyan-400">Share</span> icon in the Safari bottom bar.</li>
              <li>Scroll down and tap <span className="font-semibold text-cyan-400">"Add to Home Screen"</span>.</li>
              <li>Tap <span className="font-semibold text-cyan-400">Add</span> in the top-right corner.</li>
            </ol>

            <button
              onClick={() => {
                setShowIOSModal(false);
                dismissInstall();
              }}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium text-xs border border-slate-700 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
