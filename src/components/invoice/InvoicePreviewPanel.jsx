import { Eye, FileText, HeartHandshake } from "lucide-react";

export default function InvoicePreviewPanel({
  patient,
  doctorName,
  lineItems,
  subtotal,
  discount,
  tax,
  grandTotal,
  paymentMode,
  isWalkIn
}) {
  const cgst = tax / 2;
  const sgst = tax / 2;
  const discountAmount = subtotal * (discount / 100);

  const todayStr = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

  return (
    <div className="invoice-preview-wrapper">
      <div className="preview-card">
        <h3 className="text-md font-semibold text-white flex items-center gap-2 border-b border-white/5 pb-4 mb-5">
          <Eye size={18} className="text-[#4fdbc8]" /> Live Preview
        </h3>

      {/* Printable Receipt White Card Container */}
      <div className="invoice-preview relative flex flex-col justify-between font-sans">
        
        {/* Top Header */}
        <div>
          <div className="text-center border-b border-dashed border-slate-300 pb-4 mb-4">
            <h2 className="text-xl font-extrabold tracking-tight text-slate-800 flex justify-center items-center gap-1.5">
              <FileText className="text-emerald-600" size={20} />
              VIYAN MEDASSIST
            </h2>
            <p className="text-[10px] text-slate-500 mt-1 font-medium leading-relaxed">
              123, Healthcare Street, Medical Hub, Bangalore<br />
              GSTIN: 29ABCDE1234F1Z1 | Ph: +91 98765 43210
            </p>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[11px] border-b border-slate-200 pb-3 mb-3 text-slate-600">
            <div>
              <span className="font-semibold text-slate-800">Bill Date:</span> {todayStr}
            </div>
            <div>
              <span className="font-semibold text-slate-800">Bill Number:</span> <span className="font-mono text-slate-500">INV-PREVIEW</span>
            </div>
            <div>
              <span className="font-semibold text-slate-800">Customer:</span> {isWalkIn ? "Walk-in Customer" : patient.name || "N/A"}
            </div>
            {patient.phone && !isWalkIn && (
              <div>
                <span className="font-semibold text-slate-800">Contact:</span> {patient.phone}
              </div>
            )}
            {doctorName && (
              <div className="col-span-2">
                <span className="font-semibold text-slate-800">Prescribed By:</span> Dr. {doctorName}
              </div>
            )}
          </div>

          {/* Items Table */}
          <table className="w-full text-left text-[11px] mb-4">
            <thead>
              <tr className="border-b-2 border-slate-300 text-slate-800 font-bold">
                <th className="py-1.5">Medicine</th>
                <th className="py-1.5 text-center">Qty</th>
                <th className="py-1.5 text-right">MRP</th>
                <th className="py-1.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-6 text-slate-400 italic">
                    Add medicines to populate receipt
                  </td>
                </tr>
              ) : (
                lineItems.map((item, idx) => (
                  <tr key={`${item.id}-${item.batchId}-${idx}`} className="border-b border-slate-100 text-slate-700">
                    <td className="py-1.5">
                      <div className="font-semibold text-slate-800">{item.name}</div>
                      <div className="text-[9px] text-slate-400 font-mono">Batch: {item.batchNumber}</div>
                    </td>
                    <td className="py-1.5 text-center">{item.qty}</td>
                    <td className="py-1.5 text-right">₹{item.price.toFixed(2)}</td>
                    <td className="py-1.5 text-right">₹{(item.price * item.qty).toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Totals Summary */}
        <div>
          <div className="border-t border-slate-200 pt-3 mt-2 space-y-1 text-[11px] text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>CGST ({lineItems.length > 0 ? "9%" : "0%"})</span>
              <span>₹{cgst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>SGST ({lineItems.length > 0 ? "9%" : "0%"})</span>
              <span>₹{sgst.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Discount ({discount}%)</span>
                <span>-₹{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-800 font-extrabold text-[13px] border-t border-dashed border-slate-300 pt-1.5 mt-1">
              <span>Grand Total ({paymentMode})</span>
              <span className="text-slate-900">₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center text-[10px] text-slate-400 mt-6 pt-3 border-t border-dashed border-slate-200 flex flex-col items-center justify-center gap-0.5">
            <div className="flex items-center gap-1 font-medium text-slate-500">
              <HeartHandshake size={12} className="text-rose-500" /> Get Well Soon!
            </div>
            <span>Viyan MedAssist Services</span>
          </div>
        </div>

      </div>
      </div>
    </div>
  );
}
