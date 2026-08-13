export default function InvoicePreview({
  patient,
  doctorName,
  prescriptionNo,
  address,
  gstNumber,
  paymentTerms,
  dueDate,
  lineItems,
  subtotal,
  discountAmount,
  tax,
  grandTotal,
  isWalkIn,
  invoiceNumber,
  invoiceDate,
  storeProfile,
}) {
  const formatDate = (dateVal) => {
    if (!dateVal) return "—";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    const day = String(d.getDate()).padStart(2, "0");
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const todayStr = invoiceDate
    ? formatDate(invoiceDate)
    : formatDate(new Date());
  const dueDateStr = formatDate(dueDate);
  const invoiceNo =
    invoiceNumber ||
    `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-XXXX`;
  const validItems = lineItems.filter((i) => !i.isNew && i.id);

  return (
    <div className="inv-sheet-wrapper">
      <div className="inv-sheet">
        {/* ── HEADER ── */}
        <div className="inv-header">
          <div className="inv-header-left">
            <div className="inv-pharmacy-name">
              {storeProfile?.shopName ||
                storeProfile?.businessName ||
                "Your Shop Name"}
            </div>
            <div className="inv-pharmacy-meta">
              {storeProfile?.address || "Your Address"}
              <br />
              GSTIN: {storeProfile?.gstin || "N/A"} &nbsp;|&nbsp; Ph:{" "}
              {storeProfile?.phone || "N/A"}
              <br />
              Email: {storeProfile?.email || "N/A"}
            </div>
          </div>
          <div className="inv-header-right">
            <div className="inv-badge">TAX INVOICE</div>
            <div className="inv-invoice-meta">
              <div className="inv-meta-row">
                <span className="inv-meta-label">Invoice No</span>
                <span className="inv-meta-value inv-mono">{invoiceNo}</span>
              </div>
              <div className="inv-meta-row">
                <span className="inv-meta-label">Date</span>
                <span className="inv-meta-value">{todayStr}</span>
              </div>
              {dueDateStr && dueDateStr !== "—" && (
                <div className="inv-meta-row">
                  <span className="inv-meta-label">Due Date</span>
                  <span className="inv-meta-value">{dueDateStr}</span>
                </div>
              )}
              <div className="inv-meta-row">
                <span className="inv-meta-label">Payment</span>
                <span className="inv-meta-value">
                  {paymentTerms || "Immediate"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── DIVIDER ── */}
        <div className="inv-divider" />

        {/* ── BILLING INFO ── */}
        <div className="inv-billing-row">
          <div className="inv-bill-to">
            <div className="inv-section-label">BILLED TO</div>
            <div className="inv-customer-name">
              {isWalkIn
                ? "Walk-in Customer"
                : patient?.name || "Walk-in Customer"}
            </div>
            {patient?.phone && !isWalkIn && (
              <div className="inv-customer-detail">📞 {patient.phone}</div>
            )}
            {address && !isWalkIn && (
              <div className="inv-customer-detail">{address}</div>
            )}
          </div>

          {(doctorName || prescriptionNo) && (
            <div className="inv-rx-box">
              {doctorName && (
                <div className="inv-meta-row">
                  <span className="inv-meta-label">Doctor</span>
                  <span className="inv-meta-value">Dr. {doctorName}</span>
                </div>
              )}
              {prescriptionNo && (
                <div className="inv-meta-row">
                  <span className="inv-meta-label">Rx No.</span>
                  <span className="inv-meta-value inv-mono">
                    {prescriptionNo}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── MEDICINES TABLE ── */}
        <div className="inv-table-wrap">
          <table className="inv-table">
            <thead>
              <tr className="inv-table-head">
                <th className="inv-th inv-th-left inv-col-medicine">
                  Medicine
                </th>
                <th className="inv-th inv-th-center inv-col-batch">
                  Batch No.
                </th>
                <th className="inv-th inv-th-center inv-col-qty">Qty</th>
                <th className="inv-th inv-th-right inv-col-mrp">MRP ₹</th>
                <th className="inv-th inv-th-center inv-col-disc">Disc%</th>
                <th className="inv-th inv-th-center inv-col-gst">GST%</th>
                <th className="inv-th inv-th-right inv-col-amt">Amount ₹</th>
              </tr>
            </thead>
            <tbody>
              {validItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="inv-empty-state">
                    <div className="inv-empty-icon">💊</div>
                    <div className="inv-empty-text">No medicines added yet</div>
                    <div className="inv-empty-sub">
                      Add items from the left panel to generate invoice
                    </div>
                  </td>
                </tr>
              ) : (
                validItems.map((item, idx) => {
                  const itemSub = item.price * item.qty;
                  const itemDisc = itemSub * ((item.discount || 0) / 100);
                  const amount = itemSub - itemDisc;
                  return (
                    <tr
                      key={item.name}
                      className={`inv-tr ${idx % 2 === 0 ? "" : "inv-tr-alt"}`}
                    >
                      <td className="inv-td inv-td-left">
                        <div className="inv-med-name">{item.name}</div>
                      </td>
                      <td className="inv-td inv-td-center inv-mono-sm">
                        {item.batchNumber || "—"}
                      </td>
                      <td className="inv-td inv-td-center">{item.qty}</td>
                      <td className="inv-td inv-td-right">
                        {item.price?.toFixed(2)}
                      </td>
                      <td className="inv-td inv-td-center">
                        {item.discount > 0 ? `${item.discount}%` : "—"}
                      </td>
                      <td className="inv-td inv-td-center">
                        {item.gst > 0 ? `${item.gst}%` : "—"}
                      </td>
                      <td className="inv-td inv-td-right inv-td-amount">
                        {amount.toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── TOTALS + NOTES ── */}
        <div className="inv-footer-row">
          {/* Left: Terms / Notes */}
          <div className="inv-notes-col">
            <div className="inv-section-label" style={{ marginBottom: 6 }}>
              TERMS & CONDITIONS
            </div>
            <div className="inv-notes-text">
              1. Goods once sold will not be taken back or exchanged.
              <br />
              2. Subject to local jurisdiction only.
              <br />
              3. E. &amp; O.E.
            </div>
            {gstNumber && (
              <div className="inv-gst-tag">
                Customer GSTIN: <strong>{gstNumber}</strong>
              </div>
            )}
          </div>

          {/* Right: Totals */}
          <div className="inv-totals-col">
            <div className="inv-totals-box">
              <div className="inv-totals-row">
                <span className="inv-totals-label">Subtotal</span>
                <span className="inv-totals-val">₹{subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="inv-totals-row inv-totals-disc">
                  <span className="inv-totals-label">Discount</span>
                  <span className="inv-totals-val">
                    −₹{discountAmount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="inv-totals-row">
                <span className="inv-totals-label">GST / Tax</span>
                <span className="inv-totals-val">₹{tax.toFixed(2)}</span>
              </div>
              <div className="inv-totals-divider" />
              <div className="inv-totals-row inv-totals-grand">
                <span className="inv-totals-grand-label">TOTAL</span>
                <span className="inv-totals-grand-val">
                  ₹{grandTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── SIGNATURE ROW ── */}
        <div className="inv-sig-row">
          <div className="inv-sig-block">
            <div className="inv-sig-line" />
            <div className="inv-sig-caption">Customer Signature</div>
          </div>
          <div className="inv-sig-center">
            <div className="inv-thankyou">
              ✦ Thank you for choosing Viyan MedAssist ✦
            </div>
            <div className="inv-thankyou-sub">Get well soon!</div>
          </div>
          <div className="inv-sig-block inv-sig-right">
            <div className="inv-sig-line" />
            <div className="inv-sig-caption">Authorised Signatory</div>
          </div>
        </div>
      </div>
    </div>
  );
}
