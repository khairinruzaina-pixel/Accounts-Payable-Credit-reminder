import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Invoice, InvoiceEvaluation, User } from '../types';
import { evaluateInvoice, formatCurrency } from '../utils/apEvaluator';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  FileText,
  Sparkles,
  ArrowRight,
  Database,
  Info,
  Layers,
  Check
} from 'lucide-react';

interface ParsedRow {
  rowNum: number;
  supplierName: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  amountPayable: number | null;
  paymentStatus: 'Pending Review' | 'Approved' | 'Paid' | 'On Hold';
  errors: string[];
  warnings: string[];
  isDuplicateInFile: boolean;
  isDuplicateInSystem: boolean;
  isValid: boolean;
  raw: Record<string, any>;
}

interface ImportSummary {
  totalImported: number;
  duplicateCount: number;
  invalidCount: number;
  overdueCount: number;
  attentionCount: number;
}

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingInvoices: Invoice[];
  currentUser: User | null;
  onImportComplete: (
    newInvoices: Invoice[],
    summary: ImportSummary,
    auditLogNote: string
  ) => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  existingInvoices,
  currentUser,
  onImportComplete
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'valid' | 'errors'>('all');
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [importStep, setImportStep] = useState<'upload' | 'preview' | 'summary'>('upload');
  const [summaryData, setSummaryData] = useState<ImportSummary | null>(null);

  if (!isOpen) return null;

  const existingNumberSet = new Set(
    existingInvoices.map((inv) => inv.invoiceNumber.trim().toUpperCase())
  );

  // Date Parsing Helper
  const parseDateToYYYYMMDD = (val: any): string | null => {
    if (!val) return null;

    if (val instanceof Date && !isNaN(val.getTime())) {
      return val.toISOString().split('T')[0];
    }

    if (typeof val === 'number') {
      // Excel serial date integer (e.g. 46238)
      try {
        const dateObj = XLSX.SSF.parse_date_code(val);
        if (dateObj) {
          const y = dateObj.y;
          const m = String(dateObj.m).padStart(2, '0');
          const d = String(dateObj.d).padStart(2, '0');
          return `${y}-${m}-${d}`;
        }
      } catch {
        // Fallback calculation
        const dateObj = new Date(Math.round((val - 25569) * 86400 * 1000));
        if (!isNaN(dateObj.getTime())) {
          return dateObj.toISOString().split('T')[0];
        }
      }
    }

    const str = String(val).trim();
    if (!str) return null;

    // Standard YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      return str;
    }

    // DD/MM/YYYY or MM/DD/YYYY or DD-MM-YYYY
    const parts = str.split(/[-/.]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY/MM/DD
        const y = parts[0];
        const m = parts[1].padStart(2, '0');
        const d = parts[2].padStart(2, '0');
        return `${y}-${m}-${d}`;
      } else if (parts[2].length === 4) {
        // DD/MM/YYYY
        const d = parts[0].padStart(2, '0');
        const m = parts[1].padStart(2, '0');
        const y = parts[2];
        return `${y}-${m}-${d}`;
      }
    }

    // JS Date parse fallback
    const dObj = new Date(str);
    if (!isNaN(dObj.getTime())) {
      return dObj.toISOString().split('T')[0];
    }

    return null;
  };

  // Find object key matching fuzzy column names
  const findColumnValue = (row: Record<string, any>, candidates: string[]): any => {
    const keys = Object.keys(row);
    for (const key of keys) {
      const normalizedKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      for (const cand of candidates) {
        const normalizedCand = cand.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        if (normalizedKey === normalizedCand || normalizedKey.includes(normalizedCand)) {
          return row[key];
        }
      }
    }
    return undefined;
  };

  // File Upload & Spreadsheet Parsing
  const handleFileUpload = (file: File) => {
    setSelectedFile(file);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        const workbook = XLSX.read(buffer, { type: 'binary', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const jsonRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, {
          defval: ''
        });

        if (jsonRows.length === 0) {
          alert('The uploaded spreadsheet contains no data rows.');
          setIsProcessing(false);
          return;
        }

        const seenInFile = new Set<string>();
        const parsed: ParsedRow[] = [];

        jsonRows.forEach((row, idx) => {
          const rowNum = idx + 2; // Row 1 is header

          // Key candidates mapping
          const rawSupplier = findColumnValue(row, [
            'supplier name',
            'supplier',
            'vendor name',
            'vendor',
            'company'
          ]);
          const rawInvNum = findColumnValue(row, [
            'invoice number',
            'invoice #',
            'invoice no',
            'inv num',
            'invoice_num',
            'inv_no',
            'ref'
          ]);
          const rawInvDate = findColumnValue(row, [
            'invoice date',
            'inv date',
            'issue date',
            'date'
          ]);
          const rawDueDate = findColumnValue(row, [
            'due date',
            'payment due date',
            'due',
            'payment due'
          ]);
          const rawAmount = findColumnValue(row, [
            'amount payable',
            'amount',
            'total amount',
            'total payable',
            'sgd',
            'total',
            'value'
          ]);
          const rawStatus = findColumnValue(row, [
            'payment status',
            'status',
            'payment'
          ]);

          const supplierName = String(rawSupplier || '').trim();
          const invoiceNumber = String(rawInvNum || '').trim();
          const invoiceDateStr = parseDateToYYYYMMDD(rawInvDate) || '2026-08-01';
          const dueDateStr = parseDateToYYYYMMDD(rawDueDate);
          
          let amountPayable: number | null = null;
          if (rawAmount !== undefined && rawAmount !== '' && rawAmount !== null) {
            const parsedAmt = typeof rawAmount === 'number' ? rawAmount : parseFloat(String(rawAmount).replace(/[^0-9.-]+/g, ''));
            if (!isNaN(parsedAmt)) {
              amountPayable = Math.round(parsedAmt * 100) / 100;
            }
          }

          let paymentStatus: 'Pending Review' | 'Approved' | 'Paid' | 'On Hold' = 'Pending Review';
          if (rawStatus) {
            const st = String(rawStatus).toLowerCase();
            if (st.includes('paid')) paymentStatus = 'Paid';
            else if (st.includes('approve')) paymentStatus = 'Approved';
            else if (st.includes('hold')) paymentStatus = 'On Hold';
          }

          // Validation logic
          const errors: string[] = [];
          const warnings: string[] = [];

          if (!supplierName) {
            errors.push('Missing Supplier Name');
          }

          if (!invoiceNumber) {
            errors.push('Missing Invoice Number');
          }

          if (!dueDateStr) {
            if (!rawDueDate) {
              errors.push('Missing Due Date');
            } else {
              errors.push('Invalid Due Date format');
            }
          }

          if (amountPayable === null || amountPayable <= 0) {
            warnings.push('Missing or zero amount payable');
          }

          // Check Duplicates
          const upperInv = invoiceNumber.toUpperCase();
          let isDuplicateInFile = false;
          let isDuplicateInSystem = false;

          if (invoiceNumber) {
            if (seenInFile.has(upperInv)) {
              isDuplicateInFile = true;
              errors.push('Duplicate Invoice Number in file');
            } else {
              seenInFile.add(upperInv);
            }

            if (existingNumberSet.has(upperInv)) {
              isDuplicateInSystem = true;
              errors.push('Duplicate Invoice Number (already exists in system)');
            }
          }

          const isValid = errors.length === 0;

          parsed.push({
            rowNum,
            supplierName,
            invoiceNumber,
            invoiceDate: invoiceDateStr,
            dueDate: dueDateStr || '',
            amountPayable,
            paymentStatus,
            errors,
            warnings,
            isDuplicateInFile,
            isDuplicateInSystem,
            isValid,
            raw: row
          });
        });

        setParsedRows(parsed);
        setImportStep('preview');
      } catch (err) {
        console.error('Error parsing excel:', err);
        alert('Failed to parse Excel file. Please ensure it is a valid .xlsx, .xls, or .csv document.');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  // Download Sample Excel Template
  const handleDownloadSample = () => {
    const sampleData = [
      {
        'Supplier Name': 'Kian Ann Hardware Pte Ltd',
        'Invoice Number': 'KA-2026-8841',
        'Invoice Date': '2026-07-15',
        'Due Date': '2026-08-03',
        'Amount': 18450.00,
        'Payment Status': 'Pending Review'
      },
      {
        'Supplier Name': 'Soon Bee Metal & Fasteners',
        'Invoice Number': 'SBM-99214',
        'Invoice Date': '2026-07-20',
        'Due Date': '2026-08-04',
        'Amount': 6200.50,
        'Payment Status': 'Pending Review'
      },
      {
        'Supplier Name': 'Singapore Steel Traders Co',
        'Invoice Number': 'SST-44120',
        'Invoice Date': '2026-07-22',
        'Due Date': '2026-08-06',
        'Amount': 14800.00,
        'Payment Status': 'Approved'
      },
      {
        'Supplier Name': 'Eng Moh Building Materials',
        'Invoice Number': 'EM-33109',
        'Invoice Date': '2026-07-25',
        'Due Date': '2026-08-10',
        'Amount': 3420.00,
        'Payment Status': 'Pending Review'
      },
      {
        'Supplier Name': 'Chuan Heng Tool & Hardware',
        'Invoice Number': 'CH-10029',
        'Invoice Date': '2026-07-28',
        'Due Date': '2026-08-15',
        'Amount': 9580.75,
        'Payment Status': 'Pending Review'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'AP Invoices');
    XLSX.writeFile(workbook, 'Boon_Huat_AP_Invoices_Sample.xlsx');
  };

  // Execute Import
  const handleConfirmImport = () => {
    const rowsToImport = parsedRows.filter((r) => {
      if (!r.isValid) return false;
      if (skipDuplicates && (r.isDuplicateInFile || r.isDuplicateInSystem)) return false;
      return true;
    });

    if (rowsToImport.length === 0) {
      alert('No valid records to import.');
      return;
    }

    const newInvoices: Invoice[] = rowsToImport.map((r, idx) => ({
      id: `inv-imp-${Date.now()}-${idx}`,
      supplierName: r.supplierName,
      invoiceNumber: r.invoiceNumber,
      invoiceDate: r.invoiceDate,
      dueDate: r.dueDate,
      amountPayable: r.amountPayable,
      paymentStatus: r.paymentStatus,
      category: 'Excel Import',
      notes: `Imported from Excel file (${selectedFile?.name || 'spreadsheet.xlsx'}).`
    }));

    // AI Evaluation calculation on all imported invoices
    const asOfDate = '2026-08-04';
    let overdueCount = 0;
    let attentionCount = 0;

    newInvoices.forEach((inv) => {
      const evaluation: InvoiceEvaluation = evaluateInvoice(inv, asOfDate);
      if (evaluation.statusCategory === 'Overdue') {
        overdueCount++;
        attentionCount++;
      } else if (
        evaluation.statusCategory === 'Due Today' ||
        evaluation.statusCategory === 'Due within 3 Days'
      ) {
        attentionCount++;
      }
    });

    const duplicateCount = parsedRows.filter(
      (r) => r.isDuplicateInFile || r.isDuplicateInSystem
    ).length;
    const invalidCount = parsedRows.filter((r) => !r.isValid && !r.isDuplicateInFile && !r.isDuplicateInSystem).length;

    const summary: ImportSummary = {
      totalImported: newInvoices.length,
      duplicateCount,
      invalidCount,
      overdueCount,
      attentionCount
    };

    setSummaryData(summary);
    setImportStep('summary');

    // Trigger parent callback
    const auditNote = `Imported ${newInvoices.length} invoices from ${selectedFile?.name || 'Excel'}. (Duplicates skipped: ${duplicateCount}, Invalid skipped: ${invalidCount}, Overdue detected: ${overdueCount}).`;
    onImportComplete(newInvoices, summary, auditNote);
  };

  // Stats Counters
  const totalRowsCount = parsedRows.length;
  const duplicateRowsCount = parsedRows.filter((r) => r.isDuplicateInFile || r.isDuplicateInSystem).length;
  const invalidRowsCount = parsedRows.filter((r) => r.errors.length > 0 && !r.isDuplicateInFile && !r.isDuplicateInSystem).length;
  const validRowsCount = parsedRows.filter((r) => r.isValid).length;

  const filteredRows = parsedRows.filter((r) => {
    if (filterTab === 'valid') return r.isValid;
    if (filterTab === 'errors') return !r.isValid;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Import Invoices from Excel / CSV
              </h3>
              <p className="text-[11px] text-slate-400">
                Bulk import supplier invoices from .xlsx, .xls, or .csv spreadsheets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content depending on Step */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* STEP 1: FILE UPLOAD */}
          {importStep === 'upload' && (
            <div className="space-y-6">
              {/* Instructions Banner */}
              <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl space-y-2 text-xs text-blue-900">
                <div className="flex items-center space-x-2 font-bold text-blue-900">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Automatic Spreadsheet Reader & AI Validator</span>
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Upload your invoice register file. The system automatically maps standard headers: 
                  <span className="font-semibold text-blue-950"> Supplier Name, Invoice Number, Invoice Date, Due Date, Amount, Payment Status</span>.
                </p>
              </div>

              {/* Upload Drop Zone */}
              <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/60 hover:bg-emerald-50/30 rounded-2xl p-10 text-center transition-all cursor-pointer group"
              >
                <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-emerald-200 group-hover:scale-105 transition-all shadow-sm">
                  <Upload className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  Click to select file or drag & drop spreadsheet here
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv) formats
                </p>
              </div>

              {/* Download Sample File Option */}
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block">Need a template format?</span>
                    <span className="text-[11px] text-slate-500">
                      Download our pre-formatted Boon Huat AP sample Excel spreadsheet.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadSample}
                  className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Download Sample (.xlsx)</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PREVIEW & VALIDATION TABLE */}
          {importStep === 'preview' && (
            <div className="space-y-4">
              {/* Stats Bar */}
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Total Records
                  </span>
                  <span className="text-lg font-extrabold text-slate-900">{totalRowsCount}</span>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                    Valid Records
                  </span>
                  <span className="text-lg font-extrabold text-emerald-800">{validRowsCount}</span>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                    Duplicates
                  </span>
                  <span className="text-lg font-extrabold text-amber-800">{duplicateRowsCount}</span>
                </div>
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider block">
                    Invalid Records
                  </span>
                  <span className="text-lg font-extrabold text-red-800">{invalidRowsCount}</span>
                </div>
              </div>

              {/* Filter Tabs & Import Options */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setFilterTab('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      filterTab === 'all'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All Records ({totalRowsCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterTab('valid')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      filterTab === 'valid'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Valid Only ({validRowsCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterTab('errors')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      filterTab === 'errors'
                        ? 'bg-white text-red-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Errors / Duplicates ({duplicateRowsCount + invalidRowsCount})
                  </button>
                </div>

                <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={skipDuplicates}
                    onChange={(e) => setSkipDuplicates(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <span>Automatically skip duplicate invoices</span>
                </label>
              </div>

              {/* Records Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold tracking-wider sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="p-3">Row</th>
                      <th className="p-3">Invoice #</th>
                      <th className="p-3">Supplier Name</th>
                      <th className="p-3">Due Date</th>
                      <th className="p-3 text-right">Amount</th>
                      <th className="p-3">Validation Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {filteredRows.map((row) => (
                      <tr
                        key={row.rowNum}
                        className={
                          !row.isValid
                            ? 'bg-red-50/40 hover:bg-red-50'
                            : row.warnings.length > 0
                            ? 'bg-amber-50/30 hover:bg-amber-50'
                            : 'hover:bg-slate-50'
                        }
                      >
                        <td className="p-3 font-mono text-slate-400 text-[11px]">{row.rowNum}</td>
                        <td className="p-3 font-mono font-bold text-slate-900">
                          {row.invoiceNumber || <span className="text-red-500 italic">(Missing)</span>}
                        </td>
                        <td className="p-3 font-medium text-slate-800">
                          {row.supplierName || <span className="text-red-500 italic">(Missing)</span>}
                        </td>
                        <td className="p-3 font-mono text-slate-700">
                          {row.dueDate || <span className="text-red-500 italic">(Missing)</span>}
                        </td>
                        <td className="p-3 font-mono font-bold text-right text-slate-900">
                          {formatCurrency(row.amountPayable)}
                        </td>
                        <td className="p-3">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Valid
                            </span>
                          ) : (
                            <div className="space-y-0.5">
                              {row.errors.map((err, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-red-800 bg-red-100 px-2 py-0.5 rounded-full border border-red-300 mr-1"
                                >
                                  <XCircle className="w-3 h-3 text-red-600" />
                                  {err}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 3: SUMMARY DISPLAY (Exact requirement match) */}
          {importStep === 'summary' && summaryData && (
            <div className="space-y-6 text-center py-4 max-w-lg mx-auto">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-50 shadow-inner">
                <CheckCircle2 className="w-9 h-9 text-emerald-600" />
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-slate-900">Import Successful</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Invoices imported & analyzed by AI Accounts Payable rules
                </p>
              </div>

              {/* Exact summary metrics panel */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left space-y-3 font-semibold text-xs text-slate-700 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-600">Total records imported:</span>
                  <span className="font-extrabold text-sm text-emerald-700 font-mono">
                    {summaryData.totalImported}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-600">Duplicate invoices:</span>
                  <span className="font-extrabold text-sm text-amber-700 font-mono">
                    {summaryData.duplicateCount}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-600">Invalid records:</span>
                  <span className="font-extrabold text-sm text-red-700 font-mono">
                    {summaryData.invalidCount}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-600">Overdue invoices:</span>
                  <span className="font-extrabold text-sm text-red-600 font-mono">
                    {summaryData.overdueCount}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Invoices requiring attention:</span>
                  <span className="font-extrabold text-sm text-amber-800 font-mono">
                    {summaryData.attentionCount}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-left text-xs text-blue-900 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <strong>AI Analysis Triggered:</strong> Overdue and upcoming invoices have been prioritized, the dashboard summary stats recalculated, and Urgent Suppliers list updated automatically.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          {importStep === 'preview' ? (
            <button
              type="button"
              onClick={() => {
                setImportStep('upload');
                setSelectedFile(null);
                setParsedRows([]);
              }}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              Re-select File
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              Close
            </button>
          )}

          {importStep === 'preview' && (
            <button
              type="button"
              onClick={handleConfirmImport}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
            >
              <span>
                Import Valid Invoices ({validRowsCount})
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {importStep === 'summary' && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-sm active:scale-95"
            >
              Done & View Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
