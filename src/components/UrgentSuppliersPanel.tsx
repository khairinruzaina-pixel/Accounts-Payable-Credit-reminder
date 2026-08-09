import React from 'react';
import { InvoiceEvaluation, PriorityLevel } from '../types';
import { formatCurrency } from '../utils/apEvaluator';
import { AlertTriangle, Clock, ShieldAlert, FileCheck, CheckCircle2, Eye, Sparkles, Trash2 } from 'lucide-react';

interface UrgentSuppliersPanelProps {
  evaluations: InvoiceEvaluation[];
  onApprove: (evaluation: InvoiceEvaluation) => void;
  onReview: (evaluation: InvoiceEvaluation) => void;
  onMarkPaid: (id: string) => void;
  onDelete?: (id: string) => void;
  isFinanceDirector?: boolean;
}

export const UrgentSuppliersPanel: React.FC<UrgentSuppliersPanelProps> = ({
  evaluations,
  onApprove,
  onReview,
  onMarkPaid,
  onDelete,
  isFinanceDirector = true
}) => {
  // Unpaid invoices only
  const unpaid = evaluations.filter((e) => e.invoice.paymentStatus !== 'Paid');

  // Priority order mapping
  const priorityOrder: Record<PriorityLevel, number> = {
    High: 1,
    Medium: 2,
    Low: 3,
    'No Action': 4
  };

  // Sort by urgency: Overdue first (most days overdue), then Due Today, then Due in 3 days, then by amount
  const sorted = [...unpaid].sort((a, b) => {
    const pA = priorityOrder[a.priority];
    const pB = priorityOrder[b.priority];
    if (pA !== pB) return pA - pB;

    const daysA = a.daysRemaining ?? 999;
    const daysB = b.daysRemaining ?? 999;
    if (daysA !== daysB) return daysA - daysB; // lower (more negative or fewer days left) comes first

    return (b.invoice.amountPayable || 0) - (a.invoice.amountPayable || 0);
  });

  const topUrgentSuppliers = sorted.slice(0, 5);

  const renderPriorityBadge = (priority: PriorityLevel) => {
    switch (priority) {
      case 'High':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-red-100 text-red-800 border border-red-200 uppercase tracking-wider inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
            🔴 High
          </span>
        );
      case 'Medium':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-orange-100 text-orange-800 border border-orange-200 uppercase tracking-wider inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
            🟠 Medium
          </span>
        );
      case 'Low':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wider inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            🟡 Low
          </span>
        );
      case 'No Action':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wider inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            🟢 No Action
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-red-100 text-red-700 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Top Urgent Suppliers</span>
                <span className="text-[10px] bg-red-100 text-red-800 font-extrabold px-2 py-0.5 rounded-full border border-red-200 uppercase">
                  Top {topUrgentSuppliers.length} Priority
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Critical supplier accounts requiring immediate settlement or authorization
              </p>
            </div>
          </div>
        </div>

        {topUrgentSuppliers.length === 0 ? (
          <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
            <p className="text-xs font-bold text-slate-800">No Urgent Suppliers Pending</p>
            <p className="text-[11px] text-slate-500">
              All supplier balances are current and within standard credit payment windows.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-200 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-3.5">Supplier Name</th>
                  <th className="py-3 px-3.5">Invoice #</th>
                  <th className="py-3 px-3.5 text-right">Amount</th>
                  <th className="py-3 px-3.5">Due Date</th>
                  <th className="py-3 px-3.5">Overdue / Status</th>
                  <th className="py-3 px-3.5">Priority</th>
                  <th className="py-3 px-3.5">AI Recommendation & Reason</th>
                  <th className="py-3 px-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {topUrgentSuppliers.map((evalItem) => {
                  const inv = evalItem.invoice;
                  const days = evalItem.daysRemaining;
                  const isApproved = inv.paymentStatus === 'Approved';

                  let daysLabel = '';
                  let daysClass = 'text-slate-600 font-medium';

                  if (days !== null) {
                    if (days < 0) {
                      daysLabel = `🔴 OVERDUE (${Math.abs(days)} DAY${Math.abs(days) === 1 ? '' : 'S'} OVERDUE)`;
                      daysClass = 'text-red-800 font-extrabold bg-red-100 px-2.5 py-1 rounded-full border border-red-300 uppercase tracking-wider flex items-center gap-1';
                    } else if (days === 0) {
                      daysLabel = '⏰ DUE TODAY';
                      daysClass = 'text-rose-800 font-extrabold bg-rose-100 px-2.5 py-1 rounded-full border border-rose-300 uppercase tracking-wider animate-pulse';
                    } else {
                      daysLabel = `${days} day(s) remaining`;
                      daysClass = 'text-amber-800 font-semibold';
                    }
                  }

                  return (
                    <tr
                      key={inv.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        evalItem.priority === 'High' ? 'bg-red-50/20' : ''
                      }`}
                    >
                      {/* Supplier Name */}
                      <td className="py-3 px-3.5 font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span>{inv.supplierName}</span>
                          {isApproved && (
                            <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 rounded uppercase">
                              🟢 Approved
                            </span>
                          )}
                        </div>
                        {inv.category && (
                          <span className="block text-[10px] font-normal text-slate-500">
                            {inv.category}
                          </span>
                        )}
                      </td>

                      {/* Invoice Number */}
                      <td className="py-3 px-3.5 font-mono text-slate-800 font-semibold">
                        {inv.invoiceNumber || 'N/A'}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-3.5 text-right font-extrabold text-amber-900 font-mono">
                        {formatCurrency(inv.amountPayable)}
                      </td>

                      {/* Due Date */}
                      <td className="py-3 px-3.5 text-slate-700 font-mono text-[11px]">
                        {inv.dueDate || 'N/A'}
                      </td>

                      {/* Days Remaining / Overdue */}
                      <td className="py-3 px-3.5">
                        <span className={`text-[10px] inline-block ${daysClass}`}>
                          {daysLabel}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-3.5">{renderPriorityBadge(evalItem.priority)}</td>

                      {/* AI Recommendation */}
                      <td className="py-3 px-3.5 max-w-xs">
                        <p className="text-[11px] font-semibold text-slate-800 leading-tight">
                          {evalItem.recommendation}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          <strong>Why:</strong> {evalItem.reason}
                        </p>
                      </td>

                          {/* Actions */}
                      <td className="py-3 px-3.5 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => onReview(evalItem)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-all cursor-pointer"
                            title="Review Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {isFinanceDirector && (
                            isApproved ? (
                              <button
                                disabled
                                className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 opacity-100 cursor-not-allowed shadow-2xs"
                                title="Payment Approved by Madam Lim"
                              >
                                <CheckCircle2 className="w-3 h-3 text-white" />
                                <span>Approved</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => onApprove(evalItem)}
                                className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs active:scale-95"
                                title="Approve Payment (Madam Lim)"
                              >
                                <FileCheck className="w-3 h-3 text-white" />
                                <span>Approve</span>
                              </button>
                            )
                          )}

                          {isFinanceDirector && (
                            <button
                              onClick={() => onMarkPaid(inv.id)}
                              className="px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                              title="Mark as Paid"
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Paid</span>
                            </button>
                          )}

                          {onDelete && (
                            <button
                              onClick={() => onDelete(inv.id)}
                              className="p-1.5 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-lg transition-all cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
