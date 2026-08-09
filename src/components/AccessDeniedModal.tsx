import React from 'react';
import { ShieldAlert, Lock, X } from 'lucide-react';
import { User } from '../types';

interface AccessDeniedModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
}

export const AccessDeniedModal: React.FC<AccessDeniedModalProps> = ({
  isOpen,
  onClose,
  currentUser
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-red-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-red-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-red-100" />
            <h3 className="text-sm font-bold tracking-tight">Security Access Control</h3>
          </div>
          <button
            onClick={onClose}
            className="text-red-100 hover:text-white p-1 rounded-lg transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-center">
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto border border-red-100">
            <Lock className="w-7 h-7 text-red-600" />
          </div>

          <div className="space-y-2">
            <h4 className="text-base font-extrabold text-slate-900">
              Authorization Required
            </h4>
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-left">
              <p className="text-xs text-red-800 font-bold leading-relaxed">
                Access Denied. Only Madam Lim (Finance Director) is authorised to approve supplier payments and update payment status.
              </p>
            </div>
          </div>

          {currentUser && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-left text-xs text-slate-600 space-y-1">
              <p>
                <strong>Current User:</strong> {currentUser.name} ({currentUser.username})
              </p>
              <p>
                <strong>Assigned Role:</strong> <span className="text-blue-700 font-bold">{currentUser.role}</span>
              </p>
              <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                You can view recommendations and generate payment reminders, but approval rights are restricted to the Finance Director.
              </p>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
            >
              Acknowledge & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
