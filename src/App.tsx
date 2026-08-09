import React, { useState, useMemo } from 'react';
import { Invoice, InvoiceEvaluation, AuditLog, User, PaymentReceipt } from './types';
import { INITIAL_INVOICES } from './data/sampleInvoices';
import { evaluateInvoice, calculateSummaryStats } from './utils/apEvaluator';
import { Header } from './components/Header';
import { SummaryCards } from './components/SummaryCards';
import { AISummarySection } from './components/AISummarySection';
import { APResultsTable } from './components/APResultsTable';
import { AddInvoiceModal } from './components/AddInvoiceModal';
import { AIInvoiceExtractorModal } from './components/AIInvoiceExtractorModal';
import { ExcelImportModal } from './components/ExcelImportModal';
import { ReminderGeneratorModal } from './components/ReminderGeneratorModal';
import { MadamLimApprovalModal } from './components/MadamLimApprovalModal';
import { PaymentReceiptModal } from './components/PaymentReceiptModal';
import { AuditLogModal } from './components/AuditLogModal';
import { UrgentSuppliersPanel } from './components/UrgentSuppliersPanel';
import { AccessDeniedModal } from './components/AccessDeniedModal';
import { LoginPage } from './components/LoginPage';
import { CheckCircle2, ShieldCheck, X, RotateCcw } from 'lucide-react';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [welcomeBanner, setWelcomeBanner] = useState<string | null>(null);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [asOfDate, setAsOfDate] = useState<string>('2026-08-01');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  // Audit Logs State
  const [logs, setLogs] = useState<AuditLog[]>([
    {
      id: 'log-1',
      timestamp: '2026-08-01 08:00',
      supplierName: 'Boon Huat AP System',
      invoiceNumber: 'SYSTEM',
      action: 'Created',
      performedBy: 'System Admin',
      notes: 'System initialized. Accounts Payable assistant ready for AI analysis.'
    }
  ]);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  const [isAIScanModalOpen, setIsAIScanModalOpen] = useState(false);
  const [isExcelImportModalOpen, setIsExcelImportModalOpen] = useState(false);

  const [reminderEvaluation, setReminderEvaluation] = useState<InvoiceEvaluation | null>(null);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);

  const [approvalEvaluation, setApprovalEvaluation] = useState<InvoiceEvaluation | null>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);

  const [receiptEvaluation, setReceiptEvaluation] = useState<InvoiceEvaluation | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isAccessDeniedModalOpen, setIsAccessDeniedModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Action Undo History Stack
  const [historyStack, setHistoryStack] = useState<{
    invoices: Invoice[];
    logs: AuditLog[];
    description: string;
  }[]>([]);

  const pushHistory = (description: string) => {
    setHistoryStack((prev) => [
      ...prev,
      {
        invoices: JSON.parse(JSON.stringify(invoices)),
        logs: JSON.parse(JSON.stringify(logs)),
        description
      }
    ]);
  };

  const handleUndo = () => {
    if (historyStack.length === 0) return;
    const lastState = historyStack[historyStack.length - 1];
    setHistoryStack((prev) => prev.slice(0, prev.length - 1));
    setInvoices(lastState.invoices);
    setLogs(lastState.logs);
    setToastMessage(`Undid action: "${lastState.description}"`);
  };

  // Permission Check Helper
  const isFinanceDirector = currentUser?.role === 'Finance Director' || currentUser?.username === 'madamlim';

  const triggerApprove = (evalItem: InvoiceEvaluation) => {
    if (!isFinanceDirector) {
      setIsAccessDeniedModalOpen(true);
      return;
    }
    setApprovalEvaluation(evalItem);
    setIsApprovalModalOpen(true);
  };

  const triggerUploadReceipt = (evalItem: InvoiceEvaluation) => {
    if (!isFinanceDirector) {
      setIsAccessDeniedModalOpen(true);
      return;
    }
    setReceiptEvaluation(evalItem);
    setIsReceiptModalOpen(true);
  };

  const triggerMarkPaid = (id: string, notes?: string) => {
    if (!isFinanceDirector) {
      setIsAccessDeniedModalOpen(true);
      return;
    }
    const evalItem = allEvaluations.find((e) => e.invoice.id === id);
    if (evalItem) {
      triggerUploadReceipt(evalItem);
    } else {
      handleConfirmMarkPaid(id, notes || 'Marked as paid.');
    }
  };

  // Authentication Handlers
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    const greeting = `Welcome back, ${user.name}.`;
    setWelcomeBanner(greeting);

    // Auto-dismiss welcome banner after 6 seconds
    setTimeout(() => {
      setWelcomeBanner(null);
    }, 6000);

    // Open AI Scanner automatically on first login if list is empty
    setIsAIScanModalOpen(true);

    // Audit log entry for login
    const newLog: AuditLog = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toLocaleString('en-SG'),
      supplierName: 'Boon Huat Security',
      invoiceNumber: 'AUTH_LOGIN',
      action: 'Created',
      performedBy: user.name,
      notes: `User ${user.username} (${user.role}) logged in successfully.`
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  const handleLogout = () => {
    if (currentUser) {
      const newLog: AuditLog = {
        id: 'log-' + Date.now(),
        timestamp: new Date().toLocaleString('en-SG'),
        supplierName: 'Boon Huat Security',
        invoiceNumber: 'AUTH_LOGOUT',
        action: 'Created',
        performedBy: currentUser.name,
        notes: `User ${currentUser.username} logged out.`
      };
      setLogs((prev) => [newLog, ...prev]);
    }

    setCurrentUser(null);
    setWelcomeBanner(null);
  };

  // Compute evaluations for all invoices
  const allEvaluations = useMemo(() => {
    return invoices.map((inv) => evaluateInvoice(inv, asOfDate));
  }, [invoices, asOfDate]);

  // Compute aggregate statistics
  const summaryStats = useMemo(() => {
    return calculateSummaryStats(allEvaluations);
  }, [allEvaluations]);

  // Filter evaluations based on user search and filters
  const filteredEvaluations = useMemo(() => {
    return allEvaluations.filter((item) => {
      const inv = item.invoice;
      const matchesSearch =
        inv.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.category && inv.category.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        statusFilter === 'ALL' || item.statusCategory === statusFilter;

      const matchesPriority =
        priorityFilter === 'ALL' || item.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [allEvaluations, searchTerm, statusFilter, priorityFilter]);

  const reminderCount = useMemo(() => {
    return allEvaluations.filter(
      (e) =>
        e.invoice.paymentStatus !== 'Paid' &&
        (e.priority === 'High' || e.statusCategory === 'Overdue' || e.statusCategory === 'Due Today')
    ).length;
  }, [allEvaluations]);

  // If not logged in, restrict access to dashboard completely
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Handlers
  const handleSaveInvoice = (savedInvoice: Invoice) => {
    pushHistory(editingInvoice ? `Updated invoice ${savedInvoice.invoiceNumber || savedInvoice.id}` : `Added invoice ${savedInvoice.invoiceNumber || savedInvoice.id}`);

    setInvoices((prev) => {
      const exists = prev.some((i) => i.id === savedInvoice.id);
      if (exists) {
        return prev.map((i) => (i.id === savedInvoice.id ? savedInvoice : i));
      } else {
        return [savedInvoice, ...prev];
      }
    });

    // Add Audit Log
    const newLog: AuditLog = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toLocaleString('en-SG'),
      supplierName: savedInvoice.supplierName,
      invoiceNumber: savedInvoice.invoiceNumber,
      action: editingInvoice ? 'Edited' : 'Created',
      performedBy: 'Madam Lim',
      notes: editingInvoice
        ? `Updated invoice record details for ${savedInvoice.supplierName}.`
        : `Added new invoice record for ${savedInvoice.supplierName}.`
    };
    setLogs((prev) => [newLog, ...prev]);
    setEditingInvoice(null);
    setToastMessage(`Invoice ${savedInvoice.invoiceNumber} saved successfully.`);
  };

  const formatSequentialInvoices = (list: Invoice[], existing: Invoice[]): Invoice[] => {
    if (list.length === 0) return list;

    const extractNum = (str: string) => {
      if (!str) return null;
      const match = str.match(/^(.*?)(\d+)(\D*)$/);
      if (!match) return null;
      return {
        prefix: match[1],
        num: parseInt(match[2], 10),
        length: match[2].length,
        suffix: match[3]
      };
    };

    let startNum = 209;
    let prefix = 'INV-';
    let padLen = 3;
    let suffix = '';

    const firstParsed = extractNum(list[0].invoiceNumber);
    if (firstParsed) {
      prefix = firstParsed.prefix;
      startNum = firstParsed.num;
      padLen = firstParsed.length;
      suffix = firstParsed.suffix;
    } else if (existing.length > 0) {
      const existingParsed = extractNum(existing[0].invoiceNumber);
      if (existingParsed) {
        prefix = existingParsed.prefix;
        startNum = existingParsed.num + 1;
        padLen = existingParsed.length;
        suffix = existingParsed.suffix;
      }
    }

    let currentNum = startNum;

    return list.map((inv, idx) => {
      if (idx === 0) {
        if (!inv.invoiceNumber) {
          const numStr = String(currentNum).padStart(padLen, '0');
          return { ...inv, invoiceNumber: `${prefix}${numStr}${suffix}` };
        }
        return inv;
      }

      const parsed = extractNum(inv.invoiceNumber);
      if (parsed) {
        currentNum = Math.max(currentNum + 1, parsed.num);
        return inv;
      } else {
        currentNum++;
        const numStr = String(currentNum).padStart(padLen, '0');
        return { ...inv, invoiceNumber: `${prefix}${numStr}${suffix}` };
      }
    });
  };

  const handleInvoiceExtracted = (extractedInput: Invoice | Invoice[]) => {
    const rawList = Array.isArray(extractedInput) ? extractedInput : [extractedInput];
    const formattedList = formatSequentialInvoices(rawList, invoices);

    pushHistory(`Extracted ${formattedList.length} invoice(s) via AI Parser`);

    setInvoices((prev) => [...formattedList, ...prev]);

    const newLogs: AuditLog[] = formattedList.map((inv, idx) => ({
      id: 'log-' + Date.now() + '-' + idx,
      timestamp: new Date().toLocaleString('en-SG'),
      supplierName: inv.supplierName || 'Unknown Supplier',
      invoiceNumber: inv.invoiceNumber || 'EXTRACTED',
      action: 'Created',
      performedBy: 'Gemini AI Assistant',
      notes: `Extracted supplier invoice fields with sequential number (${inv.invoiceNumber}).`
    }));

    setLogs((prev) => [...newLogs, ...prev]);
    setToastMessage(`Extracted ${formattedList.length} invoice(s) successfully.`);
  };

  const handleDeleteInvoice = (id: string) => {
    const target = invoices.find((i) => i.id === id);
    if (confirm(`Are you sure you want to delete invoice ${target?.invoiceNumber || id}?`)) {
      pushHistory(`Deleted invoice ${target?.invoiceNumber || id} (${target?.supplierName || ''})`);
      setInvoices((prev) => prev.filter((i) => i.id !== id));
      setToastMessage(`Deleted invoice ${target?.invoiceNumber || id}.`);
    }
  };

  const handleConfirmApprove = (id: string, notes: string) => {
    if (!isFinanceDirector) {
      setIsAccessDeniedModalOpen(true);
      return;
    }

    const target = invoices.find((i) => i.id === id);
    pushHistory(`Approved payment for invoice ${target?.invoiceNumber || id}`);

    setInvoices((prev) =>
      prev.map((i) => (i.id === id ? { ...i, paymentStatus: 'Approved' } : i))
    );

    if (target) {
      const now = new Date();
      const formattedDate = now.toLocaleDateString('en-SG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      const formattedTime = now.toLocaleTimeString('en-SG', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      const newLog: AuditLog = {
        id: 'log-' + Date.now(),
        timestamp: `${formattedDate} ${formattedTime}`,
        supplierName: target.supplierName,
        invoiceNumber: target.invoiceNumber,
        action: 'Payment Approved',
        performedBy: 'Madam Lim',
        notes: notes || `Invoice ${target.invoiceNumber} approved for payment release.`
      };
      setLogs((prev) => [newLog, ...prev]);
    }

    setToastMessage('Payment has been successfully approved by Madam Lim.');
  };

  const handleConfirmMarkPaid = (id: string, notes: string) => {
    if (!isFinanceDirector) {
      setIsAccessDeniedModalOpen(true);
      return;
    }

    const target = invoices.find((i) => i.id === id);
    pushHistory(`Marked invoice ${target?.invoiceNumber || id} as Paid`);

    setInvoices((prev) =>
      prev.map((i) => (i.id === id ? { ...i, paymentStatus: 'Paid' } : i))
    );

    if (target) {
      const now = new Date();
      const formattedDate = now.toLocaleDateString('en-SG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      const formattedTime = now.toLocaleTimeString('en-SG', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      const newLog: AuditLog = {
        id: 'log-' + Date.now(),
        timestamp: `${formattedDate} ${formattedTime}`,
        supplierName: target.supplierName,
        invoiceNumber: target.invoiceNumber,
        action: 'Paid',
        performedBy: 'Madam Lim',
        notes: notes || 'Payment settled and marked paid.'
      };
      setLogs((prev) => [newLog, ...prev]);
      setToastMessage(`Invoice ${target.invoiceNumber || ''} for ${target.supplierName} marked as Paid by Madam Lim.`);
    }
  };

  const handleReceiptProcessed = (
    invoiceId: string,
    receipt: PaymentReceipt,
    action: 'Receipt Uploaded' | 'Payment Verified' | 'Marked as Paid'
  ) => {
    const target = invoices.find((i) => i.id === invoiceId);
    if (!target) return;

    setInvoices((prev) =>
      prev.map((i) => (i.id === invoiceId ? { ...i, paymentReceipt: receipt } : i))
    );

    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-SG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    const formattedTime = now.toLocaleTimeString('en-SG', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const actionText =
      action === 'Receipt Uploaded'
        ? 'Receipt Uploaded'
        : action === 'Payment Verified'
        ? 'Payment Verified'
        : 'Marked as Paid';

    const logNote =
      action === 'Receipt Uploaded'
        ? `Uploaded proof of payment receipt #${receipt.receiptNumber} (${receipt.fileName}) for ${target.supplierName}.`
        : action === 'Payment Verified'
        ? `Payment amount SGD ${receipt.amountPaid.toFixed(2)} verified against invoice amount SGD ${(target.amountPayable || 0).toFixed(2)}.`
        : `Marked invoice as Paid with verified receipt #${receipt.receiptNumber}.`;

    const newLog: AuditLog = {
      id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      timestamp: `${formattedDate} ${formattedTime}`,
      supplierName: target.supplierName,
      invoiceNumber: target.invoiceNumber,
      action: actionText as any,
      performedBy: currentUser?.name || 'Madam Lim',
      notes: logNote
    };

    setLogs((prev) => [newLog, ...prev]);
  };

  const handleConfirmMarkPaidWithReceipt = (
    invoiceId: string,
    receipt: PaymentReceipt,
    notes: string
  ) => {
    if (!isFinanceDirector) {
      setIsAccessDeniedModalOpen(true);
      return;
    }

    const target = invoices.find((i) => i.id === invoiceId);
    pushHistory(`Marked invoice ${target?.invoiceNumber || invoiceId} as Paid with receipt`);

    setInvoices((prev) =>
      prev.map((i) =>
        i.id === invoiceId
          ? { ...i, paymentStatus: 'Paid', paymentReceipt: receipt }
          : i
      )
    );

    if (target) {
      const now = new Date();
      const formattedDate = now.toLocaleDateString('en-SG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      const formattedTime = now.toLocaleTimeString('en-SG', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      const newLog: AuditLog = {
        id: 'log-' + Date.now(),
        timestamp: `${formattedDate} ${formattedTime}`,
        supplierName: target.supplierName,
        invoiceNumber: target.invoiceNumber,
        action: 'Marked as Paid',
        performedBy: currentUser?.name || 'Madam Lim',
        notes: notes || `Payment verified and marked paid with receipt #${receipt.receiptNumber}.`
      };
      setLogs((prev) => [newLog, ...prev]);
      setToastMessage(`Invoice ${target.invoiceNumber} marked as Paid by Madam Lim with verified payment receipt.`);
    }
  };

  const handleImportComplete = (
    newInvoices: Invoice[],
    summary: {
      totalImported: number;
      duplicateCount: number;
      invalidCount: number;
      overdueCount: number;
      attentionCount: number;
    },
    auditNote: string
  ) => {
    pushHistory(`Imported ${newInvoices.length} invoices from Excel`);

    setInvoices((prev) => [...newInvoices, ...prev]);

    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-SG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    const formattedTime = now.toLocaleTimeString('en-SG', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const newLog: AuditLog = {
      id: 'log-' + Date.now(),
      timestamp: `${formattedDate} ${formattedTime}`,
      supplierName: `${newInvoices.length} Suppliers`,
      invoiceNumber: `EXCEL-IMPORT-${newInvoices.length}`,
      action: 'Excel Import',
      performedBy: currentUser?.name || 'Madam Lim',
      notes: auditNote
    };

    setLogs((prev) => [newLog, ...prev]);
    setToastMessage(`Import Successful! ${newInvoices.length} invoices added & analyzed.`);
  };

  const handleOpenReminder = (evalItem: InvoiceEvaluation) => {
    setReminderEvaluation(evalItem);
    setIsReminderModalOpen(true);

    const newLog: AuditLog = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toLocaleString('en-SG'),
      supplierName: evalItem.invoice.supplierName,
      invoiceNumber: evalItem.invoice.invoiceNumber,
      action: 'Reminder Generated',
      performedBy: 'Madam Lim Assistant',
      notes: `Generated payment reminder / memo for ${evalItem.invoice.supplierName}.`
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  const handleHeaderOpenReminder = () => {
    const topEval =
      allEvaluations.find(
        (e) =>
          e.invoice.paymentStatus !== 'Paid' &&
          (e.priority === 'High' || e.statusCategory === 'Overdue' || e.statusCategory === 'Due Today')
      ) || allEvaluations.find((e) => e.invoice.paymentStatus !== 'Paid');

    if (topEval) {
      handleOpenReminder(topEval);
    } else {
      setToastMessage('All invoices are currently settled. No pending reminders required.');
    }
  };

  const handleReviewPayment = (evalItem: InvoiceEvaluation) => {
    const newLog: AuditLog = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toLocaleString('en-SG'),
      supplierName: evalItem.invoice.supplierName,
      invoiceNumber: evalItem.invoice.invoiceNumber,
      action: 'Payment Reviewed',
      performedBy: 'Madam Lim',
      notes: `Reviewed payment parameters for ${evalItem.invoice.supplierName}.`
    };
    setLogs((prev) => [newLog, ...prev]);

    setEditingInvoice(evalItem.invoice);
    setIsAddModalOpen(true);
  };

  const handleResetData = () => {
    if (confirm('Reset to initial Boon Huat Hardware supplier records?')) {
      pushHistory('Reset data to initial sample records');
      setInvoices(INITIAL_INVOICES);
      setAsOfDate('2026-08-01');
      setSearchTerm('');
      setStatusFilter('ALL');
      setPriorityFilter('ALL');
      setToastMessage('Reloaded initial sample hardware records.');
    }
  };

  const handleClearAll = () => {
    if (confirm('Clear all invoice records? Total invoices and amounts will become 0 so you can test adding new invoices.')) {
      pushHistory('Cleared all invoice records');
      setInvoices([]);
      setSearchTerm('');
      setStatusFilter('ALL');
      setPriorityFilter('ALL');

      const newLog: AuditLog = {
        id: 'log-' + Date.now(),
        timestamp: new Date().toLocaleString('en-SG'),
        supplierName: 'System',
        invoiceNumber: 'CLEAR_ALL',
        action: 'Cleared All',
        performedBy: 'Madam Lim',
        notes: 'Cleared all invoice records. Invoice list reset to 0.'
      };
      setLogs((prev) => [newLog, ...prev]);
      setToastMessage('Cleared all invoice records.');
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Supplier Name',
      'Invoice Number',
      'Due Date',
      'Days Remaining',
      'Status',
      'Priority',
      'Recommendation',
      'Reason',
      'Amount Payable (SGD)',
      'Payment Status'
    ];

    const rows = allEvaluations.map((e) => {
      const inv = e.invoice;
      return [
        `"${inv.supplierName.replace(/"/g, '""')}"`,
        `"${inv.invoiceNumber.replace(/"/g, '""')}"`,
        `"${inv.dueDate || ''}"`,
        e.daysRemaining !== null ? e.daysRemaining : 'N/A',
        `"${e.statusCategory}"`,
        `"${e.priority}"`,
        `"${e.recommendation.replace(/"/g, '""')}"`,
        `"${e.reason.replace(/"/g, '""')}"`,
        inv.amountPayable !== null ? inv.amountPayable.toFixed(2) : '0.00',
        `"${inv.paymentStatus}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Boon_Huat_AP_Report_${asOfDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans flex flex-col antialiased">
      {/* Header */}
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        asOfDate={asOfDate}
        setAsOfDate={setAsOfDate}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        onOpenAddModal={() => {
          setEditingInvoice(null);
          setIsAddModalOpen(true);
        }}
        onOpenAIScanModal={() => setIsAIScanModalOpen(true)}
        onOpenExcelImportModal={() => setIsExcelImportModalOpen(true)}
        onOpenAuditLogModal={() => setIsAuditModalOpen(true)}
        onResetData={handleResetData}
        onOpenReminderNotification={handleHeaderOpenReminder}
        reminderCount={reminderCount}
        onExportCSV={handleExportCSV}
        onUndo={handleUndo}
        canUndo={historyStack.length > 0}
      />

      {/* Welcome Banner Notification */}
      {welcomeBanner && (
        <div className="bg-blue-600 text-white shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-blue-200 shrink-0" />
              <span>{welcomeBanner}</span>
              <span className="text-blue-200 font-normal hidden sm:inline">
                • Authenticated as <strong>{currentUser.role}</strong>
              </span>
            </div>
            <button
              onClick={() => setWelcomeBanner(null)}
              className="text-blue-200 hover:text-white transition-colors cursor-pointer p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Success Toast Banner with Undo Option */}
      {toastMessage && (
        <div className="bg-emerald-600 text-white shadow-md animate-in fade-in slide-in-from-top-2 duration-200 border-b border-emerald-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2 text-xs sm:text-sm font-extrabold tracking-tight">
              <ShieldCheck className="w-5 h-5 text-emerald-200 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <div className="flex items-center space-x-2">
              {historyStack.length > 0 && (
                <button
                  id="btn-toast-undo"
                  onClick={handleUndo}
                  className="px-3 py-1 bg-white hover:bg-emerald-50 text-emerald-800 font-extrabold text-xs rounded-md shadow-xs flex items-center gap-1 transition-all cursor-pointer border border-emerald-300"
                  title="Undo last action"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Undo Action</span>
                </button>
              )}
              <button
                onClick={() => setToastMessage(null)}
                className="text-emerald-200 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-emerald-700/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 pb-12 space-y-2">
        {/* 1. Executive 4-KPI Cards (Total Invoices, Outstanding Amount, Overdue Invoices, Due Within 7 Days) */}
        <SummaryCards stats={summaryStats} asOfDate={asOfDate} />

        {/* 2. Governance Banner + AI Payment Summary + AI Insights Panel */}
        <AISummarySection
          stats={summaryStats}
          invoices={invoices}
          evaluations={allEvaluations}
        />

        {/* 3. Top Urgent Suppliers Section (Top 5 Priority Suppliers) */}
        <UrgentSuppliersPanel
          evaluations={allEvaluations}
          onApprove={triggerApprove}
          onReview={handleReviewPayment}
          onMarkPaid={triggerMarkPaid}
          onDelete={handleDeleteInvoice}
          isFinanceDirector={isFinanceDirector}
        />

        {/* 4. Primary Invoice Schedule Table */}
        <APResultsTable
          evaluations={filteredEvaluations}
          onApprove={triggerApprove}
          onGenerateReminder={handleOpenReminder}
          onEdit={(evalItem) => {
            setEditingInvoice(evalItem.invoice);
            setIsAddModalOpen(true);
          }}
          onDelete={handleDeleteInvoice}
          onMarkPaid={(id) => triggerMarkPaid(id, 'Marked as paid directly via invoice schedule table.')}
          onUploadReceipt={triggerUploadReceipt}
          onOpenAIScanModal={() => setIsAIScanModalOpen(true)}
          onOpenAddModal={() => {
            setEditingInvoice(null);
            setIsAddModalOpen(true);
          }}
          isFinanceDirector={isFinanceDirector}
        />
      </main>

      {/* Bottom Branding Footer */}
      <footer className="px-8 py-3 bg-white border-t border-slate-100 flex justify-between items-center">
        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold font-mono text-center w-full italic">
          Confidential Finance Portal | Boon Huat Hardware & Supplies Pte Ltd &copy; 2026
        </p>
      </footer>

      {/* Modals */}
      <AddInvoiceModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingInvoice(null);
        }}
        onSave={handleSaveInvoice}
        initialInvoice={editingInvoice}
      />

      <AIInvoiceExtractorModal
        isOpen={isAIScanModalOpen}
        onClose={() => setIsAIScanModalOpen(false)}
        onInvoiceExtracted={handleInvoiceExtracted}
      />

      <ExcelImportModal
        isOpen={isExcelImportModalOpen}
        onClose={() => setIsExcelImportModalOpen(false)}
        existingInvoices={invoices}
        currentUser={currentUser}
        onImportComplete={handleImportComplete}
      />

      <ReminderGeneratorModal
        isOpen={isReminderModalOpen}
        onClose={() => {
          setIsReminderModalOpen(false);
          setReminderEvaluation(null);
        }}
        evaluation={reminderEvaluation}
      />

      <MadamLimApprovalModal
        isOpen={isApprovalModalOpen}
        onClose={() => {
          setIsApprovalModalOpen(false);
          setApprovalEvaluation(null);
        }}
        evaluation={approvalEvaluation}
        onConfirmApprove={handleConfirmApprove}
        onConfirmMarkPaid={handleConfirmMarkPaid}
        onUploadReceipt={triggerUploadReceipt}
        onDelete={handleDeleteInvoice}
      />

      <PaymentReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setReceiptEvaluation(null);
        }}
        evaluation={receiptEvaluation}
        currentUser={currentUser}
        onReceiptProcessed={handleReceiptProcessed}
        onConfirmMarkPaid={handleConfirmMarkPaidWithReceipt}
      />

      <AuditLogModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        logs={logs}
      />

      <AccessDeniedModal
        isOpen={isAccessDeniedModalOpen}
        onClose={() => setIsAccessDeniedModalOpen(false)}
        currentUser={currentUser}
      />
    </div>
  );
}
