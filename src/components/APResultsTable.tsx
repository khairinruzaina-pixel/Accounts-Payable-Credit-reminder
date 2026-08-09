import React from 'react';
import { InvoiceEvaluation, PriorityLevel, StatusCategory } from '../types';
import { formatCurrency } from '../utils/apEvaluator';
import {
  Sparkles,
  Edit,
  Trash2,
  FileCheck,
  Info,
  CheckCircle2,
  Upload,
  FileText
} from 'lucide-react';

interface APResultsTableProps {
  evaluations: InvoiceEvaluation[];
  onApprove: (evaluation: InvoiceEvaluation) => void;
  onGenerateReminder: (evaluation: InvoiceEvaluation) => void;
  onEdit: (evaluation: InvoiceEvaluation) => void;
  onDelete: (id: string) => void;
  onMarkPaid?: (id: string) => void;
  onUploadReceipt?: (evaluation: InvoiceEvaluation) => void;
  onOpenAIScanModal?: () => void;
  onOpenAddModal?: () => void;
  isFinanceDirector?: boolean;
}

export const APResultsTable: React.FC<APResultsTableProps> = ({
  evaluations,
  onApprove,
  onGenerateReminder,
  onEdit,
  onDelete,
  onMarkPaid,
  onUploadReceipt,
  onOpenAIScanModal,
  onOpenAddModal,
  isFinanceDirector = true
}) => {
  // Helper for priority badges
  const renderPriorityBadge = (priority: PriorityLevel) => {
    switch (priority) {
      case 'High':
        return (
          <span className="px-2 py-1 rounded text-[10px] font-extrabold bg-red-100 text-red-800 border border-red-200 uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
            High
          </span>
        );
      case 'Medium':
        return (
          <span className="px-2 py-1 rounded text-[10px] font-extrabold bg-orange-100 text-orange-800 border border-orange-200 uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
            Medium
          </span>
        );
      case 'Low':
        return (
          <span className="px-2 py-1 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Low
          </span>
        );
      case 'No Action':
        return (
          <span className="px-2 py-1 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            No Action
          </span>
        );
      default:
        return null;
    }
  };

  // Helper for status badges
  const renderStatusBadge = (statusCategory: StatusCategory, hasMissingInfo: boolean, daysRemaining: number | null) => {
    if (hasMissingInfo) {
      return (
        <span className="px-2 py-1 rounded text-[10px] font-bold bg-purple-100 text-purple-700 uppercase tracking-wider">
          Info Missing
        </span>
      );
    }

    switch (statusCategory) {
      case 'Overdue':
        const absDays = daysRemaining !== null ? Math.abs(daysRemaining) : 0;
        return (
          <span className="px-2 py-1 rounded text-[10px] font-extrabold bg-red-100 text-red-800 border border-red-200 uppercase tracking-wider flex items-center gap-1">
            🔴 OVERDUE ({absDays} DAY{absDays === 1 ? '' : 'S'} OVERDUE)
          </span>
        );
      case 'Due Today':
        return (
          <span className="px-2 py-1 rounded text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300 uppercase tracking-wider">
            ⏰ Due Today
          </span>
        );
      case 'Due within 3 Days':
        return (
          <span className="px-2 py-1 rounded text-[10px] font-bold bg-orange-100 text-orange-700 uppercase tracking-wider">
            Due &lt; 3D
          </span>
        );
      case 'Due within 7 Days':
        return (
          <span className="px-2 py-1 rounded text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wider">
            Due &lt; 7D
          </span>
        );
      case 'Not Yet Due':
        return (
          <span className="px-2 py-1 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wider">
            Not Yet Due
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
        {/* Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white z-10 border-b border-slate-100">
              <tr>
                <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Supplier & Inv #
                </th>
                <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Priority
                </th>
                <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-48">
                  Recommendation
                </th>
                <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Reasoning
                </th>
                <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 bg-white">
              {evaluations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                        <Sparkles className="w-6 h-6 text-amber-500" />
                      </div>
                      <h4 className="text-base font-bold text-slate-800">No Invoices Currently Tracked</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        All invoice records have been cleared. Extract new invoices automatically using Gemini AI or create manual records.
                      </p>
                      <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                        {onOpenAIScanModal && (
                          <button
                            onClick={onOpenAIScanModal}
                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span>Extract Invoices with AI</span>
                          </button>
                        )}
                        {onOpenAddModal && (
                          <button
                            onClick={onOpenAddModal}
                            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold rounded-lg text-xs transition-all cursor-pointer shadow-2xs"
                          >
                            + Add Manually
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                evaluations.map((evalItem) => {
                  const inv = evalItem.invoice;
                  const isPaid = inv.paymentStatus === 'Paid';
                  const isApproved = inv.paymentStatus === 'Approved';

                  return (
                    <tr
                      key={inv.id}
                      className={`hover:bg-slate-50/50 transition-colors ${
                        isPaid ? 'opacity-60 bg-slate-50/50' : ''
                      }`}
                    >
                      {/* 1. Supplier & Inv # */}
                      <td className="p-4 align-top">
                        <p className="font-bold text-slate-900">{inv.supplierName}</p>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          {inv.invoiceNumber || 'NO-NUMBER'}
                        </p>
                        <p className="text-xs font-bold text-slate-800 mt-1">
                          {formatCurrency(inv.amountPayable)}
                        </p>
                      </td>

                      {/* 2. Due Date */}
                      <td className="p-4 text-sm font-medium align-top whitespace-nowrap">
                        {inv.dueDate || <span className="text-red-500 text-xs font-bold">Unspecified</span>}
                        {evalItem.daysRemaining !== null && (
                          <span className={`block text-[10px] font-bold mt-0.5 ${
                            evalItem.daysRemaining < 0
                              ? 'text-red-600 font-extrabold'
                              : evalItem.daysRemaining <= 3
                              ? 'text-orange-500'
                              : 'text-slate-500'
                          }`}>
                            {evalItem.daysRemaining < 0
                              ? `🔴 ${Math.abs(evalItem.daysRemaining)} DAYS OVERDUE`
                              : evalItem.daysRemaining === 0
                              ? '⏰ DUE TODAY'
                              : `IN ${evalItem.daysRemaining} DAYS`}
                          </span>
                        )}
                      </td>

                      {/* 3. Status */}
                      <td className="p-4 align-top whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          {isPaid ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-700 text-white uppercase flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-white" />
                              Paid
                            </span>
                          ) : isApproved ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              🟢 Approved
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-red-100 text-red-800 border border-red-200 uppercase flex items-center gap-1">
                              🔴 Pending Approval
                            </span>
                          )}
                          {renderStatusBadge(evalItem.statusCategory, evalItem.hasMissingInfo, evalItem.daysRemaining)}
                        </div>
                      </td>

                      {/* 4. Priority */}
                      <td className="p-4 align-top whitespace-nowrap">
                        {renderPriorityBadge(evalItem.priority)}
                      </td>

                      {/* 5. Recommendation */}
                      <td className="p-4 text-xs font-semibold align-top text-slate-800">
                        {evalItem.recommendation}
                      </td>

                      {/* 6. Reasoning */}
                      <td className="p-4 text-[11px] leading-relaxed text-slate-600 align-top">
                        {evalItem.reason}
                      </td>

                      {/* 7. Actions */}
                      <td className="p-4 align-top text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isPaid && (
                            isApproved ? (
                              <button
                                id={`btn-upload-receipt-${inv.id}`}
                                onClick={() => {
                                  if (onUploadReceipt) {
                                    onUploadReceipt(evalItem);
                                  } else if (onMarkPaid) {
                                    onMarkPaid(inv.id);
                                  }
                                }}
                                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 ${
                                  inv.paymentReceipt
                                    ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                }`}
                                title="Upload Payment Receipt & Verify Payment (Madam Lim)"
                              >
                                {inv.paymentReceipt ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                                    <span>Receipt Verified</span>
                                  </>
                                ) : (
                                  <>
                                    <Upload className="w-3.5 h-3.5 text-white" />
                                    <span>Upload Payment Receipt</span>
                                  </>
                                )}
                              </button>
                            ) : (
                              isFinanceDirector && (
                                <button
                                  id={`btn-approve-${inv.id}`}
                                  onClick={() => onApprove(evalItem)}
                                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
                                  title="Approve Payment (Madam Lim)"
                                >
                                  <FileCheck className="w-3.5 h-3.5 text-white" />
                                  <span>Approve Payment</span>
                                </button>
                              )
                            )
                          )}

                          <button
                            id={`btn-reminder-${inv.id}`}
                            onClick={() => onGenerateReminder(evalItem)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-800 p-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
                            title="Generate Payment Communication / Voucher"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          </button>

                          <button
                            id={`btn-edit-${inv.id}`}
                            onClick={() => onEdit(evalItem)}
                            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg transition-all cursor-pointer"
                            title="Edit Invoice"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {!isPaid && onMarkPaid && (
                            <button
                              id={`btn-markpaid-${inv.id}`}
                              onClick={() => {
                                if (onUploadReceipt) {
                                  onUploadReceipt(evalItem);
                                } else {
                                  onMarkPaid(inv.id);
                                }
                              }}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold px-2 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                              title="Verify Receipt & Mark as Paid"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Paid</span>
                            </button>
                          )}

                          <button
                            id={`btn-delete-${inv.id}`}
                            onClick={() => onDelete(inv.id)}
                            className="text-slate-300 hover:text-red-600 p-1.5 rounded-lg transition-all cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Prompt Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shrink-0"></div>
            <p className="text-xs text-slate-500 font-medium italic">
              All payments require manual review and approval by Madam Lim before processing.
            </p>
          </div>
          <button
            onClick={() => {
              if (evaluations.length > 0) {
                onGenerateReminder(evaluations[0]);
              }
            }}
            className="px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 active:scale-95 cursor-pointer shadow-xs transition-all tracking-wider uppercase"
          >
            Generate Reminders & Vouchers
          </button>
        </div>
      </div>
    </div>
  );
};

