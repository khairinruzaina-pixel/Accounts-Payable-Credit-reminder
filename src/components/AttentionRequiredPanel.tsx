import React from 'react';
import { SummaryStats } from '../types';
import { formatCurrency } from '../utils/apEvaluator';
import { AlertCircle, Clock, Building2, CheckSquare, ShieldAlert } from 'lucide-react';

interface AttentionRequiredPanelProps {
  stats: SummaryStats;
  asOfDate: string;
}

export const AttentionRequiredPanel: React.FC<AttentionRequiredPanelProps> = ({ stats, asOfDate }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
      {/* Human Approval Mandatory Banner */}
      <div className="mb-4 bg-slate-900 border border-slate-800 text-white rounded-xl p-3.5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <span>Strict Governance Protocol</span>
              <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-400/30 font-mono">
                Madam Lim Sign-off Required
              </span>
            </p>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              Final payment approval must be completed by Madam Lim. AI provides analytical scoring and recommendations only.
            </p>
          </div>
        </div>
        <div className="shrink-0 text-right font-mono text-xs text-slate-400">
          As-Of Reference: <strong className="text-white">{asOfDate}</strong>
        </div>
      </div>

      {/* Attention Required Card Grid */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Attention Required Metrics & Highlights
            </h3>
          </div>
          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
            {stats.invoicesActionToday} Item(s) Actionable Today
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Total Overdue Amount */}
          <div className="p-4 rounded-xl bg-red-50/60 border border-red-200/80 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider">Total Overdue Amount</span>
              <AlertCircle className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-xl font-extrabold text-red-700 tracking-tight">
              {formatCurrency(stats.totalOverdueAmount)}
            </p>
            <p className="text-[10px] font-semibold text-red-600">
              {stats.numberOverdue} invoice(s) past payment due date
            </p>
          </div>

          {/* 2. Total Upcoming Payment Amount */}
          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Upcoming Amount (0-7D)</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-xl font-extrabold text-amber-900 tracking-tight">
              {formatCurrency(stats.totalUpcomingAmount)}
            </p>
            <p className="text-[10px] font-semibold text-amber-700">
              {stats.numberDueToday + stats.numberDue3Days + stats.numberDue7Days} invoice(s) due within next 7 days
            </p>
          </div>

          {/* 3. Highest Priority Supplier */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Highest Priority Supplier</span>
              <Building2 className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-base font-extrabold text-slate-900 truncate" title={stats.highestPrioritySupplier}>
              {stats.highestPrioritySupplier}
            </p>
            <p className="text-[10px] font-medium text-slate-500">
              Largest total weighted balance requiring attention
            </p>
          </div>

          {/* 4. Invoices Requiring Action Today */}
          <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col justify-between space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Action Today</span>
              <CheckSquare className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-extrabold text-white tracking-tight">
              {stats.invoicesActionToday} <span className="text-xs font-normal text-slate-400">Invoices</span>
            </p>
            <p className="text-[10px] text-slate-300 font-medium">
              Overdue, due today, or missing mandatory details
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
