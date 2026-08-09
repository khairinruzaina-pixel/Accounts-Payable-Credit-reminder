import React from 'react';
import { Invoice, InvoiceEvaluation, SummaryStats } from '../types';
import { formatCurrency } from '../utils/apEvaluator';
import { ShieldCheck, Bot, Sparkles, AlertCircle, Building2, CheckCircle2, CopyX, TrendingUp, ShieldAlert } from 'lucide-react';

interface AISummarySectionProps {
  stats: SummaryStats;
  invoices: Invoice[];
  evaluations: InvoiceEvaluation[];
}

export const AISummarySection: React.FC<AISummarySectionProps> = ({
  stats,
  invoices,
  evaluations
}) => {
  const dueWithin7DaysCount =
    stats.numberDueToday + stats.numberDue3Days + stats.numberDue7Days;

  // Calculate duplicate invoice numbers
  const invoiceNumberCounts: Record<string, number> = {};
  invoices.forEach((inv) => {
    const num = inv.invoiceNumber?.trim().toUpperCase();
    if (num && num !== 'N/A' && num !== 'NONE' && inv.paymentStatus !== 'Paid') {
      invoiceNumberCounts[num] = (invoiceNumberCounts[num] || 0) + 1;
    }
  });
  const duplicateNumbers = Object.keys(invoiceNumberCounts).filter(
    (num) => invoiceNumberCounts[num] > 1
  );

  // Top recommendation
  const unpaidEvals = evaluations.filter((e) => e.invoice.paymentStatus !== 'Paid');
  const topEval = unpaidEvals.find((e) => e.priority === 'High') || unpaidEvals[0];

  const highestPrioritySupplier = stats.highestPrioritySupplier || 'None';
  const totalImmediateAmount = stats.totalOverdueAmount + (topEval?.invoice.amountPayable || 0);

  // Dynamic AI Summary Text
  const generateSummaryText = () => {
    if (stats.totalInvoices === 0) {
      return 'There are currently no active invoices in the Accounts Payable register.';
    }

    let text = '';
    if (stats.numberOverdue > 0) {
      text += `There are ${stats.numberOverdue} overdue invoice${stats.numberOverdue > 1 ? 's' : ''} requiring immediate attention. `;
    } else {
      text += `All current invoices are within valid credit payment terms with 0 overdue items. `;
    }

    if (highestPrioritySupplier !== 'None') {
      text += `${highestPrioritySupplier} is currently the highest priority supplier. `;
    }

    text += `Total outstanding amount across all vendors is ${formatCurrency(stats.totalAmountPayableAll)}.`;

    if (topEval) {
      text += ` Recommended action: ${topEval.recommendation}`;
    }

    return text;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 space-y-4">
      {/* 5. Compact Governance Notice Banner */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-3 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-400/30">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wide">
              🛡 Human Approval Required
            </span>
            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              AI provides analysis and recommendations only. Only Madam Lim (Finance Director) can approve payments and mark invoices as Paid.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: AI Payment Summary & AI Insights Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* 3. AI Payment Summary Card */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                  <Bot className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                    <span>🤖 AI Payment Summary</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Real-time automated executive briefing & credit risk score
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200">
                Live Analysis
              </span>
            </div>

            {/* Generated Narrative Paragraph */}
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
              "{generateSummaryText()}"
            </div>
          </div>

          {/* Quick Metrics Bar inside AI Summary */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
            <div className="p-2.5 bg-red-50/60 border border-red-100 rounded-lg text-center">
              <span className="text-[10px] font-bold text-red-700 uppercase block">Overdue</span>
              <span className="text-base font-extrabold text-red-600 font-mono">{stats.numberOverdue}</span>
            </div>
            <div className="p-2.5 bg-amber-50/60 border border-amber-100 rounded-lg text-center">
              <span className="text-[10px] font-bold text-amber-800 uppercase block">Due 0-7 Days</span>
              <span className="text-base font-extrabold text-amber-600 font-mono">{dueWithin7DaysCount}</span>
            </div>
            <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-center">
              <span className="text-[10px] font-bold text-slate-600 uppercase block">Outstanding</span>
              <span className="text-xs font-extrabold text-slate-900 font-mono truncate block">
                {formatCurrency(stats.totalAmountPayableAll)}
              </span>
            </div>
          </div>
        </div>

        {/* 9. AI Insights Panel */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
              <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              AI Insights
            </h3>
          </div>

          <div className="space-y-2.5 text-xs">
            {/* 1. Highest priority supplier today */}
            <div className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 transition-colors">
              <Building2 className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-500 block text-[10px] uppercase">Highest Priority Supplier Today</span>
                <span className="font-extrabold text-slate-900">{highestPrioritySupplier}</span>
              </div>
            </div>

            {/* 2. Total amount requiring immediate payment */}
            <div className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 transition-colors">
              <TrendingUp className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-500 block text-[10px] uppercase">Amount Requiring Immediate Payment</span>
                <span className="font-extrabold text-red-600 font-mono">
                  {formatCurrency(stats.totalOverdueAmount)}
                </span>
                <span className="text-[10px] text-slate-400 block">Across {stats.numberOverdue} overdue invoice(s)</span>
              </div>
            </div>

            {/* 3. Number of invoices due today */}
            <div className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 transition-colors">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-500 block text-[10px] uppercase">Invoices Due Today</span>
                <span className="font-extrabold text-amber-700">
                  {stats.numberDueToday} invoice(s)
                </span>
              </div>
            </div>

            {/* 4. Any duplicate invoice numbers detected */}
            <div className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 transition-colors">
              <CopyX className={`w-4 h-4 shrink-0 mt-0.5 ${duplicateNumbers.length > 0 ? 'text-red-500' : 'text-emerald-500'}`} />
              <div>
                <span className="font-bold text-slate-500 block text-[10px] uppercase">Duplicate Invoices Detected</span>
                {duplicateNumbers.length > 0 ? (
                  <span className="font-bold text-red-600">
                    ⚠️ {duplicateNumbers.length} duplicate ref found ({duplicateNumbers.join(', ')})
                  </span>
                ) : (
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 inline" /> None detected
                  </span>
                )}
              </div>
            </div>

            {/* 5. AI recommendation for today's payment priority */}
            <div className="flex items-start gap-2.5 p-2 bg-blue-50/60 border border-blue-100 rounded-lg">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-blue-900 block text-[10px] uppercase">Today's AI Payment Recommendation</span>
                <p className="font-semibold text-blue-950 text-[11px] leading-tight mt-0.5">
                  {topEval ? topEval.recommendation : 'All balances clear. No immediate disbursements needed today.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
