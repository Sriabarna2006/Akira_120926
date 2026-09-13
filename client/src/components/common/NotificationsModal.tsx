import React from 'react';
import { Bell, CheckCheck, Sparkles } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-lg">
          <Bell className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          <span>Intelligence Notifications</span>
        </div>
      }
      description="Real-time alerts, daily brief releases, and concept mastery reminders."
      size="sm"
    >
      <div className="space-y-4 pt-2">
        {/* Placeholder state adhering to Phase 2 guidelines: "You're all caught up." */}
        <div className="flex flex-col items-center justify-center text-center py-8 px-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 space-y-3">
          <div className="w-12 h-12 rounded-full bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 flex items-center justify-center">
            <CheckCheck className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">You're all caught up.</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed max-w-xs">
              No new alerts right now. When major developing stories or scheduled briefs arrive, they will appear here.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            <span>AI Curation Pipeline: Active</span>
          </span>
          <Button variant="ghost" size="xs" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
