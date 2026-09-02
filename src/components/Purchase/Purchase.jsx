import api from "../../api.js";
import { API_ROUTES } from "../../constants/api.routes.js";
import {
  ArrowLeft,
  Plus,
  X,
  Download,
  Eye,
  Edit2,
  Truck,
  ScanLine,
  Package,
  Loader2,
  Check,
} from "lucide-react";
import { AnimatePresence, m } from "framer-motion";
import { safeNumber } from "../../utils/number.js";
import { formatDate } from "../../utils/formUtils.js";

export function Spinner({ size = 14 }) {
  return (
    <Loader2
      size={size}
      style={{
        animation: "spin 0.8s linear infinite",
      }}
    />
  );
}

const renderInvoiceItemsSummary = (inv) => {
  const items = inv?.items || inv?.inventoryBatches || [];
  if (!items || items.length === 0) {
    return {
      medicineDisplay: inv?.medicines ? `${inv.medicines} items` : "-",
      batchDisplay: "-",
      expiryDisplay: "-",
      priceDisplay: "-",
    };
  }
  if (items.length === 1) {
    const item = items[0];
    const medName =
      item.medicine?.name || item.medicineName || item.name || "-";
    const batchNo = item.batchNumber || "-";
    const expiry = item.expiryDate ? formatDate(item.expiryDate) : "-";
    const price = safeNumber(
      item.purchasePrice || item.unitPrice || item.price || 0,
    );
    return {
      medicineDisplay: medName,
      batchDisplay:
        batchNo !== "-" ? <span className="batch-pill">{batchNo}</span> : "-",
      expiryDisplay: expiry,
      priceDisplay:
        price > 0
          ? `₹${price.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`
          : "-",
    };
  }

  // Multiple items
  const firstMed =
    items[0].medicine?.name || items[0].medicineName || items[0].name || "Item";
  const allMeds = items
    .map((i) => i.medicine?.name || i.medicineName || i.name || "Item")
    .join(", ");
  const allBatches = items
    .flatMap((i) => (i.batchNumber ? [i.batchNumber] : []))
    .join(", ");
  const validExpiries = items.reduce((acc, i) => {
    const t = i.expiryDate ? new Date(i.expiryDate).getTime() : null;
    if (t && !isNaN(t)) acc.push(t);
    return acc;
  }, []);
  const earliestExpiry =
    validExpiries.length > 0 ? new Date(Math.min(...validExpiries)) : null;
  const prices = items.reduce((acc, i) => {
    const p = safeNumber(i.purchasePrice || i.unitPrice || i.price || 0);
    if (p > 0) acc.push(p);
    return acc;
  }, []);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
  return {
    medicineDisplay: (
      <span>
        {firstMed}
        <span className="badge-subtle" title={allMeds}>
          +{items.length - 1} more
        </span>
      </span>
    ),
    batchDisplay: (
      <span
        className="batch-pill-multi"
        title={
          allBatches ? `Batches: ${allBatches}` : `${items.length} Batches`
        }
      >
        {items.length} Batches
      </span>
    ),
    expiryDisplay: earliestExpiry ? (
      <span title={`Earliest expiry: ${formatDate(earliestExpiry)}`}>
        {formatDate(earliestExpiry)}
      </span>
    ) : (
      "Multiple"
    ),
    priceDisplay:
      prices.length === 0
        ? "-"
        : minPrice === maxPrice
          ? `₹${minPrice.toFixed(2)}`
          : `₹${minPrice.toFixed(2)} - ₹${maxPrice.toFixed(2)}`,
  };
};
export function PurchaseManagementSection1({
  setFilters,
  filters,
  handleOpenDrawer,
  updatePaymentStatus,
  setSelectedRow,
  setShowReturnModal,
  loadReturnBatches,
  isApprovingPORef,
  showToast,
  refreshData,
  handleOpenReceiveModal,
  suppliers,
  activeTab,
  loading,
  filteredInvoices,
  filteredOrders,
  filteredReturns,
}) {
  return (
    <div className="purchase-table-card">
      {/* Filter Row */}
      <div className="purchase-filters">
        <div
          className="pos-input-group"
          style={{
            maxWidth: "200px",
          }}
        >
          <input
            required
            className="filter-input"
            type="date"
            value={filters.date}
            onChange={(e) =>
              setFilters({
                ...filters,
                date: e.target.value,
              })
            }
          />
        </div>
        <select
          className="filter-input"
          value={filters.supplier}
          onChange={(e) =>
            setFilters({
              ...filters,
              supplier: e.target.value,
            })
          }
        >
          <option>All Suppliers</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          className="filter-input"
          value={filters.status}
          onChange={(e) =>
            setFilters({
              ...filters,
              status: e.target.value,
            })
          }
        >
          <option>All Status</option>
          {activeTab === "returns" ? (
            <>
              <option>Draft</option>
              <option>Approved</option>
              <option>Dispatched</option>
              <option>Received</option>
              <option>Completed</option>
            </>
          ) : (
            <>
              <option>Paid</option>
              <option>Pending</option>
              <option>Partially Paid</option>
              <option>Sent</option>
              <option>Confirmed</option>
              <option>Received</option>
              <option>Approved</option>
              <option>Completed</option>
            </>
          )}
        </select>
        <div
          className="pos-input-group"
          style={{
            flex: 1,
          }}
        >
          <>
            <label htmlFor="field_y7yln1" className="sr-only">
              Search by ID or Supplier...
            </label>
            <input
              required
              className="filter-input"
              placeholder="Search by ID or Supplier..."
              style={{
                width: "100%",
              }}
              value={filters.search}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  search: e.target.value,
                })
              }
              id="field_y7yln1"
            />
          </>
        </div>
      </div>

      {loading ? (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            color: "var(--on-surface-variant)",
          }}
        >
          Loading live data...
        </div>
      ) : (
        activeTab === "invoices" && (
          <table className="purchase-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Supplier Inv #</th>
                <th>Supplier</th>
                <th>Medicines</th>
                <th>Batch</th>
                <th>Expiry</th>
                <th>Price ₹</th>
                <th>Total ₹</th>
                <th>GST ₹</th>
                <th>Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv) => {
                const summary = renderInvoiceItemsSummary(inv);
                return (
                  <tr
                    role="button"
                    tabIndex={0}
                    key={inv.id}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.currentTarget.click();
                      }
                    }}
                    onClick={() => handleOpenDrawer("invoice-detail", inv)}
                  >
                    <td>{inv.date || formatDate(inv.createdAt)}</td>
                    <td
                      style={{
                        fontWeight: 700,
                      }}
                    >
                      {inv.supplierInvoiceNumber || inv.invoiceNumber || "-"}
                    </td>
                    <td>
                      {inv.supplier?.name ||
                        inv.supplierName ||
                        inv.supplier ||
                        "-"}
                    </td>
                    <td>{summary.medicineDisplay}</td>
                    <td>{summary.batchDisplay}</td>
                    <td>{summary.expiryDisplay}</td>
                    <td
                      style={{
                        fontWeight: 600,
                      }}
                    >
                      {summary.priceDisplay}
                    </td>
                    <td
                      style={{
                        fontWeight: 700,
                      }}
                    >
                      ₹
                      {safeNumber(
                        inv.totalAmount || inv.total || 0,
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="result-meta">
                      ₹
                      {safeNumber(inv.gstAmount || 0).toLocaleString(
                        undefined,
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        },
                      )}
                    </td>
                    <td
                      onClick={(e) => e.stopPropagation()}
                      role="presentation"
                    >
                      <select
                        className="payment-status-dropdown"
                        value={inv.paymentStatus || "PENDING"}
                        disabled={inv.paymentStatus === "PAID"}
                        onChange={(e) =>
                          updatePaymentStatus(inv.id, e.target.value)
                        }
                      >
                        <option value="PENDING">Pending</option>
                        <option value="PARTIAL">Partially Paid</option>
                        <option value="PAID">Paid</option>
                      </select>
                    </td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                        }}
                      >
                        <button
                          className="micro-btn"
                          title="View"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDrawer("invoice-detail", inv);
                          }}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="micro-btn"
                          title="Edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDrawer("edit-purchase", inv);
                          }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="micro-btn"
                          title="Return"
                          style={{
                            color: "var(--danger)",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRow(inv);
                            setShowReturnModal(true);
                            loadReturnBatches(inv);
                          }}
                        >
                          <ArrowLeft size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td
                    colSpan="11"
                    style={{
                      textAlign: "center",
                      padding: "20px",
                    }}
                  >
                    No invoices found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )
      )}

      {!loading && activeTab === "orders" && (
        <table className="purchase-table">
          <thead>
            <tr>
              <th>Supplier</th>
              <th>Date</th>
              <th>Items</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((po) => (
              <tr
                role="button"
                tabIndex={0}
                key={po.id}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.currentTarget.click();
                  }
                }}
                onClick={() => handleOpenDrawer("invoice-detail", po)}
              >
                <td
                  style={{
                    fontWeight: 700,
                  }}
                >
                  {po.supplier?.name || po.supplierName || "-"}
                </td>
                <td>{po.date || formatDate(po.createdAt)}</td>
                <td>{po.items?.length || po.items || 0}</td>
                <td>
                  <span
                    className={`p-status ${(po.status || "").toLowerCase()}`}
                  >
                    {po.status || "PENDING"}
                  </span>
                </td>
                <td>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                    }}
                  >
                    <button
                      className="micro-btn"
                      title="View"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDrawer("invoice-detail", po);
                      }}
                    >
                      <Eye size={14} />
                    </button>
                    {(po.status === "DRAFT" ||
                      po.status === "PENDING" ||
                      po.status === "PENDING_APPROVAL") && (
                      <button
                        className="pos-btn"
                        style={{
                          padding: "4px 10px",
                          fontSize: "11px",
                          backgroundColor: "var(--primary)",
                          color: "white",
                        }}
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (isApprovingPORef.current) return;
                          isApprovingPORef.current = true;
                          try {
                            await api.patch(
                              `${API_ROUTES.PURCHASES_ORDERS}/${po.id}/status`,
                              {
                                status: "APPROVED",
                              },
                            );
                            showToast(
                              "Purchase Order approved successfully!",
                              "success",
                            );
                            await refreshData();
                          } catch (err) {
                            console.error(err);
                            showToast(
                              err.response?.data?.error ||
                                err.message ||
                                "Failed to approve order",
                              "error",
                            );
                          } finally {
                            isApprovingPORef.current = false;
                          }
                        }}
                      >
                        <Check size={12} /> Approve
                      </button>
                    )}
                    {(po.status === "APPROVED" ||
                      po.status === "ORDERED" ||
                      po.status === "PARTIALLY_RECEIVED") && (
                      <button
                        className="pos-btn teal"
                        style={{
                          padding: "4px 10px",
                          fontSize: "11px",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenReceiveModal(po);
                        }}
                      >
                        <Truck size={12} /> Receive
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredOrders.length === 0 && (
              <tr>
                <td
                  colSpan="7"
                  style={{
                    textAlign: "center",
                    padding: "20px",
                  }}
                >
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {!loading && activeTab === "returns" && (
        <table className="purchase-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Return #</th>
              <th>Supplier</th>
              <th>Orig Inv</th>
              <th>Items</th>
              <th>Value</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReturns.map((ret) => (
              <tr
                role="button"
                tabIndex={0}
                key={ret.id}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.currentTarget.click();
                  }
                }}
                onClick={() => handleOpenDrawer("invoice-detail", ret)}
              >
                <td>{ret.date || formatDate(ret.createdAt)}</td>
                <td
                  style={{
                    fontWeight: 700,
                  }}
                >
                  {ret.returnNumber || ret.id}
                </td>
                <td>
                  {ret.supplier?.name || ret.supplierName || ret.supplier}
                </td>
                <td className="result-meta">
                  {ret.purchaseInvoice?.invoiceNumber ||
                    ret.originalInvoiceId ||
                    ret.origInv ||
                    ret.purchaseInvoiceId ||
                    "-"}
                </td>
                <td>
                  {ret.items?.length || ret.supplierReturnItems?.length || 0}
                </td>
                <td
                  style={{
                    fontWeight: 700,
                    color: "var(--danger)",
                  }}
                >
                  ₹
                  {safeNumber(
                    ret.returnAmount || ret.refundAmount || ret.value || 0,
                  ).toLocaleString()}
                </td>
                <td>
                  <span
                    className="badge-paid"
                    style={{
                      background: "rgba(239, 68, 68, 0.1)",
                      color: "var(--danger)",
                    }}
                  >
                    {ret.reason}
                  </span>
                </td>
                <td>
                  <span
                    className={`p-status ${(ret.status || "").toLowerCase()}`}
                  >
                    {ret.status || "PROCESSED"}
                  </span>
                </td>
                <td>
                  <button
                    className="micro-btn"
                    title="View"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDrawer("invoice-detail", ret);
                    }}
                  >
                    <Eye size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {filteredReturns.length === 0 && (
              <tr>
                <td
                  colSpan="9"
                  style={{
                    textAlign: "center",
                    padding: "20px",
                  }}
                >
                  No returns found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      <div
        style={{
          padding: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "var(--overlay-01)",
        }}
      >
        <div className="result-meta">
          Total this period:{" "}
          <b
            style={{
              color: "var(--text)",
            }}
          >
            ₹
            {(activeTab === "invoices"
              ? filteredInvoices.reduce(
                  (s, i) => s + safeNumber(i.totalAmount || i.total || 0),
                  0,
                )
              : activeTab === "orders"
                ? filteredOrders.reduce(
                    (s, i) => s + safeNumber(i.totalAmount || i.total || 0),
                    0,
                  )
                : filteredReturns.reduce(
                    (s, i) =>
                      s +
                      safeNumber(
                        i.returnAmount || i.refundAmount || i.value || 0,
                      ),
                    0,
                  )
            ).toLocaleString()}
          </b>{" "}
          {activeTab !== "returns" && (
            <>
              | GST input credit:{" "}
              <b
                style={{
                  color: "var(--primary)",
                }}
              >
                ₹
                {(activeTab === "invoices"
                  ? filteredInvoices.reduce(
                      (s, i) => s + safeNumber(i.gstAmount || i.gst || 0),
                      0,
                    )
                  : filteredOrders.reduce(
                      (s, i) => s + safeNumber(i.gstAmount || i.gst || 0),
                      0,
                    )
                ).toLocaleString()}
              </b>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
export function PurchaseManagementSection2({
  drawer,
  closeDrawer,
  suppliers,
  selectedSupplier,
  setSelectedSupplier,
  hasMultipleBranches,
  branches,
  selectedBranchId,
  setSelectedBranchId,
  expectedDeliveryDate,
  setExpectedDeliveryDate,
  paymentMode,
  setPaymentMode,
  paymentTermsDays,
  setPaymentTermsDays,
  medicineSearch,
  setMedicineSearch,
  loadingMedicines,
  filteredMedicines,
  addMedicine,
  medicines,
  purchaseItems,
  updateItem,
  removeMedicine,
  supplierCredit,
  selectedRow,
  setCreditAmountToApply,
  selectedCreditNoteId,
  setSelectedCreditNoteId,
  creditAmountToApply,
  applyingCredit,
  handleApplyCredit,
  saving,
  isFormInvalid,
  handleSavePurchase,
  downloadPurchasePDF,
  handleKeyDown,
}) {
  return (
    <AnimatePresence>
      {drawer && (
        <m.div
          role="button"
          tabIndex={0}
          className="stock-modal-overlay"
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          exit={{
            opacity: 0,
          }}
          onKeyDown={handleKeyDown}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeDrawer();
            }
          }}
        >
          <m.div
            className="p-drawer"
            initial={{
              x: "100%",
            }}
            animate={{
              x: 0,
            }}
            exit={{
              x: "100%",
            }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 200,
            }}
          >
            <div className="p-drawer-header">
              <div>
                <h2
                  style={{
                    fontFamily: "Outfit",
                    fontWeight: 700,
                  }}
                >
                  {drawer === "new-purchase"
                    ? "Create Purchase Order"
                    : drawer === "edit-purchase"
                      ? "Edit Purchase Invoice"
                      : selectedRow?.invoiceNumber ||
                        selectedRow?.poNumber ||
                        selectedRow?.id}
                </h2>
                {drawer === "invoice-detail" && (
                  <span
                    className={`p-status ${(selectedRow?.paymentStatus || selectedRow?.status || "PENDING").toLowerCase().replace(/[\s_-]+/g, "")}`}
                  >
                    {selectedRow?.paymentStatus ||
                      selectedRow?.status ||
                      "PENDING"}
                  </span>
                )}
              </div>
              <button className="micro-btn" onClick={closeDrawer}>
                <X size={20} />
              </button>
            </div>

            <div className="p-drawer-body">
              {drawer !== "invoice-detail" ? (
                <>
                  <div className="p-form-card">
                    <span className="p-label">SUPPLIER DETAILS</span>
                    <div className="pos-input-group">
                      <select
                        className="pos-input"
                        style={{
                          width: "100%",
                        }}
                        value={selectedSupplier?.name || ""}
                        onChange={(e) => {
                          const s = suppliers.find(
                            (s) =>
                              (s.name || s.supplierName) === e.target.value,
                          );
                          setSelectedSupplier(s);
                        }}
                      >
                        <option value="">Select Supplier...</option>
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.name || s.supplierName}>
                            {s.name || s.supplierName}
                          </option>
                        ))}
                      </select>
                    </div>
                    {hasMultipleBranches && (
                      <div
                        className="pos-input-group"
                        style={{
                          marginTop: "16px",
                        }}
                      >
                        <span className="p-label">BRANCH</span>
                        <select
                          required
                          className="pos-input"
                          style={{
                            width: "100%",
                          }}
                          value={selectedBranchId}
                          onChange={(e) => setSelectedBranchId(e.target.value)}
                        >
                          <option value="">Select Branch...</option>
                          {branches.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {selectedSupplier && (
                      <div className="supplier-preview-card">
                        <div className="supplier-preview-name">
                          {selectedSupplier.name}
                        </div>
                        <div className="supplier-preview-meta">
                          {selectedSupplier.terms} | Lead Time:{" "}
                          {selectedSupplier.leadTime}
                        </div>
                      </div>
                    )}
                    <div
                      className="p-form-grid"
                      style={{
                        marginTop: "16px",
                      }}
                    >
                      <div className="pos-input-group">
                        <label htmlFor="field_z2wcnf" className="p-label">
                          EXPECTED DELIVERY DATE
                        </label>
                        <input
                          id="field_z2wcnf"
                          className="pos-input"
                          type="date"
                          value={expectedDeliveryDate}
                          onChange={(e) =>
                            setExpectedDeliveryDate(e.target.value)
                          }
                        />
                      </div>
                      <div className="pos-input-group">
                        <label htmlFor="field_p43wud" className="p-label">
                          PAYMENT MODE
                        </label>
                        <select
                          id="field_p43wud"
                          className="pos-input"
                          value={paymentMode}
                          onChange={(e) => setPaymentMode(e.target.value)}
                        >
                          <option value="CASH">Cash</option>
                          <option value="CREDIT">Credit</option>
                          <option value="UPI">UPI</option>
                          <option value="NET_BANKING">Net Banking</option>
                          <option value="CARD">Card</option>
                        </select>
                      </div>
                      <div className="pos-input-group">
                        <label htmlFor="field_2dh370" className="p-label">
                          PAYMENT TERMS (DAYS)
                        </label>
                        <input
                          id="field_2dh370"
                          className="pos-input"
                          type="number"
                          min={0}
                          max={365}
                          placeholder="e.g. 30"
                          value={paymentTermsDays}
                          onChange={(e) => setPaymentTermsDays(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-form-card">
                    <span className="p-label">ADD MEDICINES</span>
                    <div className="medicine-toolbar">
                      <div
                        className="medicine-search-wrapper"
                        style={{
                          position: "relative",
                        }}
                      >
                        <>
                          <label htmlFor="field_rsblif" className="sr-only">
                            Search medicine to add...
                          </label>
                          <input
                            required
                            className="pos-input medicine-search-input"
                            placeholder="Search medicine to add..."
                            value={medicineSearch}
                            onChange={(e) => setMedicineSearch(e.target.value)}
                            onKeyDown={(e) => {
                              if (
                                e.key === "Enter" &&
                                filteredMedicines.length > 0
                              ) {
                                addMedicine(filteredMedicines[0]);
                              }
                            }}
                            id="field_rsblif"
                          />
                        </>
                        {loadingMedicines ? (
                          <div
                            className="medicine-suggestions"
                            style={{
                              padding: "12px",
                              color: "rgba(255,255,255,0.5)",
                              fontSize: "12px",
                            }}
                          >
                            Loading inventory...
                          </div>
                        ) : (
                          medicineSearch &&
                          filteredMedicines.length > 0 && (
                            <div className="medicine-suggestions">
                              {filteredMedicines.map((m) => (
                                <div
                                  role="button"
                                  tabIndex={0}
                                  key={m.id}
                                  className="medicine-suggestion-item"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      e.currentTarget.click();
                                    }
                                  }}
                                  onClick={() => addMedicine(m)}
                                >
                                  <span>{m.name}</span>
                                  <span
                                    style={{
                                      color: "var(--primary)",
                                      fontWeight: 600,
                                    }}
                                  >
                                    ₹{m.purchasePrice}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )
                        )}
                      </div>
                      <button
                        className="medicine-tool-btn"
                        title="Scan Barcode"
                      >
                        <ScanLine size={16} />
                        Scan
                      </button>
                      <button
                        className="medicine-tool-btn"
                        title="Add Manually"
                      >
                        <Plus size={16} />
                        Manual
                      </button>
                    </div>

                    <div className="recent-medicines">
                      <span className="recent-medicines-label">Recent</span>
                      <div className="recent-medicines-list">
                        {medicines.slice(0, 4).map((m) => (
                          <button
                            key={m.id}
                            className="recent-medicine-chip"
                            onClick={() => addMedicine(m)}
                          >
                            <Package size={12} />
                            {m.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <table className="p-line-table">
                      <thead>
                        <tr>
                          <th>Medicine</th>
                          <th>Required Qty</th>
                          <th></th>
                        </tr>
                      </thead>
                      {purchaseItems.length === 0 ? (
                        <tbody>
                          <tr>
                            <td
                              colSpan={3}
                              style={{
                                textAlign: "center",
                                padding: "24px",
                                color: "rgba(255,255,255,0.25)",
                                fontSize: "13px",
                              }}
                            >
                              No medicines added yet. Search and add from above.
                            </td>
                          </tr>
                        </tbody>
                      ) : (
                        <tbody>
                          {purchaseItems.map((item) => (
                            <tr key={item.id}>
                              <td
                                style={{
                                  fontSize: "12px",
                                }}
                              >
                                <b>{item.name}</b>
                              </td>
                              <td>
                                <input
                                  required
                                  className="p-cost-input"
                                  style={{
                                    width: "60px",
                                  }}
                                  type="number"
                                  min={1}
                                  value={item.qty}
                                  onChange={(e) =>
                                    updateItem(item.id, "qty", e.target.value)
                                  }
                                />
                              </td>
                              <td>
                                <button
                                  className="micro-btn"
                                  style={{
                                    color: "var(--danger)",
                                  }}
                                  onClick={() => removeMedicine(item.id)}
                                >
                                  <X size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      )}
                    </table>

                    {purchaseItems.length > 0 && (
                      <div
                        className="result-meta"
                        style={{
                          padding: "12px 0",
                          fontSize: "12px",
                        }}
                      >
                        {purchaseItems.length} medicine
                        {purchaseItems.length > 1 ? "s" : ""} added. Pricing,
                        GST, batch, and expiry will be entered during Goods
                        Receipt.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="detail-view">
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">SUPPLIER</span>
                      <span className="detail-value">
                        {selectedRow?.supplier?.name ||
                          selectedRow?.supplier ||
                          "-"}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">DATE</span>
                      <span className="detail-value">
                        {selectedRow?.date ||
                          formatDate(selectedRow?.createdAt)}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">REF #</span>
                      <span className="detail-value">
                        {selectedRow?.referenceNumber ||
                          selectedRow?.ref ||
                          selectedRow?.invoiceNumber ||
                          selectedRow?.returnNumber ||
                          selectedRow?.orderNumber ||
                          "-"}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: "32px",
                    }}
                  >
                    <span className="p-label">ITEMS & BATCHES</span>
                    <table className="p-line-table">
                      <thead>
                        <tr>
                          <th>Medicine</th>
                          <th>Batch #</th>
                          <th>Expiry</th>
                          <th
                            style={{
                              textAlign: "right",
                            }}
                          >
                            Price ₹
                          </th>
                          <th
                            style={{
                              textAlign: "right",
                            }}
                          >
                            Qty
                          </th>
                          <th
                            style={{
                              textAlign: "right",
                            }}
                          >
                            Total ₹
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(
                          selectedRow?.items ||
                          selectedRow?.inventoryBatches ||
                          selectedRow?.supplierReturnItems ||
                          []
                        ).map((item) => {
                          const unitPrice = safeNumber(
                            item.purchasePrice ||
                              item.unitPrice ||
                              item.price ||
                              0,
                          );
                          const qty = safeNumber(
                            item.quantity || item.receivedQuantity || 0,
                          );
                          const lineTotal = unitPrice * qty;
                          return (
                            <tr key={item.id || item.medicineId}>
                              <td>
                                <div
                                  style={{
                                    fontWeight: 600,
                                  }}
                                >
                                  {item.medicine?.name ||
                                    item.medicineName ||
                                    item.name ||
                                    "-"}
                                </div>
                              </td>
                              <td>
                                {item.batchNumber ? (
                                  <span className="batch-pill">
                                    {item.batchNumber}
                                  </span>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td>
                                {item.expiryDate
                                  ? formatDate(item.expiryDate)
                                  : "-"}
                              </td>
                              <td
                                style={{
                                  textAlign: "right",
                                }}
                              >
                                {unitPrice > 0
                                  ? `₹${unitPrice.toFixed(2)}`
                                  : "-"}
                              </td>
                              <td
                                style={{
                                  textAlign: "right",
                                  fontWeight: 600,
                                }}
                              >
                                {qty}
                              </td>
                              <td
                                style={{
                                  textAlign: "right",
                                  fontWeight: 700,
                                }}
                              >
                                {lineTotal > 0
                                  ? `₹${lineTotal.toFixed(2)}`
                                  : "-"}
                              </td>
                            </tr>
                          );
                        })}
                        {(!(
                          selectedRow?.items ||
                          selectedRow?.inventoryBatches ||
                          selectedRow?.supplierReturnItems
                        ) ||
                          (
                            selectedRow?.items ||
                            selectedRow?.inventoryBatches ||
                            selectedRow?.supplierReturnItems
                          )?.length === 0) && (
                          <tr>
                            <td colSpan="6">No item details available.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {supplierCredit.notes.length > 0 &&
                    selectedRow &&
                    safeNumber(
                      selectedRow.balanceAmount ||
                        selectedRow.totalAmount ||
                        selectedRow.total ||
                        0,
                    ) > 0 && (
                      <div
                        className="detail-summary-card"
                        style={{
                          marginTop: "16px",
                          border: "1px dashed var(--primary)",
                        }}
                      >
                        <h4
                          style={{
                            marginBottom: "12px",
                            color: "var(--primary)",
                          }}
                        >
                          Available Supplier Credit: ₹
                          {supplierCredit.available.toFixed(2)}
                        </h4>
                        <div
                          className="pos-input-group"
                          style={{
                            marginBottom: "12px",
                          }}
                        >
                          <label htmlFor="field_rqu9nr">
                            Select Credit Note
                          </label>
                          <select
                            id="field_rqu9nr"
                            className="pos-input"
                            value={selectedCreditNoteId}
                            onChange={(e) => {
                              setSelectedCreditNoteId(e.target.value);
                              const maxApp = Math.min(
                                safeNumber(
                                  supplierCredit.notes.find(
                                    (n) => n.id === e.target.value,
                                  )?.remainingAmount || 0,
                                ),
                                safeNumber(
                                  selectedRow.balanceAmount ||
                                    selectedRow.totalAmount ||
                                    selectedRow.total ||
                                    0,
                                ),
                              );
                              setCreditAmountToApply(maxApp);
                            }}
                          >
                            <option value="">-- Select Credit Note --</option>
                            {supplierCredit.notes.map((note) => (
                              <option key={note.id} value={note.id}>
                                {note.id.slice(-6).toUpperCase()} - Balance: ₹
                                {safeNumber(note.remainingAmount).toFixed(2)}
                              </option>
                            ))}
                          </select>
                        </div>
                        {selectedCreditNoteId && (
                          <div
                            className="pos-input-group"
                            style={{
                              marginBottom: "12px",
                            }}
                          >
                            <label htmlFor="field_int1v7">
                              Amount to Apply
                            </label>
                            <input
                              id="field_int1v7"
                              type="number"
                              className="pos-input"
                              value={creditAmountToApply}
                              max={Math.min(
                                safeNumber(
                                  supplierCredit.notes.find(
                                    (n) => n.id === selectedCreditNoteId,
                                  )?.remainingAmount || 0,
                                ),
                                safeNumber(
                                  selectedRow.balanceAmount ||
                                    selectedRow.totalAmount ||
                                    selectedRow.total ||
                                    0,
                                ),
                              )}
                              onChange={(e) =>
                                setCreditAmountToApply(e.target.value)
                              }
                            />
                          </div>
                        )}
                        <button
                          className="pos-btn teal"
                          style={{
                            width: "100%",
                            marginTop: "8px",
                          }}
                          disabled={
                            applyingCredit ||
                            !selectedCreditNoteId ||
                            creditAmountToApply <= 0
                          }
                          onClick={handleApplyCredit}
                        >
                          {applyingCredit
                            ? "Applying..."
                            : "Apply Credit to Invoice"}
                        </button>
                      </div>
                    )}
                </div>
              )}
            </div>

            <div className="p-drawer-footer">
              <button
                className="pos-btn outline"
                style={{
                  flex: 1,
                }}
                onClick={closeDrawer}
              >
                Cancel
              </button>
              {drawer === "invoice-detail" ? (
                <button
                  className="pos-btn teal"
                  style={{
                    flex: 2,
                  }}
                  onClick={() =>
                    selectedRow && downloadPurchasePDF(selectedRow)
                  }
                >
                  <Download size={16} /> Download PDF
                </button>
              ) : (
                <button
                  className={`pos-btn teal ${saving || isFormInvalid ? "btn-disabled" : ""}`}
                  style={{
                    flex: 2,
                  }}
                  onClick={handleSavePurchase}
                  disabled={saving || isFormInvalid}
                >
                  {saving
                    ? "Saving..."
                    : drawer === "edit-purchase"
                      ? "Save Changes"
                      : "Create Purchase Order"}
                </button>
              )}
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
