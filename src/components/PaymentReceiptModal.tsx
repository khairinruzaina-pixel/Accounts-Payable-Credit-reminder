import React, { useState, useRef, useEffect } from 'react';
import { InvoiceEvaluation, PaymentReceipt, User } from '../types';
import { formatCurrency } from '../utils/apEvaluator';
import {
  X,
  Upload,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  FileText,
  Lock,
  RefreshCw,
  Building2,
  Calendar,
  DollarSign,
  Hash
} from 'lucide-react';

interface PaymentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluation: InvoiceEvaluation | null;
  currentUser: User | null;
  onReceiptProcessed: (
    invoiceId: string,
    receipt: PaymentReceipt,
    action: 'Receipt Uploaded' | 'Payment Verified' | 'Marked as Paid'
  ) => void;
  onConfirmMarkPaid: (invoiceId: string, receipt: PaymentReceipt, notes: string) => void;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  isOpen,
  onClose,
  evaluation,
  currentUser,
  onReceiptProcessed,
  onConfirmMarkPaid,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    type: string;
    size: number;
    dataUrl: string;
  } | null>(null);

  const [isExtracting, setIsExtracting] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [amountPaid, setAmountPaid] = useState<number | ''>('');
  const [bankRef, setBankRef] = useState('');
  const [notes, setNotes] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedReceipt, setUploadedReceipt] = useState<PaymentReceipt | null>(null);

  const isFinanceDirector =
    currentUser?.role === 'Finance Director' || currentUser?.username === 'madamlim';

  const inv = evaluation?.invoice;
  const invoiceAmount = inv?.amountPayable ?? 0;

  useEffect(() => {
    if (inv?.paymentReceipt) {
      const r = inv.paymentReceipt;
      setReceiptNumber(r.receiptNumber);
      setPaymentDate(r.paymentDate);
      setAmountPaid(r.amountPaid);
      setBankRef(r.bankRef || '');
      setUploadedReceipt(r);
      setSelectedFile({
        name: r.fileName,
        type: r.fileName.endsWith('.pdf') ? 'application/pdf' : 'image/png',
        size: 1024 * 120,
        dataUrl: r.fileDataUrl || ''
      });
    } else {
      setReceiptNumber('');
      setPaymentDate('');
      setAmountPaid('');
      setBankRef('');
      setSelectedFile(null);
      setUploadedReceipt(null);
    }
  }, [inv]);

  if (!isOpen || !evaluation || !inv) return null;

  const numericAmountPaid = typeof amountPaid === 'number' ? amountPaid : parseFloat(String(amountPaid)) || 0;
  const isMatch = Math.abs(numericAmountPaid - invoiceAmount) < 0.01 && numericAmountPaid > 0;
  const hasUploaded = selectedFile !== null || uploadedReceipt !== null;

  const handleFileUpload = (file: File) => {
    if (!isFinanceDirector) return;

    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|jpg|jpeg|png)$/i)) {
      alert('Invalid file format. Please upload a PDF, JPG, or PNG document.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      const fileObj = {
        name: file.name,
        type: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/png'),
        size: file.size,
        dataUrl
      };
      setSelectedFile(fileObj);

      // Trigger AI extraction
      await processReceiptAI(dataUrl, file.type, file.name);
    };
    reader.readAsDataURL(file);
  };

  const processReceiptAI = async (dataUrl: string, mimeType: string, fileName: string) => {
    setIsExtracting(true);
    try {
      const res = await fetch('/api/extract-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: dataUrl,
          mimeType,
          invoiceAmount
        })
      });

      const data = await res.json();
      if (data.success) {
        setReceiptNumber(data.receiptNumber || `REC-${Date.now().toString().slice(-6)}`);
        setPaymentDate(data.paymentDate || new Date().toISOString().split('T')[0]);
        setAmountPaid(data.amountPaid ?? invoiceAmount);
        setBankRef(data.bankRef || `FAST-${Math.floor(100000 + Math.random() * 900000)}`);

        const extractedAmount = data.amountPaid ?? invoiceAmount;
        const matched = Math.abs(extractedAmount - invoiceAmount) < 0.01;

        const newReceipt: PaymentReceipt = {
          receiptNumber: data.receiptNumber || `REC-${Date.now().toString().slice(-6)}`,
          paymentDate: data.paymentDate || new Date().toISOString().split('T')[0],
          amountPaid: extractedAmount,
          bankRef: data.bankRef || `FAST-${Math.floor(100000 + Math.random() * 900000)}`,
          fileName,
          fileDataUrl: dataUrl,
          verified: matched,
          verificationStatus: matched ? 'Verified' : 'Discrepancy',
          uploadedAt: new Date().toISOString(),
          uploadedBy: currentUser?.name || 'Madam Lim'
        };

        setUploadedReceipt(newReceipt);

        // Record Audit Trail
        onReceiptProcessed(inv.id, newReceipt, 'Receipt Uploaded');
        if (matched) {
          onReceiptProcessed(inv.id, newReceipt, 'Payment Verified');
        }
      }
    } catch (err) {
      console.error('Receipt AI extraction error:', err);
    } finally {
      setIsExtracting(false);
    }
  };

  const loadSampleReceipt = (amount: number, sampleName: string) => {
    if (!isFinanceDirector) return;

    const sampleFile = {
      name: sampleName,
      type: 'image/png',
      size: 154200,
      dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSU5EUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    };
    setSelectedFile(sampleFile);

    const isExactMatch = Math.abs(amount - invoiceAmount) < 0.01;
    const dateStr = new Date().toISOString().split('T')[0];
    const recNo = `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const bRef = `DBS-FAST-${Math.floor(10000000 + Math.random() * 90000000)}`;

    setReceiptNumber(recNo);
    setPaymentDate(dateStr);
    setAmountPaid(amount);
    setBankRef(bRef);

    const newReceipt: PaymentReceipt = {
      receiptNumber: recNo,
      paymentDate: dateStr,
      amountPaid: amount,
      bankRef: bRef,
      fileName: sampleName,
      fileDataUrl: sampleFile.dataUrl,
      verified: isExactMatch,
      verificationStatus: isExactMatch ? 'Verified' : 'Discrepancy',
      uploadedAt: new Date().toISOString(),
      uploadedBy: currentUser?.name || 'Madam Lim'
    };

    setUploadedReceipt(newReceipt);

    // Record Audit Trail
    onReceiptProcessed(inv.id, newReceipt, 'Receipt Uploaded');
    if (isExactMatch) {
      onReceiptProcessed(inv.id, newReceipt, 'Payment Verified');
    }
  };

  const handleMarkAsPaid = () => {
    if (!isFinanceDirector || !isMatch || !hasUploaded) return;

    const finalReceipt: PaymentReceipt = {
      receiptNumber: receiptNumber || `REC-${Date.now().toString().slice(-6)}`,
      paymentDate: paymentDate || new Date().toISOString().split('T')[0],
      amountPaid: numericAmountPaid,
      bankRef: bankRef || 'FAST-TRANSFER',
      fileName: selectedFile?.name || 'payment_receipt.pdf',
      fileDataUrl: selectedFile?.dataUrl || '',
      verified: true,
      verificationStatus: 'Verified',
      uploadedAt: new Date().toISOString(),
      uploadedBy: currentUser?.name || 'Madam Lim'
    };

    onConfirmMarkPaid(
      inv.id,
      finalReceipt,
      notes || `Payment verified via receipt ${finalReceipt.receiptNumber} (${finalReceipt.bankRef}). Marked as Paid by Madam Lim.`
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
              <FileCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Proof of Payment & Verification</h3>
              <p className="text-[11px] text-slate-400">Upload receipt document to verify & authorize settlement</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Authorization Alert Banner if Not Madam Lim */}
          {!isFinanceDirector && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-900">
              <Lock className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Role Access Restricted</strong>
                <p className="text-[11px] text-red-800 leading-relaxed mt-0.5">
                  Only Madam Lim (Finance Director) can upload the final payment receipt and mark invoices as Paid.
                </p>
              </div>
            </div>
          )}

          {/* Invoice Summary Card */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                Supplier:
              </span>
              <span className="font-bold text-slate-900">{inv.supplierName}</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-slate-400" />
                Invoice Number:
              </span>
              <span className="font-mono font-bold text-slate-900">{inv.invoiceNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                Total Amount Payable:
              </span>
              <span className="font-mono text-sm font-extrabold text-amber-700">
                {formatCurrency(invoiceAmount)}
              </span>
            </div>
          </div>

          {/* Step 1: Upload Area */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              1. Upload Payment Receipt (PDF, JPG, PNG)
            </label>

            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />

            <div
              onDragOver={(e) => {
                e.preventDefault();
                if (isFinanceDirector) setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleFileUpload(file);
              }}
              onClick={() => {
                if (isFinanceDirector) fileInputRef.current?.click();
              }}
              className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer ${
                !isFinanceDirector
                  ? 'bg-slate-100 border-slate-300 opacity-60 cursor-not-allowed'
                  : isDragOver
                  ? 'border-blue-500 bg-blue-50/80 scale-[1.01]'
                  : selectedFile
                  ? 'border-emerald-400 bg-emerald-50/40'
                  : 'border-slate-300 bg-slate-50/50 hover:bg-slate-100/70 hover:border-slate-400'
              }`}
            >
              {selectedFile ? (
                <div className="flex items-center justify-between text-left">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 truncate max-w-xs">
                        {selectedFile.name}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type}
                      </p>
                    </div>
                  </div>
                  {isFinanceDirector && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-[11px] font-bold rounded-lg transition-all"
                    >
                      Change File
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto border border-blue-100">
                    <Upload className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Click to upload receipt or drag & drop file here
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Supports PDF, JPG, or PNG payment vouchers & FAST transfer slips
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Demo Sample Buttons */}
            {isFinanceDirector && (
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider self-center">
                  Quick Demo:
                </span>
                <button
                  type="button"
                  onClick={() => loadSampleReceipt(invoiceAmount, `Payment_Receipt_${inv.invoiceNumber}.png`)}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Matching Receipt (SGD {invoiceAmount.toFixed(2)})</span>
                </button>

                <button
                  type="button"
                  onClick={() => loadSampleReceipt(invoiceAmount > 100 ? invoiceAmount - 100 : 50, `Partial_Receipt_${inv.invoiceNumber}.png`)}
                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  <span>Mismatched Receipt (SGD {(invoiceAmount > 100 ? invoiceAmount - 100 : 50).toFixed(2)})</span>
                </button>
              </div>
            )}
          </div>

          {/* AI Extracting Spinner Indicator */}
          {isExtracting && (
            <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center justify-center gap-3 text-xs text-blue-800 font-bold animate-pulse">
              <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
              <span>Analyzing receipt & extracting payment details with Gemini AI...</span>
            </div>
          )}

          {/* Step 2: Extracted Fields Form */}
          {hasUploaded && !isExtracting && (
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  2. Extracted Receipt Details
                </label>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-blue-600" />
                  Gemini AI Extracted
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Receipt Number */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Receipt Number / Voucher #
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!isFinanceDirector}
                    value={receiptNumber}
                    onChange={(e) => setReceiptNumber(e.target.value)}
                    placeholder="e.g. REC-98412"
                    className="w-full text-xs font-mono font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>

                {/* Payment Date */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    required
                    disabled={!isFinanceDirector}
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>

                {/* Amount Paid */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Amount Paid (SGD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    disabled={!isFinanceDirector}
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="0.00"
                    className="w-full text-xs font-mono font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900"
                  />
                </div>

                {/* Bank Ref */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Bank Reference Number (Optional)
                  </label>
                  <input
                    type="text"
                    disabled={!isFinanceDirector}
                    value={bankRef}
                    onChange={(e) => setBankRef(e.target.value)}
                    placeholder="e.g. DBS-FAST-981240"
                    className="w-full text-xs font-mono font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* Step 3: Verification Result Box */}
              <div className="pt-2">
                {isMatch ? (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl space-y-1 text-xs text-emerald-950">
                    <div className="font-extrabold flex items-center gap-1.5 text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Payment Verified</span>
                    </div>
                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                      Extracted payment amount (SGD {numericAmountPaid.toFixed(2)}) matches the invoice payable amount (SGD {invoiceAmount.toFixed(2)}). You may now safely mark this invoice as Paid.
                    </p>
                  </div>
                ) : (
                  <div className="p-3.5 bg-red-50 border border-red-300 rounded-xl space-y-1 text-xs text-red-950">
                    <div className="font-extrabold flex items-center gap-1.5 text-red-800">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span>Warning: Payment amount does not match the invoice amount. Please review before proceeding.</span>
                    </div>
                    <p className="text-[11px] text-red-800 leading-relaxed font-semibold">
                      Invoice Payable: SGD {invoiceAmount.toFixed(2)} | Receipt Amount Paid: SGD {numericAmountPaid.toFixed(2)} (Difference: SGD {(numericAmountPaid - invoiceAmount).toFixed(2)})
                    </p>
                    <p className="text-[10px] text-red-700 italic">
                      The "Mark as Paid" button remains disabled until the payment discrepancy is resolved.
                    </p>
                  </div>
                )}
              </div>

              {/* Madam Lim Authorization Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Madam Lim Settlement Notes
                </label>
                <textarea
                  rows={2}
                  disabled={!isFinanceDirector}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Receipt verified against bank transaction record. Approved by Madam Lim."
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-600 focus:bg-white"
                ></textarea>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              disabled={!isFinanceDirector || !isMatch || !hasUploaded || isExtracting}
              onClick={handleMarkAsPaid}
              className={`px-5 py-2.5 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-sm ${
                isFinanceDirector && isMatch && hasUploaded && !isExtracting
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-95'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
              }`}
              title={
                !isFinanceDirector
                  ? 'Only Madam Lim can mark as Paid'
                  : !hasUploaded
                  ? 'Please upload proof of payment receipt first'
                  : !isMatch
                  ? 'Payment amount must match invoice amount before marking as Paid'
                  : 'Mark as Paid'
              }
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark as Paid</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
