import { Percent, Receipt } from "lucide-react";

export default function InvoiceSummaryCard({
  subtotal,
  discount,
  setDiscount,
  tax,
  grandTotal
}) {
  const cgst = tax / 2;
  const sgst = tax / 2;

  return (
    <div className="summary-card shadow-lg backdrop-blur-md">
      <h3 className="text-md font-semibold text-white flex items-center gap-2 border-b border-white/5 pb-4">
        <Receipt size={18} className="text-[#4fdbc8]" /> Invoice Summary
      </h3>

      <div className="space-y-3 text-sm">
        {/* Subtotal */}
        <div className="flex justify-between text-slate-400">
          <span>Subtotal</span>
          <span className="font-semibold text-slate-200">₹{subtotal.toFixed(2)}</span>
        </div>

        {/* CGST */}
        <div className="flex justify-between text-slate-400">
          <span>CGST</span>
          <span className="font-semibold text-slate-200">₹{cgst.toFixed(2)}</span>
        </div>

        {/* SGST */}
        <div className="flex justify-between text-slate-400">
          <span>SGST</span>
          <span className="font-semibold text-slate-200">₹{sgst.toFixed(2)}</span>
        </div>

        {/* Discount Input */}
        <div className="flex items-center justify-between gap-4 py-2 border-y border-white/5">
          <span className="text-slate-400 flex items-center gap-1">
            <Percent size={14} className="text-[#4fdbc8]" /> Discount (%)
          </span>
          <div className="relative w-24">
            <input
              type="number"
              min="0"
              max="100"
              value={discount || ""}
              onChange={(e) => {
                const val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                setDiscount(val);
              }}
              className="w-full px-2 py-1 bg-slate-900 border border-white/10 rounded text-right text-sm text-slate-200 focus:outline-none focus:border-[#4fdbc8]"
              placeholder="0"
            />
          </div>
        </div>

        {/* Grand Total */}
        <div className="flex justify-between items-center pt-3">
          <span className="text-md font-semibold text-white">Grand Total</span>
          <span className="text-3xl font-bold text-[#4fdbc8] drop-shadow-[0_0_8px_rgba(79,219,200,0.2)]">
            ₹{grandTotal.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
