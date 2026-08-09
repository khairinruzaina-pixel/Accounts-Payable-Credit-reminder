import React from 'react';
import { SummaryStats } from '../types';
import { formatCurrency } from '../utils/apEvaluator';
import { FileText, DollarSign, AlertCircle, Calendar } from 'lucide-react';

interface SummaryCardsProps {
  stats: SummaryStats;
  asOfDate: string;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ stats, asOfDate }) => {
  const dueWithin7DaysCount =
    stats.numberDueToday + stats.numberDue3Days + stats.numberDue7Days;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Accounts Payable Key Performance Indicators
        </h2>
        <span className="text-xs text-slate-500 font-medium">
          As Of Date: <strong className="text-slate-800 font-bold">{asOfDate}</strong>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Invoices */}
        <div id="card-total-invoices" className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Invoices</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats.totalInvoices}</p>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Active AP Register</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* 2. Outstanding Amount */}
        <div id="card-total-outstanding" className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Outstanding Amount</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1 tracking-tight">
              {formatCurrency(stats.totalAmountPayableAll)}
            </p>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Unpaid Supplier Total</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200 shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* 3. Overdue Invoices */}
        <div id="card-overdue-invoices" className="bg-white p-4 rounded-xl border border-red-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-red-700 uppercase tracking-wider">Overdue Invoices</p>
            <p className="text-2xl font-extrabold text-red-600 mt-1">{stats.numberOverdue}</p>
            <p className="text-[10px] font-semibold text-red-600 mt-0.5">
              {formatCurrency(stats.totalOverdueAmount)} past due
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100 shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        {/* 4. Due Within 7 Days */}
        <div id="card-due-7days" className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Due Within 7 Days</p>
            <p className="text-2xl font-extrabold text-amber-600 mt-1">{dueWithin7DaysCount}</p>
            <p className="text-[10px] font-semibold text-amber-700 mt-0.5">
              {formatCurrency(stats.totalUpcomingAmount)} upcoming
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
};
