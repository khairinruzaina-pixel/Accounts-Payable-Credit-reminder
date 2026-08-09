import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import {
  Building2,
  Calendar,
  Plus,
  Sparkles,
  Download,
  RotateCcw,
  ShieldAlert,
  Search,
  History,
  LogOut,
  Bell,
  FileSpreadsheet,
  Settings,
  ChevronDown
} from 'lucide-react';

interface HeaderProps {
  currentUser: User | null;
  onLogout: () => void;
  asOfDate: string;
  setAsOfDate: (date: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  priorityFilter: string;
  setPriorityFilter: (filter: string) => void;
  onOpenAddModal: () => void;
  onOpenAIScanModal: () => void;
  onOpenExcelImportModal?: () => void;
  onOpenAuditLogModal: () => void;
  onResetData: () => void;
  onOpenReminderNotification?: () => void;
  reminderCount?: number;
  onExportCSV: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLogout,
  asOfDate,
  setAsOfDate,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  onOpenAddModal,
  onOpenAIScanModal,
  onOpenExcelImportModal,
  onOpenAuditLogModal,
  onResetData,
  onOpenReminderNotification,
  reminderCount = 0,
  onExportCSV,
  onUndo,
  canUndo = false
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Close settings dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      {/* Top Branding Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Brand Logo & Company Title */}
        <div className="flex items-center gap-3.5 shrink-0">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-extrabold text-lg shadow-xs border border-slate-800">
            BH
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              Boon Huat Hardware & Supplies
            </h1>
            <p className="text-[11px] text-slate-500 font-semibold tracking-wide uppercase mt-0.5 flex items-center gap-1">
              <span>Accounts Payable Dashboard</span>
              <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                ERP Connected
              </span>
            </p>
          </div>
        </div>

        {/* Categorized Action Buttons Group */}
        <div className="flex flex-wrap items-center gap-3">
          {/* CATEGORY 1: DATA */}
          <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200 gap-1">
            <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider px-2 hidden xl:inline">
              Data
            </span>
            {onOpenExcelImportModal && (
              <button
                id="btn-import-excel"
                onClick={onOpenExcelImportModal}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                title="Import invoices from Excel or CSV spreadsheet"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
                <span>Import Excel</span>
              </button>
            )}

            <button
              id="btn-add-invoice"
              onClick={onOpenAddModal}
              className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-semibold px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 text-slate-600" />
              <span>New Record</span>
            </button>
          </div>

          {/* CATEGORY 2: AI TOOLS */}
          <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200 gap-1">
            <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider px-2 hidden xl:inline">
              AI Tools
            </span>
            <button
              id="btn-ai-scan"
              onClick={onOpenAIScanModal}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>AI Parser</span>
            </button>

            <button
              id="btn-reminder-notification"
              onClick={onOpenReminderNotification}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 relative"
              title="Generate AI Payment Reminders"
            >
              <Bell className="w-3.5 h-3.5 text-slate-950" />
              <span>Reminders</span>
              {reminderCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 bg-red-600 text-white font-black text-[10px] rounded-full leading-none shadow-2xs">
                  {reminderCount}
                </span>
              )}
            </button>
          </div>

          {/* CATEGORY 3: HISTORY */}
          <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200 gap-1">
            <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider px-2 hidden xl:inline">
              History
            </span>
            <button
              id="btn-audit-log"
              onClick={onOpenAuditLogModal}
              className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-semibold px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="View Audit Trail"
            >
              <History className="w-3.5 h-3.5 text-slate-600" />
              <span>Audit Trail</span>
            </button>
          </div>

          {/* SECONDARY MENU / SETTINGS DROPDOWN (Requirement 6) */}
          <div className="relative" ref={settingsRef}>
            <button
              id="btn-settings-dropdown"
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 p-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
              title="Secondary Menu & Settings"
            >
              <Settings className="w-4 h-4 text-slate-600" />
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isSettingsOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl border border-slate-200 shadow-xl py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  System Utilities
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onResetData();
                    setIsSettingsOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Reload Samples</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onExportCSV();
                    setIsSettingsOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Export Report (CSV)</span>
                </button>

                {onUndo && (
                  <button
                    type="button"
                    onClick={() => {
                      if (canUndo) onUndo();
                      setIsSettingsOpen(false);
                    }}
                    disabled={!canUndo}
                    className={`w-full text-left px-3 py-2 font-medium flex items-center gap-2 ${
                      canUndo
                        ? 'text-amber-700 hover:bg-amber-50 cursor-pointer'
                        : 'text-slate-300 cursor-not-allowed'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Undo Last Action</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Profile Badge & Logout Button */}
          {currentUser && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 ml-1">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-900 leading-none">{currentUser.name}</p>
                <p className="text-[10px] text-blue-600 font-bold uppercase tracking-tight mt-0.5">
                  {currentUser.role}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-900 text-amber-400 font-extrabold text-xs shadow-xs flex items-center justify-center border border-slate-700">
                {currentUser.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <button
                id="btn-logout"
                onClick={onLogout}
                className="px-2 py-1.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 border border-slate-200 hover:border-red-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ml-1"
                title="Log Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Date Controls Toolbar */}
      <div className="bg-slate-50/80 border-t border-slate-200 py-2.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* As Of Date Picker */}
          <div className="md:col-span-4 bg-white border border-slate-200 rounded-lg px-3 py-1.5 flex items-center space-x-2 shadow-2xs">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
              As Of Date:
            </span>
            <input
              id="input-as-of-date"
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="bg-transparent text-slate-900 text-xs font-bold focus:outline-none w-full"
            />
          </div>

          {/* Search Input */}
          <div className="md:col-span-4 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-supplier"
              type="text"
              placeholder="Search supplier or invoice number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-slate-200 text-slate-800 text-xs rounded-lg pl-9 pr-3 py-1.5 w-full focus:outline-none focus:border-slate-400 shadow-2xs"
            />
          </div>

          {/* Filters */}
          <div className="md:col-span-4 flex gap-2">
            <select
              id="select-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-slate-400 w-1/2 shadow-2xs font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="Overdue">Overdue</option>
              <option value="Due Today">Due Today</option>
              <option value="Due within 3 Days">Due within 3 Days</option>
              <option value="Due within 7 Days">Due within 7 Days</option>
              <option value="Not Yet Due">Not Yet Due</option>
            </select>

            <select
              id="select-priority-filter"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-slate-400 w-1/2 shadow-2xs font-medium"
            >
              <option value="ALL">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
