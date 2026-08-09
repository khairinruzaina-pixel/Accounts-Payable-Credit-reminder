import React, { useState } from 'react';
import { Invoice } from '../types';
import { X, Sparkles, Upload, FileText, Loader2, AlertCircle, FileCode, CheckCircle2 } from 'lucide-react';

interface AIInvoiceExtractorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvoiceExtracted: (extractedInvoices: Invoice | Invoice[]) => void;
}

const SAMPLE_INVOICES = [
  {
    label: '⚡ Sequential Batch: INV-209, INV-210, INV-211',
    text: `BATCH INVOICE DISPATCH - SEQUENTIAL SUPPLIER ORDERS

--- INVOICE 1 ---
Lian Seng Steel Pte Ltd
Invoice No: INV-209
Invoice Date: 2026-07-15
Due Date: 2026-08-04
Items: High Tensile Steel Bars & Mesh (10 Tons)
Category: Structural Steel
Amount Payable: SGD 18,450.00
Terms: Net 20 Days. 1.5% monthly late interest.

--- INVOICE 2 ---
Hock Seng Hardware & Fasteners
Invoice Ref: INV-210
Invoice Date: 2026-06-20
Payment Due: 2026-07-20
Description: Galvanized M12 Bolts, Hex Nuts & Anchor Rods (50 boxes)
Category: Fasteners & Bolts
Total Payable: SGD 4,820.00
Payment Terms: Net 30 Days.

--- INVOICE 3 ---
Sintech Chemical & Paint Coatings Pte Ltd
Invoice No: INV-211
Invoice Date: 2026-07-28
Due Date: 2026-08-27
Deliver To: Boon Huat Hardware Site A
Items: Industrial Anti-Rust Primer & Epoxy Paint (20 Drums)
Category: Paint & Coatings
Amount Due: SGD 7,350.00`
  },
  {
    label: 'Single: Lian Seng Steel (INV-209)',
    text: `INVOICE # INV-209
Lian Seng Steel Pte Ltd
Address: 12 Tuas Avenue 4, Singapore 639010
Date: 2026-07-15
Due Date: 2026-08-04
Items: High Tensile Steel Bars & Mesh (10 Tons)
Category: Structural Steel
Amount Payable: SGD 18,450.00
Terms: Net 20 Days. 1.5% monthly late interest.`
  },
  {
    label: 'Single: Hock Seng (INV-210)',
    text: `INVOICE / TAX INVOICE
Hock Seng Hardware & Fasteners
Invoice Ref: INV-210
Invoice Date: 2026-06-20
Payment Due: 2026-07-20
Description: Galvanized M12 Bolts, Hex Nuts & Anchor Rods (50 boxes)
Category: Fasteners & Bolts
Total Payable SGD: 4,820.00
Payment Terms: Net 30 Days.`
  }
];

interface UploadedFileItem {
  id: string;
  file: File;
  data: string;
  mimeType: string;
}

export const AIInvoiceExtractorModal: React.FC<AIInvoiceExtractorModalProps> = ({
  isOpen,
  onClose,
  onInvoiceExtracted
}) => {
  const [textPrompt, setTextPrompt] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const processFileList = (files: File[]) => {
    if (files.length === 0) return;

    const newPromises = files.map((file) => {
      return new Promise<UploadedFileItem>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const mimeType = file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/png');
          resolve({
            id: 'file-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
            file,
            data: reader.result as string,
            mimeType
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(newPromises).then((results) => {
      setUploadedFiles((prev) => [...prev, ...results]);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files: File[] = Array.from(e.target.files || []);
    processFileList(files);
    e.target.value = ''; // Reset input so same file can be re-selected if needed
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files: File[] = Array.from(e.dataTransfer.files);
      processFileList(files);
    }
  };

  const handleRemoveFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const handleExtract = async () => {
    if (!textPrompt.trim() && uploadedFiles.length === 0) {
      setErrorMessage('Please paste invoice text/email, select a preset sample, or upload/drag invoice document(s).');
      return;
    }

    setIsExtracting(true);
    setErrorMessage(null);

    try {
      const imagesBase64 = uploadedFiles.map((f) => ({
        data: f.data,
        mimeType: f.mimeType
      }));

      const response = await fetch('/api/extract-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textPrompt: textPrompt.trim(),
          imagesBase64
        })
      });

      const result = await response.json();

      if (!result.success || !Array.isArray(result.invoices)) {
        throw new Error(result.error || 'Failed to parse batch invoices using AI.');
      }

      const extractedList: Invoice[] = result.invoices.map((data: any, idx: number) => ({
        id: 'inv-' + Date.now() + '-' + idx,
        supplierName: data.supplierName || 'Unknown Supplier',
        invoiceNumber: data.invoiceNumber || '',
        invoiceDate: data.invoiceDate || '',
        dueDate: data.dueDate || '',
        amountPayable: typeof data.amountPayable === 'number' && !isNaN(data.amountPayable)
          ? data.amountPayable
          : (data.amountPayable ? parseFloat(String(data.amountPayable).replace(/[^0-9.]/g, '')) || null : null),
        paymentStatus: 'Pending Review',
        category: data.category || 'Hardware Supplies',
        notes: data.notes || '',
        missingFields: data.missingFields || []
      }));

      if (extractedList.length === 0) {
        throw new Error('No valid invoice records could be identified in the provided text or files.');
      }

      onInvoiceExtracted(extractedList);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'An error occurred while contacting the AI extraction service.');
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold">AI Invoice Data Extractor</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-xs text-amber-900">
            <div className="font-bold flex items-center gap-1.5 text-amber-900">
              <CheckCircle2 className="w-4 h-4 text-amber-600" />
              <span>Strict Precision Extraction Guarantee</span>
            </div>
            <ul className="list-disc list-inside text-[11px] space-y-0.5 text-amber-800/90 pl-1">
              <li><strong>No Estimation:</strong> Extracts verbatim data without guessing or rounding.</li>
              <li><strong>Exact Invoice #:</strong> Captures printed Invoice Number exactly as shown.</li>
              <li><strong>Grand Total Verification:</strong> Extracts final Grand Total payable (distinguishes subtotal & GST).</li>
              <li><strong>Unclear Values:</strong> Flags unreadable fields as "Unable to determine" for manual review.</li>
            </ul>
          </div>

          {/* Quick Preset Samples */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Quick Test Presets (Click to insert):
            </label>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_INVOICES.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setTextPrompt(sample.text)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold border border-slate-200 transition-all cursor-pointer flex items-center gap-1"
                >
                  <FileText className="w-3 h-3 text-amber-600" />
                  <span>{sample.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Paste Area */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Paste Raw Supplier Invoice Text or Email
            </label>
            <textarea
              rows={5}
              placeholder="Paste raw invoice text or email from supplier here..."
              value={textPrompt}
              onChange={(e) => setTextPrompt(e.target.value)}
              className="w-full text-xs font-mono border border-slate-200 bg-slate-50/50 rounded-xl p-3 focus:bg-white focus:border-slate-400 focus:outline-none transition-all shadow-2xs"
            ></textarea>
          </div>

          {/* File Upload & Drag-and-Drop Area */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Upload or Drag & Drop Multiple Documents (PDF, PNG, JPG)
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-4 text-center transition-all bg-slate-50/50 ${
                isDragging
                  ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-400/30'
                  : 'border-slate-200 hover:border-slate-400'
              }`}
            >
              <input
                type="file"
                id="file-upload"
                accept="image/*,.pdf"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center">
                <Upload className={`w-6 h-6 mb-1 transition-colors ${isDragging ? 'text-amber-600' : 'text-slate-400'}`} />
                <span className="text-xs font-bold text-slate-800">
                  {isDragging
                    ? 'Drop your invoice files here!'
                    : 'Click or drag & drop multiple invoice PDFs or photos here'}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  Select multiple files at once or drop additional files anytime (PNG, JPG, PDF)
                </span>
              </label>
            </div>

            {/* List of Attached Files */}
            {uploadedFiles.length > 0 && (
              <div className="mt-3 space-y-1.5 max-h-36 overflow-y-auto pr-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 px-1">
                  <span>Attached Documents ({uploadedFiles.length}):</span>
                  <button
                    type="button"
                    onClick={() => setUploadedFiles([])}
                    className="text-red-600 hover:underline text-[10px] cursor-pointer"
                  >
                    Clear All Files
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {uploadedFiles.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 bg-slate-100/80 hover:bg-slate-100 rounded-lg border border-slate-200 text-xs transition-all"
                    >
                      <div className="flex items-center space-x-2 min-w-0 pr-1">
                        <FileCode className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="truncate font-medium text-slate-700 text-[11px]" title={item.file.name}>
                          {item.file.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(item.id)}
                        className="text-slate-400 hover:text-red-600 p-0.5 rounded transition-colors cursor-pointer shrink-0"
                        title="Remove file"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isExtracting}
              className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExtract}
              disabled={isExtracting}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition-all flex items-center space-x-2 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Extracting Fields with Gemini AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Extract & Add Record</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

