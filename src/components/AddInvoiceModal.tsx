import React, { useState, useEffect } from 'react';
import { Invoice, PaymentStatus } from '../types';
import { X, Save, AlertCircle } from 'lucide-react';

interface AddInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (invoice: Invoice) => void;
  initialInvoice?: Invoice | null;
}

export const AddInvoiceModal: React.FC<AddInvoiceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialInvoice
}) => {
  const [supplierName, setSupplierName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [amountPayable, setAmountPayable] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Pending Review');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialInvoice) {
      setSupplierName(initialInvoice.supplierName || '');
      setInvoiceNumber(initialInvoice.invoiceNumber || '');
      setInvoiceDate(initialInvoice.invoiceDate || '');
      setDueDate(initialInvoice.dueDate || '');
      setAmountPayable(
        initialInvoice.amountPayable !== null && initialInvoice.amountPayable !== undefined
          ? String(initialInvoice.amountPayable)
          : ''
      );
      setPaymentStatus(initialInvoice.paymentStatus || 'Pending Review');
      setCategory(initialInvoice.category || '');
      setNotes(initialInvoice.notes || '');
    } else {
      setSupplierName('');
      setInvoiceNumber('');
      setInvoiceDate('');
      setDueDate('');
      setAmountPayable('');
      setPaymentStatus('Pending Review');
      setCategory('');
      setNotes('');
    }
  }, [initialInvoice, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = amountPayable.trim() !== '' ? parseFloat(amountPayable) : null;

    const newInvoice: Invoice = {
      id: initialInvoice ? initialInvoice.id : 'inv-' + Date.now(),
      supplierName: supplierName.trim(),
      invoiceNumber: invoiceNumber.trim(),
      invoiceDate: invoiceDate,
      dueDate: dueDate,
      amountPayable: parsedAmount !== null && !isNaN(parsedAmount) ? parsedAmount : null,
      paymentStatus: paymentStatus,
      category: category.trim(),
      notes: notes.trim()
    };

    onSave(newInvoice);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <h3 className="text-lg font-bold">
            {initialInvoice ? 'Edit Invoice Record' : 'Add New Hardware Supplier Invoice'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Supplier Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Lian Seng Steel Pte Ltd"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Invoice Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. INV-2026-8801"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Amount Payable (SGD)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 14500.00"
                value={amountPayable}
                onChange={(e) => setAmountPayable(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Invoice Date
              </label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Payment Status
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="Pending Review">Pending Review</option>
                <option value="Approved">Approved by Madam Lim</option>
                <option value="Paid">Paid</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Category
              </label>
              <input
                type="text"
                placeholder="e.g. Structural Steel"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Notes / Terms
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Net 30 days, early payment discount, delivery verified..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            ></textarea>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-sm font-medium transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-sm transition-all flex items-center space-x-1.5 cursor-pointer shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>Save Record</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
