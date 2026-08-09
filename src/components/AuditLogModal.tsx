import React from 'react';
import { AuditLog } from '../types';
import { X, History, FileText, CheckCircle2, ShieldCheck } from 'lucide-react';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: AuditLog[];
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({
  isOpen,
  onClose,
  logs
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold">Madam Lim AP Audit Trail & Activity Log</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium">No actions logged yet in this session.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900">{log.supplierName}</span>
                      <span className="font-mono text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded text-[10px]">
                        {log.invoiceNumber}
                      </span>
                    </div>
                    <p className="text-slate-600">{log.notes}</p>
                    <div className="text-[10px] text-slate-400">
                      Logged by <strong>{log.performedBy}</strong> on {log.timestamp}
                    </div>
                  </div>

                  <span className={`px-2 py-1 rounded font-bold text-[10px] shrink-0 ${
                    log.action === 'Approved'
                      ? 'bg-blue-100 text-blue-800'
                      : log.action === 'Paid'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-800'
                  }`}>
                    {log.action}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
          >
            Close Audit Trail
          </button>
        </div>
      </div>
    </div>
  );
};
