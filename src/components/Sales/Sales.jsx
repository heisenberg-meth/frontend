import InvoiceModal from "../invoice/InvoiceModal.jsx";
import InvoiceGeneratedModal from "../invoice/InvoiceGeneratedModal.jsx";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
  MessageCircle,
  RefreshCw,
  CreditCard,
  Smartphone,
  Banknote,
} from "lucide-react";
import { AnimatePresence, m } from "framer-motion";
import { TableHeader } from "../common/TableHeader.jsx";
import { X } from "lucide-react";
import { format, subDays } from "date-fns";
import { getMedicineName } from "../../utils/apiNormalizer.js";
import "../../styles/SalesManagement.css";
import { safeNumber } from "../../utils/number.js";
import {
  formatInvoiceTime,
  formatCurrency,
  formatInvoiceDate,
} from "../../utils/dateTime.js";

export function SalesManagementSection1({
  loading,
  dateRange,
  error,
  activeTab,
  handlePrevDate,
  currentDate,
  handleNextDate,
  filteredSales,
  dailySales,
  handleOpenDetail,
  hourlyData,
  setHoveredBar,
  hoveredBar,
}) {
  return loading ? (
    <div
      style={{
        padding: "40px",
        textAlign: "center",
        color: "var(--on-surface-variant)",
      }}
    >
      {dateRange.start || dateRange.end
        ? "Applying Date Filter..."
        : "Loading live data..."}
    </div>
  ) : error ? (
    <div
      style={{
        padding: "40px",
        textAlign: "center",
        color: "var(--danger)",
      }}
    >
      {error}
    </div>
  ) : (
    activeTab === "daily" && (
      <>
        {!dateRange.start && !dateRange.end && (
          <div className="date-navigator">
            <button
              className="micro-btn"
              onClick={handlePrevDate}
              aria-label="Previous date"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="date-display">
              {format(currentDate, "dd MMM yyyy")}
            </span>
            <button
              className="micro-btn"
              onClick={handleNextDate}
              aria-label="Next date"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        <div className="sales-summary-bar">
          <div className="summary-stats-left">
            <span>
              Total Bills: <b>{filteredSales.length}</b>
            </span>
            <span>
              Revenue:{" "}
              <b>
                ₹
                {formatCurrency(
                  filteredSales.reduce(
                    (sum, s) => sum + (s.totalAmount || s.total || 0),
                    0,
                  ),
                )}
              </b>
            </span>
          </div>
        </div>

        <div className="sales-table-card">
          <table className="purchase-table">
            <TableHeader
              columns={[
                "Time",
                "Bill #",
                "Patient",
                "Medicines",
                "Disc",
                "GST",
                "Total",
                "Payment Type",
                "Payment Status",
                "Invoice Status",
              ]}
            />
            <tbody>
              {dailySales.length === 0 ? (
                <tr>
                  <td
                    colSpan="10"
                    style={{
                      textAlign: "center",
                      padding: "40px",
                      color: "var(--on-surface-variant)",
                    }}
                  >
                    {dateRange.start || dateRange.end
                      ? `No sales found between ${format(new Date(dateRange.start), "dd MMM yyyy")} and ${format(new Date(dateRange.end), "dd MMM yyyy")}`
                      : "No sales found for this date"}
                  </td>
                </tr>
              ) : (
                dailySales.map((sale) => (
                  <tr
                    role="button"
                    tabIndex={0}
                    key={sale.id}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.currentTarget.click();
                      }
                    }}
                    onClick={() => handleOpenDetail(sale)}
                    style={{
                      cursor: "pointer",
                    }}
                    className="table-row-hover"
                  >
                    <td className="result-meta">
                      {formatInvoiceTime(sale.createdAt || sale.date) || "--"}
                    </td>
                    <td
                      style={{
                        fontWeight: 700,
                        color: "var(--primary)",
                      }}
                    >
                      {sale.invoiceNumber || sale.id}
                    </td>
                    <td>
                      <div>
                        {sale.patient?.fullName ||
                          sale.patient?.name ||
                          sale.patientName ||
                          sale.customerName ||
                          "Walk-in"}
                      </div>
                      {(sale.patient?.phone || sale.phone) && (
                        <div
                          className="result-meta"
                          style={{
                            fontSize: "12px",
                            marginTop: "2px",
                          }}
                        >
                          {sale.patient?.phone || sale.phone}
                        </div>
                      )}
                    </td>
                    <td>
                      {sale.items && sale.items.length > 0 ? (
                        <div>
                          {sale.items.slice(0, 2).map((it) => (
                            <div
                              key={it.qty}
                              style={{
                                fontSize: "12px",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                maxWidth: "180px",
                              }}
                            >
                              {getMedicineName(it)} x
                              {it.quantity || it.qty || 1}
                            </div>
                          ))}
                          {sale.items.length > 2 && (
                            <div
                              className="result-meta"
                              style={{
                                fontSize: "11px",
                                marginTop: "2px",
                              }}
                            >
                              +{sale.items.length - 2} More
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="result-meta">—</span>
                      )}
                    </td>
                    <td>
                      ₹
                      {parseFloat(
                        sale.discountAmount || sale.disc || 0,
                      ).toFixed(2)}
                    </td>
                    <td className="result-meta">
                      ₹
                      {parseFloat(
                        sale.taxAmount || sale.gstAmount || sale.gst || 0,
                      ).toFixed(2)}
                    </td>
                    <td
                      style={{
                        fontWeight: 700,
                        color: "var(--primary)",
                      }}
                    >
                      ₹
                      {parseFloat(sale.totalAmount || sale.total || 0).toFixed(
                        2,
                      )}
                    </td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "11px",
                          fontWeight: 700,
                        }}
                      >
                        {(sale.paymentMode || sale.payment) === "UPI" && (
                          <Smartphone size={12} color="var(--info)" />
                        )}
                        {(sale.paymentMode || sale.payment) === "CASH" && (
                          <Banknote size={12} color="var(--primary)" />
                        )}
                        {(sale.paymentMode || sale.payment) === "CARD" && (
                          <CreditCard size={12} color="var(--info)" />
                        )}
                        <span className="payment-badge">
                          {sale.paymentMode ||
                            sale.payment ||
                            sale.paymentMethod ||
                            "UNKNOWN"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`p-status ${sale.paymentStatus === "PAID" ? "paid" : sale.paymentStatus === "FAILED" ? "cancelled" : sale.paymentStatus === "PENDING" ? "low" : sale.paymentStatus === "PARTIAL" ? "low" : sale.paymentStatus === "REFUNDED" ? "expired" : "low"}`}
                      >
                        {(sale.paymentStatus || "UNKNOWN").toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`p-status ${(sale.invoiceStatus || sale.status) === "COMPLETED" ? "paid" : (sale.invoiceStatus || sale.status) === "CANCELLED" ? "cancelled" : (sale.invoiceStatus || sale.status) === "PARTIAL_RETURN" ? "low" : (sale.invoiceStatus || sale.status) === "REFUNDED" ? "expired" : (sale.invoiceStatus || sale.status) === "PENDING" ? "low" : "low"}`}
                      >
                        {(
                          sale.invoiceStatus ||
                          sale.status ||
                          "UNKNOWN"
                        ).toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <div
              style={{
                fontFamily: "Outfit",
                fontWeight: 700,
                fontSize: "16px",
              }}
            >
              Hourly Revenue
            </div>
          </div>

          <div className="bar-chart-container">
            {hourlyData && hourlyData.length > 0 ? (
              hourlyData.map((d, i) => {
                const revenue = Number(d.revenue) || 0;
                const maxRevenue = Math.max(
                  ...hourlyData.map((h) => Number(h.revenue) || 0),
                  1,
                );
                const barHeight =
                  revenue > 0 ? Math.max((revenue / maxRevenue) * 100, 4) : 0;
                return (
                  <div
                    key={d.hour}
                    className="chart-bar-wrapper"
                    onMouseEnter={() => setHoveredBar(i)}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    <m.div
                      className="chart-bar"
                      initial={{
                        scaleY: 0,
                      }}
                      animate={{
                        scaleY: barHeight / 100,
                      }}
                      transition={{
                        duration: 0.4,
                        ease: "easeOut",
                      }}
                      style={{
                        height: "100%",
                        transformOrigin: "bottom",
                        background: "var(--primary)",
                      }}
                    />

                    <span className="chart-label">
                      {d.label || `${d.hour}:00`}
                    </span>

                    {hoveredBar === i && (
                      <m.div
                        className="chart-tooltip"
                        initial={{
                          opacity: 0,
                          y: 5,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                      >
                        <b>{d.label || `${d.hour}:00`}</b>
                        <br />
                        {d.count} bills
                        <br />
                        <span
                          style={{
                            color: "var(--primary)",
                          }}
                        >
                          ₹
                          {revenue.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </m.div>
                    )}
                  </div>
                );
              })
            ) : (
              <div
                style={{
                  padding: "40px",
                  width: "100%",
                  textAlign: "center",
                  color: "var(--on-surface-variant)",
                }}
              >
                No hourly data available
              </div>
            )}
          </div>
        </div>
      </>
    )
  );
}
export function SalesManagementSection2({
  loading,
  activeTab,
  setFilters,
  filters,
  filteredSales,
  dateRange,
}) {
  return (
    !loading &&
    activeTab === "bills" && (
      <div className="sales-table-card">
        <div className="sales-filters">
          <>
            <label htmlFor="field_p7qr48" className="sr-only">
              Search Invoice # or Patient...
            </label>
            <input
              required
              className="sales-input"
              aria-label="Search Invoice # or Patient..."
              placeholder="Search Invoice # or Patient..."
              style={{
                flex: 1,
              }}
              value={filters.search}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  search: e.target.value,
                })
              }
              id="field_p7qr48"
            />
          </>
          <select
            className="sales-input"
            value={filters.payment}
            aria-label="Filter by payment method"
            onChange={(e) =>
              setFilters({
                ...filters,
                payment: e.target.value,
              })
            }
          >
            <option>All Payment Modes</option>
            <option>CASH</option>
            <option>UPI</option>
            <option>CARD</option>
          </select>
          <select
            className="sales-input"
            value={filters.status}
            aria-label="Filter by status"
            onChange={(e) =>
              setFilters({
                ...filters,
                status: e.target.value,
              })
            }
          >
            <option>All Status</option>
            <option>PAID</option>
            <option>CREDIT</option>
          </select>
        </div>
        <table className="purchase-table">
          <TableHeader
            columns={[
              "Date",
              "Invoice #",
              "Patient",
              "Medicines",
              "Amount",
              "Payment Method",
              "Payment Status",
              "Invoice Status",
            ]}
          />
          <tbody>
            {filteredSales.length === 0 ? (
              <tr>
                <td
                  colSpan="8"
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: "var(--on-surface-variant)",
                  }}
                >
                  {dateRange.start || dateRange.end
                    ? `No sales found between ${format(new Date(dateRange.start), "dd MMM yyyy")} and ${format(new Date(dateRange.end), "dd MMM yyyy")}`
                    : "No sales found"}
                </td>
              </tr>
            ) : (
              filteredSales.map((sale) => (
                <tr key={sale.id}>
                  <td>
                    {format(
                      new Date(sale.date || sale.createdAt),
                      "dd MMM yyyy",
                    )}
                  </td>
                  <td
                    style={{
                      fontWeight: 700,
                    }}
                  >
                    {sale.invoiceNumber || sale.id}
                  </td>
                  <td>
                    <div>
                      {sale.patient?.fullName ||
                        sale.patient?.name ||
                        sale.patientName ||
                        sale.customerName ||
                        "Walk-in"}
                    </div>
                    {(sale.patient?.phone || sale.phone) && (
                      <div
                        className="result-meta"
                        style={{
                          fontSize: "12px",
                          marginTop: "2px",
                        }}
                      >
                        {sale.patient?.phone || sale.phone}
                      </div>
                    )}
                  </td>
                  <td>
                    {sale.items && sale.items.length > 0 ? (
                      <div>
                        {sale.items.slice(0, 2).map((it) => (
                          <div
                            key={it.qty}
                            style={{
                              fontSize: "12px",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              maxWidth: "180px",
                            }}
                          >
                            {getMedicineName(it)} x{it.quantity || it.qty || 1}
                          </div>
                        ))}
                        {sale.items.length > 2 && (
                          <div
                            className="result-meta"
                            style={{
                              fontSize: "11px",
                              marginTop: "2px",
                            }}
                          >
                            +{sale.items.length - 2} More
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="result-meta">—</span>
                    )}
                  </td>
                  <td
                    style={{
                      fontWeight: 700,
                    }}
                  >
                    ₹{sale.totalAmount || sale.total || 0}
                  </td>
                  <td>
                    <span
                      className="badge-outline"
                      style={{
                        fontSize: "11px",
                        padding: "2px 6px",
                        border: "1px solid var(--outline)",
                        borderRadius: "4px",
                      }}
                    >
                      {sale.paymentMode ||
                        sale.payment ||
                        sale.paymentMethod ||
                        "UNKNOWN"}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`p-status ${sale.paymentStatus === "PAID" ? "paid" : sale.paymentStatus === "FAILED" ? "cancelled" : sale.paymentStatus === "PENDING" ? "low" : sale.paymentStatus === "PARTIAL" ? "low" : sale.paymentStatus === "REFUNDED" ? "expired" : "paid"}`}
                    >
                      {(sale.paymentStatus || "PAID").toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`p-status ${(sale.invoiceStatus || sale.status) === "COMPLETED" ? "paid" : (sale.invoiceStatus || sale.status) === "CANCELLED" ? "cancelled" : (sale.invoiceStatus || sale.status) === "PARTIAL_RETURN" ? "low" : (sale.invoiceStatus || sale.status) === "REFUNDED" ? "expired" : (sale.invoiceStatus || sale.status) === "PENDING" ? "low" : "low"}`}
                    >
                      {(
                        sale.invoiceStatus ||
                        sale.status ||
                        "COMPLETED"
                      ).toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    )
  );
}
export function SalesManagementSection3({
  loading,
  activeTab,
  filteredReturns,
}) {
  return (
    !loading &&
    activeTab === "returns" && (
      <div className="sales-table-card">
        <table className="purchase-table">
          <TableHeader
            columns={[
              "Date",
              "Return #",
              "Orig Invoice #",
              "Patient",
              "Items",
              "Return Value",
              "Reason",
              "Status",
            ]}
          />
          <tbody>
            {filteredReturns.length === 0 ? (
              <tr>
                <td
                  colSpan="8"
                  style={{
                    textAlign: "center",
                    padding: "30px",
                    color: "var(--text-muted)",
                  }}
                >
                  No returns found
                </td>
              </tr>
            ) : (
              filteredReturns.map((ret) => (
                <tr key={ret.id}>
                  <td>
                    {format(new Date(ret.date || ret.createdAt), "dd MMM yyyy")}
                  </td>
                  <td
                    style={{
                      fontWeight: 700,
                    }}
                  >
                    {ret.returnNumber || ret.id}
                  </td>
                  <td className="result-meta">
                    {ret.sale?.invoiceNumber ||
                      ret.invoice?.invoiceNumber ||
                      ret.origInv ||
                      "—"}
                  </td>
                  <td>
                    {ret.patient?.fullName || ret.patientName || "Walk-in"}
                  </td>
                  <td>{ret.items?.length || ret.itemsCount || 0}</td>
                  <td
                    style={{
                      fontWeight: 700,
                      color: "var(--danger)",
                    }}
                  >
                    ₹
                    {formatCurrency(
                      ret.refundAmount ||
                        ret.totalReturnAmount ||
                        ret.value ||
                        0,
                    )}
                  </td>
                  <td>
                    <span
                      className="badge-paid"
                      style={{
                        background: "rgba(59, 130, 246, 0.1)",
                        color: "var(--info)",
                      }}
                    >
                      {ret.returnReason || ret.reason || "—"}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`p-status ${(ret.status || "").toLowerCase()}`}
                    >
                      {ret.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    )
  );
}
export function SalesManagementSection4({
  showDetailModal,
  setShowDetailModal,
  downloadInvoicePDF,
  selectedSale,
  handleReturn,
  handleWhatsApp,
  handlePrintBill,
}) {
  return (
    <AnimatePresence>
      {showDetailModal && selectedSale && (
        <div className="stock-modal-overlay">
          <m.div
            className="sale-details-modal stock-modal-content"
            style={{
              width: "95vw",
              maxWidth: "1400px",
              height: "90vh",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
            }}
            initial={{
              opacity: 0,
              scale: 0.9,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              scale: 0.9,
            }}
          >
            <div className="stock-modal-header">
              <h3
                style={{
                  fontFamily: "Outfit",
                  fontWeight: 700,
                }}
              >
                Sale Details: {selectedSale.invoiceNumber || selectedSale.id}
              </h3>
              <button
                aria-label="Close"
                className="micro-btn"
                onClick={() => setShowDetailModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="stock-modal-body">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                  marginBottom: "20px",
                }}
              >
                <div>
                  <div className="result-meta">Patient</div>
                  <div
                    style={{
                      fontWeight: 700,
                    }}
                  >
                    {selectedSale.patient?.name ||
                      selectedSale.patient?.fullName ||
                      selectedSale.patientName ||
                      selectedSale.customerName ||
                      "Walk-in"}
                  </div>
                  <div
                    className="result-meta"
                    style={{
                      marginTop: "4px",
                    }}
                  >
                    Phone
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                    }}
                  >
                    {selectedSale.patient?.phone ||
                      selectedSale.patientPhone ||
                      "N/A"}
                  </div>
                </div>
                <div>
                  <div className="result-meta">Date & Time</div>
                  <div
                    style={{
                      fontWeight: 700,
                    }}
                  >
                    {formatInvoiceDate(
                      selectedSale.createdAt || selectedSale.date,
                    )}{" "}
                    {formatInvoiceTime(
                      selectedSale.createdAt || selectedSale.date,
                    )}
                  </div>
                  <div
                    className="result-meta"
                    style={{
                      marginTop: "4px",
                    }}
                  >
                    Payment
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                    }}
                  >
                    {selectedSale.paymentMode ||
                      selectedSale.payment ||
                      "Unknown Payment Method"}
                    {selectedSale.paymentStatus
                      ? ` (${selectedSale.paymentStatus})`
                      : ""}
                  </div>
                </div>
              </div>

              <div className="pos-input-group">
                <span>Bill Items</span>
                <div
                  className="table-wrapper"
                  style={{
                    background: "var(--surface-container)",
                    borderRadius: "8px",
                  }}
                >
                  <table
                    className="bill-items-table"
                    style={{
                      fontSize: "14px",
                      borderCollapse: "collapse",
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          background: "rgba(0,0,0,0.05)",
                          textAlign: "left",
                        }}
                      >
                        <th
                          style={{
                            padding: "8px",
                          }}
                        >
                          Medicine
                        </th>
                        <th
                          style={{
                            padding: "8px",
                          }}
                        >
                          Batch
                        </th>
                        <th
                          style={{
                            padding: "8px",
                            textAlign: "right",
                          }}
                        >
                          Qty
                        </th>
                        <th
                          style={{
                            padding: "8px",
                            textAlign: "right",
                          }}
                        >
                          Price
                        </th>
                        <th
                          style={{
                            padding: "8px",
                            textAlign: "right",
                          }}
                        >
                          GST
                        </th>
                        <th
                          style={{
                            padding: "8px",
                            textAlign: "right",
                          }}
                        >
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedSale.items || []).map((it) => (
                        <tr
                          key={it.gst}
                          style={{
                            borderBottom: "1px solid var(--outline-variant)",
                          }}
                        >
                          <td
                            style={{
                              padding: "8px",
                            }}
                          >
                            {getMedicineName(it)}
                          </td>
                          <td
                            style={{
                              padding: "8px",
                            }}
                          >
                            {it.batchNumber || it.batch?.batchNumber || "N/A"}
                          </td>
                          <td
                            style={{
                              padding: "8px",
                              textAlign: "right",
                            }}
                          >
                            {it.quantity || it.qty || 1}
                          </td>
                          <td
                            style={{
                              padding: "8px",
                              textAlign: "right",
                            }}
                          >
                            ₹
                            {safeNumber(it.unitPrice || it.price || 0).toFixed(
                              2,
                            )}
                          </td>
                          <td
                            style={{
                              padding: "8px",
                              textAlign: "right",
                            }}
                          >
                            ₹{safeNumber(it.gstAmount || 0).toFixed(2)} (
                            {it.gstRate || it.gst || 0}%)
                          </td>
                          <td
                            style={{
                              padding: "8px",
                              textAlign: "right",
                            }}
                          >
                            ₹
                            {safeNumber(
                              it.lineTotal ||
                                it.totalAmount ||
                                it.total ||
                                it.totalPrice ||
                                (it.quantity || it.qty || 1) *
                                  (it.unitPrice || it.price || 0),
                            ).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div
                    style={{
                      padding: "12px",
                      borderTop: "2px solid var(--outline-variant)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      alignItems: "flex-end",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        width: "200px",
                      }}
                    >
                      <span className="result-meta">Subtotal</span>
                      <span>
                        ₹{safeNumber(selectedSale.subtotal || 0).toFixed(2)}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        width: "200px",
                      }}
                    >
                      <span className="result-meta">Discount</span>
                      <span>
                        ₹
                        {safeNumber(
                          selectedSale.discountAmount ||
                            selectedSale.discount ||
                            0,
                        ).toFixed(2)}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        width: "200px",
                      }}
                    >
                      <span className="result-meta">GST</span>
                      <span>
                        ₹
                        {safeNumber(
                          selectedSale.gstAmount || selectedSale.gst || 0,
                        ).toFixed(2)}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        width: "200px",
                        fontWeight: 700,
                        fontSize: "16px",
                        marginTop: "4px",
                      }}
                    >
                      <span>Grand Total</span>
                      <span
                        style={{
                          color: "var(--primary)",
                        }}
                      >
                        ₹
                        {safeNumber(
                          selectedSale.totalAmount || selectedSale.total || 0,
                        ).toFixed(2)}
                      </span>
                    </div>
                    {safeNumber(selectedSale.returnedAmount) > 0 && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          width: "200px",
                          fontWeight: 700,
                          fontSize: "14px",
                          marginTop: "8px",
                          color: "var(--danger)",
                        }}
                      >
                        <span>Returned Amount</span>
                        <span>
                          -₹
                          {safeNumber(selectedSale.returnedAmount).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div
              className="stock-modal-footer modal-footer"
              style={{
                position: "sticky",
                bottom: 0,
                background: "var(--surface)",
                zIndex: 100,
                padding: "16px",
                borderTop: "1px solid var(--outline-variant)",
              }}
            >
              <button
                className="pos-btn outline"
                onClick={() => {
                  setShowDetailModal(false);
                }}
              >
                Close
              </button>
              <button
                className="pos-btn outline"
                onClick={() => {
                  downloadInvoicePDF(selectedSale);
                  setShowDetailModal(false);
                }}
              >
                <Download size={16} /> PDF
              </button>
              <button
                className="pos-btn outline"
                style={{
                  color: "var(--danger)",
                  borderColor: "var(--danger)",
                }}
                onClick={() => {
                  handleReturn(selectedSale);
                  setShowDetailModal(false);
                }}
              >
                <RefreshCw size={16} /> Return Items
              </button>
              <button
                className="pos-btn outline"
                style={{
                  color: "var(--success)",
                  borderColor: "var(--success)",
                }}
                onClick={() => {
                  handleWhatsApp(selectedSale);
                  setShowDetailModal(false);
                }}
              >
                <MessageCircle size={16} /> WhatsApp
              </button>
              <button
                className="pos-btn teal"
                onClick={() => {
                  handlePrintBill(selectedSale);
                  setShowDetailModal(false);
                }}
              >
                <Printer size={16} /> Print Bill
              </button>
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}
export function SalesManagementSection5({
  showWhatsAppModal,
  setShowWhatsAppModal,
  sendWhatsApp,
  selectedSale,
}) {
  return (
    <AnimatePresence>
      {showWhatsAppModal && selectedSale && (
        <div className="stock-modal-overlay">
          <m.div
            className="stock-modal-content"
            style={{
              width: "450px",
            }}
            initial={{
              opacity: 0,
              scale: 0.9,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              scale: 0.9,
            }}
          >
            <div className="stock-modal-header">
              <h3
                style={{
                  fontFamily: "Outfit",
                  fontWeight: 700,
                }}
              >
                Share Bill via WhatsApp
              </h3>
              <button
                aria-label="Close"
                className="micro-btn"
                onClick={() => setShowWhatsAppModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="stock-modal-body">
              <div className="pos-input-group">
                <label htmlFor="field_jqkqjp">Phone Number</label>
                <input
                  id="field_jqkqjp"
                  required
                  className="pos-input"
                  style={{
                    width: "100%",
                  }}
                  defaultValue={selectedSale.patient?.phone || "+91 "}
                />
              </div>
              <div
                className="pos-input-group"
                style={{
                  marginTop: "16px",
                }}
              >
                <label htmlFor="field_miw5kd">Message Preview</label>
                <textarea
                  id="field_miw5kd"
                  className="pos-input"
                  rows={4}
                  style={{
                    width: "100%",
                    fontSize: "12px",
                  }}
                  defaultValue={`Hello ${selectedSale.patient?.fullName || "Customer"},\nYour bill for ${selectedSale.invoiceNumber || selectedSale.id} (₹${selectedSale.totalAmount || selectedSale.total}) from Viyan MedAssist is ready.\nView it here: https://viyan.med/b/${(selectedSale.invoiceNumber || selectedSale.id || "").split("-").pop()}`}
                />
              </div>
            </div>
            <div className="stock-modal-footer">
              <button
                className="pos-btn outline"
                onClick={() => setShowWhatsAppModal(false)}
              >
                Cancel
              </button>
              <button
                className="pos-btn teal"
                style={{
                  background: "#25D366",
                  color: "white",
                  border: "none",
                }}
                onClick={() => sendWhatsApp(selectedSale)}
              >
                <MessageCircle size={16} /> Send WhatsApp
              </button>
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}
export function SalesManagementSection6({
  showReturnModal,
  selectedSale,
  setShowReturnModal,
  returnChecked,
  setReturnChecked,
  returnQuantities,
  setReturnQuantities,
  returnModalReason,
  setReturnModalReason,
  processReturnApi,
}) {
  return (
    <AnimatePresence>
      {showReturnModal && selectedSale && (
        <div className="stock-modal-overlay">
          <m.div
            className="stock-modal-content"
            style={{
              width: "500px",
            }}
            initial={{
              opacity: 0,
              scale: 0.9,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              scale: 0.9,
            }}
          >
            <div className="stock-modal-header">
              <h3
                style={{
                  fontFamily: "Outfit",
                  fontWeight: 700,
                  color: "var(--danger)",
                }}
              >
                Process Sales Return
              </h3>
              <button
                aria-label="Close"
                className="micro-btn"
                onClick={() => setShowReturnModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="stock-modal-body">
              <p className="result-meta">
                Initiating return for{" "}
                {selectedSale.invoiceNumber || selectedSale.id} (
                {selectedSale.patient?.fullName ||
                  selectedSale.patientName ||
                  selectedSale.customerName ||
                  "Walk-in"}
                )
              </p>

              <div
                style={{
                  marginTop: "16px",
                }}
              >
                {(selectedSale.items || []).map((item, idx) => (
                  <div
                    key={item.qty}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: "12px",
                    }}
                  >
                    <input
                      required
                      type="checkbox"
                      aria-label="Select item for return"
                      checked={returnChecked[idx] ?? true}
                      onChange={(e) =>
                        setReturnChecked((prev) => ({
                          ...prev,
                          [idx]: e.target.checked,
                        }))
                      }
                    />
                    <div
                      style={{
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 600,
                        }}
                      >
                        {getMedicineName(item)}
                      </div>
                      <div
                        className="result-meta"
                        style={{
                          fontSize: "12px",
                        }}
                      >
                        Sold Qty: {item.quantity || item.qty || 1}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span
                        className="result-meta"
                        style={{
                          fontSize: "12px",
                        }}
                      >
                        Return Qty:
                      </span>
                      <input
                        required
                        className="p-cost-input"
                        aria-label="Return quantity"
                        style={{
                          width: "60px",
                          padding: "4px 8px",
                        }}
                        type="number"
                        min={0}
                        max={item.quantity || item.qty || 1}
                        value={
                          returnQuantities[idx] ??
                          (item.quantity || item.qty || 1)
                        }
                        onChange={(e) =>
                          setReturnQuantities((prev) => ({
                            ...prev,
                            [idx]: Math.min(
                              item.quantity || item.qty || 1,
                              Math.max(0, safeNumber(e.target.value)),
                            ),
                          }))
                        }
                      />
                    </div>
                  </div>
                ))}
                {(!selectedSale.items || selectedSale.items.length === 0) && (
                  <div>No items found to return.</div>
                )}
              </div>

              <div
                className="pos-input-group"
                style={{
                  marginTop: "20px",
                }}
              >
                <label htmlFor="field_fvivco">Return Reason</label>
                <select
                  id="field_fvivco"
                  className="pos-input"
                  style={{
                    width: "100%",
                  }}
                  value={returnModalReason}
                  onChange={(e) => setReturnModalReason(e.target.value)}
                >
                  <option>Patient Request</option>
                  <option>Expired Medicine</option>
                  <option>Wrong Medicine</option>
                  <option>Damaged Packaging</option>
                </select>
              </div>
            </div>
            <div className="stock-modal-footer">
              <button
                className="pos-btn outline"
                onClick={() => setShowReturnModal(false)}
              >
                Cancel
              </button>
              <button
                className="pos-btn teal"
                style={{
                  background: "var(--danger)",
                  color: "white",
                  border: "none",
                }}
                onClick={processReturnApi}
              >
                Process Refund
              </button>
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}
export function SalesManagementSection7({
  showDateRangeModal,
  setShowDateRangeModal,
  tempDateRange,
  setTempDateRange,
  setDateRange,
  showToast,
  showInvoiceModal,
  setShowInvoiceModal,
  refreshSalesData,
  user,
  storeProfile,
  generatedInvoice,
  setGeneratedInvoice,
  showGeneratedInvoiceModal,
  setShowGeneratedInvoiceModal,
}) {
  return (
    <AnimatePresence>
      {showDateRangeModal && (
        <div className="stock-modal-overlay">
          <m.div
            className="stock-modal-content"
            style={{
              width: "400px",
            }}
            initial={{
              opacity: 0,
              scale: 0.9,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              scale: 0.9,
            }}
          >
            <div className="stock-modal-header">
              <h3
                style={{
                  fontFamily: "Outfit",
                  fontWeight: 700,
                }}
              >
                Select Date Range
              </h3>
              <button
                aria-label="Close"
                className="micro-btn"
                onClick={() => setShowDateRangeModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="stock-modal-body">
              <div className="pos-input-group">
                <label htmlFor="field_86ablk">Start Date</label>
                <input
                  id="field_86ablk"
                  required
                  type="date"
                  className="pos-input"
                  style={{
                    width: "100%",
                  }}
                  value={tempDateRange.start}
                  onChange={(e) =>
                    setTempDateRange({
                      ...tempDateRange,
                      start: e.target.value,
                    })
                  }
                />
              </div>
              <div
                className="pos-input-group"
                style={{
                  marginTop: "16px",
                }}
              >
                <label htmlFor="field_c00a5e">End Date</label>
                <input
                  id="field_c00a5e"
                  required
                  type="date"
                  className="pos-input"
                  style={{
                    width: "100%",
                  }}
                  value={tempDateRange.end}
                  onChange={(e) =>
                    setTempDateRange({
                      ...tempDateRange,
                      end: e.target.value,
                    })
                  }
                />
              </div>

              <div
                className="range-presets"
                style={{
                  marginTop: "20px",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                }}
              >
                <button
                  className="pos-btn outline"
                  style={{
                    fontSize: "12px",
                    padding: "8px",
                  }}
                  onClick={() =>
                    setTempDateRange({
                      start: format(new Date(), "yyyy-MM-dd"),
                      end: format(new Date(), "yyyy-MM-dd"),
                    })
                  }
                >
                  Today
                </button>
                <button
                  className="pos-btn outline"
                  style={{
                    fontSize: "12px",
                    padding: "8px",
                  }}
                  onClick={() =>
                    setTempDateRange({
                      start: format(subDays(new Date(), 1), "yyyy-MM-dd"),
                      end: format(subDays(new Date(), 1), "yyyy-MM-dd"),
                    })
                  }
                >
                  Yesterday
                </button>
                <button
                  className="pos-btn outline"
                  style={{
                    fontSize: "12px",
                    padding: "8px",
                  }}
                  onClick={() =>
                    setTempDateRange({
                      start: format(subDays(new Date(), 7), "yyyy-MM-dd"),
                      end: format(new Date(), "yyyy-MM-dd"),
                    })
                  }
                >
                  Last 7 Days
                </button>
                <button
                  className="pos-btn outline"
                  style={{
                    fontSize: "12px",
                    padding: "8px",
                  }}
                  onClick={() =>
                    setTempDateRange({
                      start: format(subDays(new Date(), 30), "yyyy-MM-dd"),
                      end: format(new Date(), "yyyy-MM-dd"),
                    })
                  }
                >
                  Last 30 Days
                </button>
                <button
                  className="pos-btn outline"
                  style={{
                    fontSize: "12px",
                    padding: "8px",
                  }}
                  onClick={() => {
                    const today = new Date();
                    setTempDateRange({
                      start: format(
                        new Date(today.getFullYear(), today.getMonth(), 1),
                        "yyyy-MM-dd",
                      ),
                      end: format(
                        new Date(today.getFullYear(), today.getMonth() + 1, 0),
                        "yyyy-MM-dd",
                      ),
                    });
                  }}
                >
                  This Month
                </button>
                <button
                  className="pos-btn outline"
                  style={{
                    fontSize: "12px",
                    padding: "8px",
                  }}
                  onClick={() => {
                    const today = new Date();
                    setTempDateRange({
                      start: format(
                        new Date(today.getFullYear(), today.getMonth() - 1, 1),
                        "yyyy-MM-dd",
                      ),
                      end: format(
                        new Date(today.getFullYear(), today.getMonth(), 0),
                        "yyyy-MM-dd",
                      ),
                    });
                  }}
                >
                  Previous Month
                </button>
              </div>
            </div>
            <div className="stock-modal-footer">
              <button
                className="pos-btn outline"
                onClick={() => setShowDateRangeModal(false)}
              >
                Cancel
              </button>
              <button
                className="pos-btn teal"
                onClick={() => {
                  if (
                    tempDateRange.start &&
                    tempDateRange.end &&
                    tempDateRange.start > tempDateRange.end
                  ) {
                    showToast("End date must be after start date", "error");
                    return;
                  }
                  setDateRange(tempDateRange);
                  setShowDateRangeModal(false);
                  showToast("Date Filter Applied", "success");
                }}
              >
                Apply Filter
              </button>
            </div>
          </m.div>
        </div>
      )}
      {showInvoiceModal && (
        <InvoiceModal
          isOpen={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
          onSaveSuccess={(inv) => {
            refreshSalesData();
            setShowInvoiceModal(false);
            setGeneratedInvoice(inv);
            setShowGeneratedInvoiceModal(true);
          }}
          showToast={showToast}
          user={user}
          storeProfile={storeProfile}
        />
      )}
      {showGeneratedInvoiceModal && (
        <InvoiceGeneratedModal
          isOpen={showGeneratedInvoiceModal}
          invoice={generatedInvoice}
          onClose={() => {
            setShowGeneratedInvoiceModal(false);
            setGeneratedInvoice(null);
          }}
          showToast={showToast}
          storeProfile={storeProfile}
          onNewBill={() => {
            setShowGeneratedInvoiceModal(false);
            setGeneratedInvoice(null);
            setShowInvoiceModal(true);
          }}
        />
      )}
    </AnimatePresence>
  );
}
