import React, { useState } from 'react';
import { InvoiceEvaluation } from '../types';
import { formatCurrency } from '../utils/apEvaluator';
import { X, ShieldCheck, CheckCircle2, DollarSign, AlertTriangle, FileCheck, Trash2, Upload } from 'lucide-react';

interface MadamLimApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluation: InvoiceEvaluation | null;
  onConfirmApprove: (id: string, notes: string) => void;
  onConfirmMarkPaid: (id: string, notes: string) => void;
  onUploadReceipt?: (evaluation: InvoiceEvaluation) => void;
  onDelete?: (id: string) => void;
}

export const MadamLimApprovalModal: React.FC<MadamLimApprovalModalProps> = ({
  isOpen,
  onClose,
  evaluation,
  onConfirmApprove,
  onConfirmMarkPaid,
  onUploadReceipt,
  onDelete
}) => {
  const [approvalNotes, setApprovalNotes] = useState('');

  if (!isOpen || !evaluation) return null;

  const inv = evaluation.invoice;

  const isApproved = inv.paymentStatus === 'Approved';
  const isPaid = inv.paymentStatus === 'Paid';

  const handleApprove = () => {
    if (isApproved) return;
    onConfirmApprove(inv.id, approvalNotes.trim() || 'Approved by Madam Lim for GIRO/FAST disbursement.');
    onClose();
  };

  const handleMarkPaid = () => {
    if (onUploadReceipt) {
      onClose();
      onUploadReceipt(evaluation);
    } else {
      onConfirmMarkPaid(inv.id, approvalNotes.trim() || 'Payment completed and verified by Madam Lim.');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold">Madam Lim Payment Review & Authorization</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-amber-950">
              <FileCheck className="w-4 h-4 text-amber-600" />
              <span>Payment Protocol Verification</span>
            </div>
            <p>
              Under Boon Huat Hardware internal financial controls, Madam Lim must review invoice details prior to payment disbursement.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs text-slate-800">
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Supplier Name:</span>
              <strong className="text-slate-900 font-semibold">{inv.supplierName}</strong>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Invoice Number:</span>
              <span className="font-mono font-bold text-slate-900">{inv.invoiceNumber}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Amount Payable:</span>
              <span className="font-mono text-sm font-bold text-amber-700">{formatCurrency(inv.amountPayable)}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Due Date:</span>
              <span className="font-bold text-slate-900">{inv.dueDate || 'Missing'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">System Priority / Status:</span>
              <span className="font-bold text-slate-900">{evaluation.priority} Priority ({evaluation.statusCategory})</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Madam Lim's Review Notes / Payment Reference
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Verified with storekeeper. Approved for FAST bank transfer on 2026-08-02."
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            ></textarea>
          </div>

          <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-medium cursor-pointer"
            >
              Close
            </button>
            {isApproved ? (
              <button
                onClick={() => {
                  onClose();
                  onUploadReceipt?.(evaluation);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center space-x-1 cursor-pointer shadow-sm active:scale-95"
              >
                <Upload className="w-3.5 h-3.5 text-white" />
                <span>Upload Payment Receipt</span>
              </button>
            ) : (
              <button
                onClick={handleApprove}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs transition-all flex items-center space-x-1 cursor-pointer shadow-sm active:scale-95"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Approve Payment</span>
              </button>
            )}
            <button
              onClick={handleMarkPaid}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-all flex items-center space-x-1 cursor-pointer shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark as Paid</span>
            </button>
            {onDelete && (
              <button
                onClick={() => {
                  onDelete(inv.id);
                  onClose();
                }}
                className="px-3 py-2 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 border border-slate-300 hover:border-red-300 font-bold rounded-lg text-xs transition-all flex items-center space-x-1 cursor-pointer"
                title="Delete Invoice Record"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
