import React, { useState } from 'react';
import { InvoiceEvaluation } from '../types';
import { X, Sparkles, Copy, Check, Send, FileText, Loader2, MessageSquare } from 'lucide-react';

interface ReminderGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluation: InvoiceEvaluation | null;
}

export const ReminderGeneratorModal: React.FC<ReminderGeneratorModalProps> = ({
  isOpen,
  onClose,
  evaluation
}) => {
  const [targetAudience, setTargetAudience] = useState<string>('Madam Lim Approval');
  const [tone, setTone] = useState<string>('professional & respectful');
  const [generatedDraft, setGeneratedDraft] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !evaluation) return null;

  const inv = evaluation.invoice;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setCopied(false);
    try {
      const response = await fetch('/api/generate-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice: inv,
          evaluation,
          targetAudience,
          tone
        })
      });

      const data = await response.json();
      if (data.success) {
        setGeneratedDraft(data.message);
      } else {
        setGeneratedDraft('Error generating draft: ' + (data.error || 'Unknown server error.'));
      }
    } catch (err: any) {
      setGeneratedDraft('Error: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (generatedDraft) {
      navigator.clipboard.writeText(generatedDraft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold">AI Payment Communication & Voucher Generator</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 flex flex-wrap justify-between gap-2">
            <div>
              <span className="font-bold text-slate-900">{inv.supplierName}</span>
              <span className="text-slate-400 mx-1">•</span>
              <span className="font-mono bg-slate-200 px-1.5 py-0.5 rounded">{inv.invoiceNumber}</span>
            </div>
            <div>
              <span className="text-slate-500">Due:</span> <strong className="text-slate-900">{inv.dueDate || 'Missing'}</strong>
              <span className="text-slate-400 mx-1">•</span>
              <span className="text-slate-500">Amount:</span> <strong className="text-amber-700 font-mono">SGD {inv.amountPayable ?? 'N/A'}</strong>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Communication Type
              </label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="Madam Lim Approval">Payment Authorization Memo (Madam Lim)</option>
                <option value="Supplier Reminder">Supplier Payment Follow-Up Email/Letter</option>
                <option value="Internal Note">Internal AP Audit Record Note</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Tone
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="professional & respectful">Professional & Respectful</option>
                <option value="urgent & firm">Urgent & Firm (Overdue)</option>
                <option value="courteous & polite">Courteous & Polite</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Draft...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Message Draft</span>
                </>
              )}
            </button>
          </div>

          {generatedDraft && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-amber-600" />
                  Generated Communication Draft:
                </span>
                <button
                  onClick={handleCopy}
                  className="text-xs text-slate-600 hover:text-slate-900 border border-slate-200 px-2.5 py-1 rounded bg-slate-50 flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Draft'}</span>
                </button>
              </div>

              <div className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto border border-slate-800">
                {generatedDraft}
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-slate-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-medium cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
