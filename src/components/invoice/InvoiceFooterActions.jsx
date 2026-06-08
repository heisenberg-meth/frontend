import { Loader2, Save, FileText, X } from "lucide-react";

export default function InvoiceFooterActions({
  onCancel,
  onSaveDraft,
  onGenerate,
  savingDraft,
  savingInvoice,
  disabled
}) {
  return (
    <div className="invoice-footer">
      <button
        type="button"
        onClick={onCancel}
        disabled={savingDraft || savingInvoice}
        className="btn-cancel border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 hover:border-white/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <X size={16} /> Cancel
      </button>

      <button
        type="button"
        onClick={onSaveDraft}
        disabled={disabled || savingDraft || savingInvoice}
        className="border border-[#3b82f6]/30 bg-[#3b82f6]/10 text-[#3b82f6] hover:bg-[#3b82f6]/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {savingDraft ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Saving...
          </>
        ) : (
          <>
            <Save size={16} /> Save Draft
          </>
        )}
      </button>

      <button
        type="button"
        onClick={onGenerate}
        disabled={disabled || savingDraft || savingInvoice}
        className="btn-generate bg-gradient-to-r from-[#4fdbc8] to-[#0d9488] text-[#0c1321] hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(79,219,200,0.25)] hover:shadow-[0_4px_25px_rgba(79,219,200,0.4)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
      >
        {savingInvoice ? (
          <>
            <Loader2 size={16} className="animate-spin text-[#0c1321]" /> Generating...
          </>
        ) : (
          <>
            <FileText size={16} className="text-[#0c1321]" /> Generate & Save Invoice
          </>
        )}
      </button>
    </div>
  );
}
