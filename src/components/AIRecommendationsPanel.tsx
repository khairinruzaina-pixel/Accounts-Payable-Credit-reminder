import React from 'react';
import { InvoiceEvaluation, PriorityLevel } from '../types';
import { formatCurrency } from '../utils/apEvaluator';
import { Sparkles, ShieldCheck, CheckCircle2, FileCheck, Eye, Info, AlertTriangle, Trash2 } from 'lucide-react';

interface AIRecommendationsPanelProps {
  evaluations: InvoiceEvaluation[];
  onApprove: (evaluation: InvoiceEvaluation) => void;
  onReview: (evaluation: InvoiceEvaluation) => void;
  onMarkPaid: (id: string) => void;
  onDelete?: (id: string) => void;
  isFinanceDirector?: boolean;
}

export const AIRecommendationsPanel: React.FC<AIRecommendationsPanelProps> = ({
  evaluations,
  onApprove,
  onReview,
  onMarkPaid,
  onDelete,
  isFinanceDirector = true
}) => {
  // Filter for active unpaid invoices sorted by priority (High -> Medium -> Low -> No Action)
  const activeEvaluations = evaluations.filter((e) => e.invoice.paymentStatus !== 'Paid');

  const priorityOrder: Record<PriorityLevel, number> = {
    High: 1,
    Medium: 2,
    Low: 3,
    'No Action': 4
  };

  const sortedEvaluations = [...activeEvaluations].sort((a, b) => {
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const topRecommendations = sortedEvaluations.slice(0, 4);

  const renderPriorityBadge = (priority: PriorityLevel) => {
    switch (priority) {
      case 'High':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-red-100 text-red-800 border border-red-200 flex items-center gap-1 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
            🔴 High Priority
          </span>
        );
      case 'Medium':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-orange-100 text-orange-800 border border-orange-200 flex items-center gap-1 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
            🟠 Medium Priority
          </span>
        );
      case 'Low':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            🟡 Low Priority
          </span>
        );
      case 'No Action':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 uppercase tracking-wider">
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
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
              <Sparkles className="w-4 h-4 fill-amber-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                AI Insights & Recommendations
              </h3>
              <p className="text-[11px] text-slate-500">
                Automated credit risk evaluation & explainable reasoning engine
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200">
              Responsible AI Active
            </span>
          </div>
        </div>

        {topRecommendations.length === 0 ? (
          <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
            <p className="text-xs font-bold text-slate-800">All Active Invoices Settled or Clear</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              No immediate high-priority supplier recommendations require attention at this moment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {topRecommendations.map((evalItem) => {
              const inv = evalItem.invoice;
              const isApproved = inv.paymentStatus === 'Approved';

              return (
                <div
                  key={inv.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                    evalItem.priority === 'High'
                      ? 'bg-red-50/30 border-red-200/80 hover:border-red-300'
                      : evalItem.priority === 'Medium'
                      ? 'bg-orange-50/20 border-orange-200/80 hover:border-orange-300'
                      : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Item Header */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">{inv.supplierName}</span>
                        {isApproved ? (
                          <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase flex items-center gap-1">
                            🟢 Approved
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-red-100 text-red-800 border border-red-200 uppercase flex items-center gap-1">
                            🔴 Pending Approval
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                        Inv #: <strong className="text-slate-800">{inv.invoiceNumber || 'NO-NUMBER'}</strong> • Amount: <strong className="text-amber-800 font-bold">{formatCurrency(inv.amountPayable)}</strong>
                      </p>
                    </div>
                    <div>{renderPriorityBadge(evalItem.priority)}</div>
                  </div>

                  {/* Explainable AI Content */}
                  <div className="space-y-2 text-xs">
                    {/* Reason */}
                    <div className="flex items-start gap-2">
                      <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-700 font-bold">Reasoning: </strong>
                        <span className="text-slate-800 font-medium">{evalItem.reason}</span>
                      </div>
                    </div>

                    {/* Business Impact */}
                    {evalItem.businessImpact && (
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-700 font-bold">Business Impact: </strong>
                          <span className="text-slate-700">{evalItem.businessImpact}</span>
                        </div>
                      </div>
                    )}

                    {/* Recommended Action */}
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-700 font-bold">Recommended Action: </strong>
                        <span className="text-slate-900 font-bold">{evalItem.recommendation}</span>
                      </div>
                    </div>
                  </div>

                  {/* Human Approval Action Bar */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400 font-semibold italic">
                      Requires Madam Lim Sign-off
                    </span>

                    <div className="flex items-center gap-1.5">
                      {/* 1. Review Payment */}
                      <button
                        onClick={() => onReview(evalItem)}
                        className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                        title="Review Payment Details"
                      >
                        <Eye className="w-3 h-3 text-slate-500" />
                        <span>Review</span>
                      </button>

                      {/* 2. Approve Payment */}
                      {isFinanceDirector && (
                        isApproved ? (
                          <button
                            disabled
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 opacity-100 cursor-not-allowed shadow-2xs"
                            title="Payment Approved by Madam Lim"
                          >
                            <CheckCircle2 className="w-3 h-3 text-white" />
                            <span>Approved</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onApprove(evalItem)}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95"
                            title="Approve Payment (Madam Lim)"
                          >
                            <FileCheck className="w-3 h-3 text-white" />
                            <span>Approve Payment</span>
                          </button>
                        )
                      )}

                      {/* 3. Mark as Paid */}
                      {isFinanceDirector && (
                        <button
                          onClick={() => onMarkPaid(inv.id)}
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                          title="Mark as Paid / Settled"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Mark Paid</span>
                        </button>
                      )}

                      {/* 4. Delete Record */}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(inv.id)}
                          className="p-1.5 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-lg text-xs transition-all cursor-pointer"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Responsible AI Compliance Footer */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Responsible AI Compliance:</strong> Objective due-date rules applied equally across all suppliers without vendor bias or hallucinating missing values.
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono font-bold shrink-0">
            Human-in-the-Loop Enforced
          </span>
        </div>
      </div>
    </div>
  );
};
