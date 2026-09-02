import { useState, useEffect, useCallback, useReducer, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api.js";
import { useAuth } from "../hooks/useAuth.js";
import { API_ROUTES } from "../constants/api.routes.js";
import { getMedicines } from "../services/inventory.service";
import {
  createPurchaseOrder,
  receivePurchaseOrder,
} from "../services/purchases.service.js";
import {
  getSupplierCreditBalance,
  getCreditNotes,
  applyCreditNote,
} from "../services/supplier-returns.service.js";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  ShoppingCart,
  Clock,
  ArrowLeft,
  Building2,
  Plus,
  X,
  Package,
  Loader2,
} from "lucide-react";
import { AnimatePresence, m } from "framer-motion";
import {
  Spinner,
  PurchaseManagementSection1,
  PurchaseManagementSection2,
} from "./Purchase/Purchase.jsx";
import { safeNumber } from "../utils/number.js";
import { safeData } from "../utils/safeData.js";
import { formatDate } from "../utils/formUtils.js";

function PurchaseManagementSection3({
  showReturnModal,
  selectedRow,
  loadingReturnBatches,
  returnSelections,
  setReturnSelections,
  handleProcessReturn,
  setShowReturnModal,
}) {
  return (
    <AnimatePresence>
      {showReturnModal && selectedRow && (
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
                }}
              >
                Process Supplier Return
              </h3>
              <button
                className="micro-btn"
                onClick={() => setShowReturnModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="stock-modal-body">
              <div className="pos-input-group">
                <label htmlFor="field_jx5ul9">Original Invoice</label>
                <input
                  id="field_jx5ul9"
                  required
                  className="pos-input"
                  value={selectedRow?.invoiceNumber || selectedRow?.id || ""}
                  disabled
                  style={{
                    width: "100%",
                  }}
                />
              </div>
              {loadingReturnBatches ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "20px",
                  }}
                >
                  <Loader2 className="spin" size={24} />
                  <p
                    style={{
                      marginTop: 12,
                      color: "var(--text-muted)",
                    }}
                  >
                    Loading available batches...
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    marginTop: "16px",
                  }}
                >
                  {returnSelections.length === 0 ? (
                    <div>No items found to return.</div>
                  ) : (
                    returnSelections.map((sel, idx) => (
                      <div
                        key={sel.medicineId}
                        style={{
                          padding: "12px",
                          marginBottom: "12px",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                          background: "var(--bg-card)",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 600,
                            marginBottom: "8px",
                            fontSize: "0.9rem",
                          }}
                        >
                          {sel.medicineName}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            alignItems: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          <div
                            style={{
                              flex: 2,
                              minWidth: "140px",
                            }}
                          >
                            <select
                              className="pos-input"
                              style={{
                                width: "100%",
                                fontSize: "0.8rem",
                              }}
                              value={sel.selectedBatchId}
                              onChange={(e) => {
                                const batch = sel.batches.find(
                                  (b) => b.id === e.target.value,
                                );
                                const newSel = [...returnSelections];
                                newSel[idx] = {
                                  ...sel,
                                  selectedBatchId: e.target.value,
                                  quantity: batch
                                    ? Math.min(sel.quantity, batch.quantity)
                                    : 0,
                                  maxQuantity: batch ? batch.quantity : 0,
                                };
                                setReturnSelections(newSel);
                              }}
                            >
                              <option value="">Select batch</option>
                              {sel.batches.map((b) => (
                                <option key={b.id} value={b.id}>
                                  {b.batchNumber} (Qty: {b.quantity}, Exp:{" "}
                                  {b.expiryDate
                                    ? new Date(
                                        b.expiryDate,
                                      ).toLocaleDateString()
                                    : "N/A"}
                                  )
                                </option>
                              ))}
                            </select>
                          </div>
                          <div
                            style={{
                              flex: 1,
                              minWidth: "80px",
                            }}
                          >
                            <>
                              <label htmlFor="field_6hhe3w" className="sr-only">
                                Qty
                              </label>
                              <input
                                required
                                className="p-cost-input"
                                type="number"
                                min={0}
                                max={sel.maxQuantity}
                                value={sel.quantity}
                                onChange={(e) => {
                                  const newSel = [...returnSelections];
                                  newSel[idx] = {
                                    ...sel,
                                    quantity: Math.min(
                                      safeNumber(e.target.value) || 0,
                                      sel.maxQuantity,
                                    ),
                                  };
                                  setReturnSelections(newSel);
                                }}
                                style={{
                                  width: "100%",
                                }}
                                placeholder="Qty"
                                disabled={!sel.selectedBatchId}
                                id="field_6hhe3w"
                              />
                            </>
                          </div>
                          <span
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--text-muted)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            Max: {sel.maxQuantity}
                          </span>
                        </div>
                        {sel.selectedBatchId && sel.quantity <= 0 && (
                          <div
                            style={{
                              color: "var(--danger)",
                              fontSize: "0.75rem",
                              marginTop: "4px",
                            }}
                          >
                            Enter a quantity to return
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <div className="stock-modal-footer">
              <button
                className="pos-btn outline"
                onClick={() => {
                  setShowReturnModal(false);
                  setReturnSelections([]);
                }}
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
                onClick={handleProcessReturn}
                disabled={loadingReturnBatches}
              >
                Submit Return
              </button>
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}
function PurchaseManagementSection4({
  showReceiveModal,
  selectedRow,
  grnInvoiceNumber,
  setGrnInvoiceNumber,
  grnInvoiceDate,
  setGrnInvoiceDate,
  receiveItems,
  setReceiveItems,
  setDifferentBatch,
  setShowReceiveModal,
  isReceiving,
  handleReceiveOrder,
}) {
  return (
    <AnimatePresence>
      {showReceiveModal && selectedRow && (
        <div className="stock-modal-overlay">
          <m.div
            className="stock-modal-content"
            style={{
              width: "1100px",
              maxWidth: "95vw",
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
                Confirm Order Receipt
              </h3>
              <button
                className="micro-btn"
                onClick={() => {
                  setShowReceiveModal(false);
                  setDifferentBatch({});
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="stock-modal-body">
              <p
                className="result-meta"
                style={{
                  marginBottom: "16px",
                }}
              >
                Enter supplier invoice details and confirm quantities received
                for {selectedRow?.orderNumber || selectedRow?.id}.
              </p>

              {/* Supplier Invoice Details */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                  marginBottom: "20px",
                  padding: "16px",
                  background: "var(--overlay-01)",
                  borderRadius: "8px",
                  border: "1px solid var(--outline-variant)",
                }}
              >
                <div className="pos-input-group">
                  <label htmlFor="field_cy4yvz" className="p-label">
                    SUPPLIER INVOICE NUMBER *
                  </label>
                  <input
                    id="field_cy4yvz"
                    required
                    className="pos-input"
                    placeholder="e.g. INV-24589"
                    value={grnInvoiceNumber}
                    onChange={(e) => setGrnInvoiceNumber(e.target.value)}
                  />
                </div>
                <div className="pos-input-group">
                  <label htmlFor="field_y0ugjw" className="p-label">
                    INVOICE DATE *
                  </label>
                  <input
                    id="field_y0ugjw"
                    required
                    className="pos-input"
                    type="date"
                    value={grnInvoiceDate}
                    onChange={(e) => setGrnInvoiceDate(e.target.value)}
                  />
                </div>
              </div>

              <div
                style={{
                  overflowX: "auto",
                }}
              >
                <table className="p-line-table">
                  <thead>
                    <tr>
                      <th>Medicine</th>
                      <th>Ordered Qty</th>
                      <th>Prev Received Qty</th>
                      <th>Pending Qty</th>
                      <th>Receive Qty</th>
                      <th>Batch #</th>
                      <th>Expiry</th>
                      <th>Purchase Price</th>
                      <th>MRP</th>
                      <th>GST %</th>
                      <th
                        style={{
                          width: 80,
                          textAlign: "center",
                        }}
                      >
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {receiveItems.map((item, idx) => {
                      return (
                        <tr key={item.id || item.medicineId}>
                          <td>
                            {item.medicine?.name ||
                              item.medicineName ||
                              item.name ||
                              "-"}
                          </td>
                          <td>{item.orderedQuantity}</td>
                          <td>{item.prevReceivedQuantity}</td>
                          <td>{item.pendingQuantity}</td>
                          <td>
                            <input
                              required
                              className="p-cost-input"
                              style={{
                                width: "60px",
                              }}
                              type="number"
                              min={0}
                              max={item.pendingQuantity}
                              value={item.receivedQuantity}
                              onChange={(e) => {
                                const newItems = [...receiveItems];
                                newItems[idx].receivedQuantity = e.target.value;
                                setReceiveItems(newItems);
                              }}
                            />
                          </td>
                          <td>
                            <>
                              <label htmlFor="field_n9afr2" className="sr-only">
                                Batch...
                              </label>
                              <input
                                required
                                className="p-cost-input"
                                placeholder="Batch..."
                                value={item.batchNumber || ""}
                                onChange={(e) => {
                                  const newItems = [...receiveItems];
                                  newItems[idx].batchNumber = e.target.value;
                                  setReceiveItems(newItems);
                                }}
                                id="field_n9afr2"
                              />
                            </>
                          </td>
                          <td>
                            <input
                              required
                              className="p-cost-input"
                              type="date"
                              value={item.expiryDate || ""}
                              onChange={(e) => {
                                const newItems = [...receiveItems];
                                newItems[idx].expiryDate = e.target.value;
                                setReceiveItems(newItems);
                              }}
                            />
                          </td>
                          <td>
                            <input
                              required
                              className="p-cost-input"
                              style={{
                                width: "80px",
                              }}
                              type="number"
                              step="0.01"
                              value={item.purchasePrice}
                              onChange={(e) => {
                                const newItems = [...receiveItems];
                                newItems[idx].purchasePrice = e.target.value;
                                setReceiveItems(newItems);
                              }}
                            />
                          </td>
                          <td>
                            <input
                              required
                              className="p-cost-input"
                              style={{
                                width: "80px",
                              }}
                              type="number"
                              step="0.01"
                              value={item.mrp}
                              onChange={(e) => {
                                const newItems = [...receiveItems];
                                newItems[idx].mrp = e.target.value;
                                setReceiveItems(newItems);
                              }}
                            />
                          </td>
                          <td>
                            <input
                              required
                              className="p-cost-input"
                              style={{
                                width: "60px",
                              }}
                              type="number"
                              min={0}
                              max={100}
                              step="0.01"
                              value={item.gstPercentage ?? 0}
                              onChange={(e) => {
                                const newItems = [...receiveItems];
                                newItems[idx].gstPercentage = e.target.value;
                                setReceiveItems(newItems);
                              }}
                            />
                          </td>
                          <td
                            style={{
                              textAlign: "center",
                            }}
                          >
                            {item.isExtra ? (
                              <button
                                type="button"
                                className="p-btn p-btn-danger"
                                style={{
                                  padding: "4px 8px",
                                  fontSize: "12px",
                                }}
                                onClick={() => {
                                  const newItems = [...receiveItems];
                                  newItems.splice(idx, 1);
                                  setReceiveItems(newItems);
                                }}
                                title="Remove Batch"
                              >
                                🗑️
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="p-btn p-btn-secondary"
                                style={{
                                  padding: "4px 8px",
                                  fontSize: "12px",
                                }}
                                onClick={() => {
                                  const newItems = [...receiveItems];
                                  newItems.splice(idx + 1, 0, {
                                    ...item,
                                    receivedQuantity: 0,
                                    batchNumber: "",
                                    expiryDate: "",
                                    isExtra: true,
                                  });
                                  setReceiveItems(newItems);
                                }}
                                title="Add Different Batch"
                              >
                                ➕ Batch
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {receiveItems.length === 0 && (
                      <tr>
                        <td colSpan="11">No items to receive.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="stock-modal-footer">
              <button
                className="pos-btn outline"
                onClick={() => {
                  setShowReceiveModal(false);
                  setDifferentBatch({});
                }}
                disabled={isReceiving}
              >
                Cancel
              </button>
              <button
                className="pos-btn teal"
                onClick={handleReceiveOrder}
                disabled={isReceiving}
              >
                {isReceiving ? "Receiving..." : "Confirm Receipt"}
              </button>
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}
export default function PurchaseManagement({ showToast, storeProfile }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [purchaseState, dispatchPurchase] = useReducer(
    (state, action) => {
      if (action.type === "SET_FIELD") {
        return {
          ...state,
          [action.field]:
            typeof action.value === "function"
              ? action.value(state[action.field])
              : action.value,
        };
      }
      return state;
    },
    {
      activeTab: "invoices",
      drawer: null,
      selectedRow: null,
      branches: [],
      selectedBranchId: "",
      showReturnModal: false,
      returnSelections: [],
      loadingReturnBatches: false,
      showReceiveModal: false,
      medicines: [],
      suppliers: [],
      orders: [],
      loadingMedicines: false,
      returns: [],
      invoices: [],
      purchaseItems: [],
      loading: false,
      receiveItems: [],
      isReceiving: false,
      differentBatch: {},
    },
  );
  const {
    activeTab,
    drawer,
    selectedRow,
    branches,
    selectedBranchId,
    showReturnModal,
    returnSelections,
    loadingReturnBatches,
    showReceiveModal,
    medicines,
    suppliers,
    orders,
    loadingMedicines,
    returns,
    invoices,
    purchaseItems,
    loading,
    receiveItems,
    isReceiving,
  } = purchaseState;
  const isOpeningReceiveModalRef = useRef(false);
  const isUpdatingPaymentRef = useRef(false);
  const isProcessingReturnRef = useRef(false);
  const isApprovingPORef = useRef(false);
  const setActiveTab = useCallback(
    (val) =>
      dispatchPurchase({
        type: "SET_FIELD",
        field: "activeTab",
        value: val,
      }),
    [],
  );
  const setDrawer = useCallback(
    (val) =>
      dispatchPurchase({
        type: "SET_FIELD",
        field: "drawer",
        value: val,
      }),
    [],
  );
  const setSelectedRow = useCallback(
    (val) =>
      dispatchPurchase({
        type: "SET_FIELD",
        field: "selectedRow",
        value: val,
      }),
    [],
  );
  const setBranches = useCallback(
    (val) =>
      dispatchPurchase({
        type: "SET_FIELD",
        field: "branches",
        value: val,
      }),
    [],
  );
  const setSelectedBranchId = useCallback(
    (val) =>
      dispatchPurchase({
        type: "SET_FIELD",
        field: "selectedBranchId",
        value: val,
      }),
    [],
  );
  const setShowReturnModal = useCallback(
    (val) =>
      dispatchPurchase({
        type: "SET_FIELD",
        field: "showReturnModal",
        value: val,
      }),
    [],
  );
  const setReturnSelections = useCallback(
    (val) =>
      dispatchPurchase({
        type: "SET_FIELD",
        field: "returnSelections",
        value: val,
      }),
    [],
  );
  const setLoadingReturnBatches = useCallback(
    (val) =>
      dispatchPurchase({
        type: "SET_FIELD",
        field: "loadingReturnBatches",
        value: val,
      }),
    [],
  );
  const setShowReceiveModal = useCallback(
    (val) =>
      dispatchPurchase({
        type: "SET_FIELD",
        field: "showReceiveModal",
        value: val,
      }),
    [],
  );
  const setMedicines = useCallback(
    (val) =>
      dispatchPurchase({
        type: "SET_FIELD",
        field: "medicines",
        value: val,
      }),
    [],
  );
  const setSuppliers = useCallback(
    (val) =>
      dispatchPurchase({
        type: "SET_FIELD",
        field: "suppliers",
        value: val,
      }),
    [],
  );
  const setOrders = useCallback(
    (val) =>
      dispatchPurchase({
        type: "SET_FIELD",
        field: "orders",
        value: val,
      }),
    [],
  );
  const setLoadingMedicines = useCallback(
    (val) =>
      dispatchPurchase({
        type: "SET_FIELD",
        field: "loadingMedicines",
        value: val,
      }),
    [],
  );
  const setReturns = useCallback(
    (val) =>
      dispatchPurchase({
        type: "SET_FIELD",
        field: "returns",
        value: val,
      }),
    [],
  );
  const setInvoices = useCallback(
    (val) =>
      dispatchPurchase({
        type: "SET_FIELD",
        field: "invoices",
        value: val,
      }),
    [],
  );
  const setPurchaseItems = useCallback(
    (val) =>
      dispatchPurchase({
        type: "SET_FIELD",
        field: "purchaseItems",
        value: val,
      }),
    [],
  );
  const setLoading = useCallback(
    (val) =>
      dispatchPurchase({
        type: "SET_FIELD",
        field: "loading",
        value: val,
      }),
    [],
  );
  const setReceiveItems = useCallback(
    (val) =>
      dispatchPurchase({
        type: "SET_FIELD",
        field: "receiveItems",
        value: val,
      }),
    [],
  );
  const setIsReceiving = useCallback(
    (val) =>
      dispatchPurchase({
        type: "SET_FIELD",
        field: "isReceiving",
        value: val,
      }),
    [],
  );
  const setDifferentBatch = useCallback(
    (val) =>
      dispatchPurchase({
        type: "SET_FIELD",
        field: "differentBatch",
        value: val,
      }),
    [],
  );
  const handleOpenReceiveModal = async (po) => {
    if (isOpeningReceiveModalRef.current) return;
    isOpeningReceiveModalRef.current = true;
    try {
      setSelectedRow(po);
      setDifferentBatch({});
      setGrnInvoiceNumber("");
      setGrnInvoiceDate(new Date().toISOString().split("T")[0]);
      let priorGRN = null;
      try {
        const { data } = await api.get(
          `${API_ROUTES.PURCHASES_ORDERS}/${po.id}`,
        );
        const order = data?.data || data;
        priorGRN = order?.goodsReceiptNotes?.[0] || null;
      } catch {
        // no prior GRN data available
      }
      setReceiveItems(
        (po.items || []).map((item) => {
          const remaining = Math.max(
            0,
            (item.quantity || 0) - (item.receivedQuantity || 0),
          );
          const priorItem = priorGRN?.items?.find(
            (gi) => gi.purchaseOrderItemId === item.id,
          );

          // Pre-fill batch/expiry from: 1) prior GRN data, 2) empty
          const batchNumber = priorItem?.batchNumber || "";
          const expiryDate = priorItem?.expiryDate
            ? priorItem.expiryDate.split("T")[0]
            : "";
          return {
            ...item,
            medicineId: item.medicineId,
            orderedQuantity: item.quantity || 0,
            prevReceivedQuantity: item.receivedQuantity || 0,
            pendingQuantity: remaining,
            receivedQuantity: remaining,
            batchNumber,
            expiryDate,
            purchasePrice: priorItem?.purchasePrice
              ? safeNumber(priorItem.purchasePrice)
              : 0,
            mrp: priorItem?.mrp ? safeNumber(priorItem.mrp) : 0,
            gstPercentage: priorItem?.gstPercentage
              ? safeNumber(priorItem.gstPercentage)
              : 0,
          };
        }),
      );
      setShowReceiveModal(true);
    } finally {
      isOpeningReceiveModalRef.current = false;
    }
  };
  const refreshData = async () => {
    try {
      const results = await Promise.allSettled([
        api.get(API_ROUTES.SUPPLIERS),
        api.get(API_ROUTES.PURCHASES_ORDERS),
        api.get(API_ROUTES.PURCHASES_RETURNS),
        api.get(API_ROUTES.PURCHASES_INVOICES),
        api.get("/branches"),
      ]);
      setSuppliers(safeData(results[0], "data"));
      setOrders(safeData(results[1], "data"));
      setReturns(safeData(results[2], "data"));
      setInvoices(safeData(results[3], "data"));
      setBranches(safeData(results[4], "data"));
    } catch (err) {
      console.error("[FETCH DATA ERROR]", err);
      showToast("Failed to load live data", "error");
    }
  };
  const updatePaymentStatus = async (invoiceId, status) => {
    if (isUpdatingPaymentRef.current) return;
    isUpdatingPaymentRef.current = true;
    try {
      await api.patch(
        `${API_ROUTES.PURCHASES_INVOICES_PAYMENT}/${invoiceId}/payment-status`,
        {
          paymentStatus: status,
        },
      );
      showToast("Payment status updated", "success");
      await refreshData();
    } catch (err) {
      showToast("Failed to update payment status", err);
    } finally {
      isUpdatingPaymentRef.current = false;
    }
  };
  useEffect(() => {
    let mounted = true;
    const initialize = async () => {
      try {
        setLoading(true);
        const results = await Promise.allSettled([
          api.get(API_ROUTES.SUPPLIERS),
          api.get(API_ROUTES.PURCHASES_ORDERS),
          api.get(API_ROUTES.PURCHASES_RETURNS),
          api.get(API_ROUTES.PURCHASES_INVOICES),
          api.get("/branches"),
        ]);
        if (!mounted) return;
        setSuppliers(safeData(results[0], "data"));
        setOrders(safeData(results[1], "data"));
        setReturns(safeData(results[2], "data"));
        setInvoices(safeData(results[3], "data"));
        setBranches(safeData(results[4], "data"));
        const failed = results.filter((r) => r.status === "rejected");
        if (failed.length > 0) {
          console.warn(
            `[PURCHASE] ${failed.length} API(s) failed, using partial data`,
          );
        }
      } catch (err) {
        console.error(err);
        if (mounted) {
          showToast("Failed to load live data", "error");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    initialize();
    return () => {
      mounted = false;
    };
  }, [
    setBranches,
    setInvoices,
    setLoading,
    setOrders,
    setReturns,
    setSuppliers,
    showToast,
  ]);
  useEffect(() => {}, [medicines]);
  useEffect(() => {}, [purchaseItems]);
  const loadMedicines = useCallback(async () => {
    try {
      setLoadingMedicines(true);
      const response = await getMedicines({
        page: 1,
        limit: 1000,
      });
      const items = response?.data?.data?.items || response?.data?.data || [];
      setMedicines(items);
    } catch (error) {
      console.error("LOAD MEDICINES ERROR:", error);
    } finally {
      setLoadingMedicines(false);
    }
  }, [setLoadingMedicines, setMedicines]);
  useEffect(() => {
    if (drawer || showReturnModal || showReceiveModal) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [drawer, showReturnModal, showReceiveModal]);

  /* ── Filter States ── */
  const [filters, setFilters] = useState({
    date: "",
    supplier: "All Suppliers",
    status: "All Status",
    search: "",
  });

  /* ── New Purchase Form State ── */
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [medicineSearch, setMedicineSearch] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [paymentMode, setPaymentMode] = useState("CREDIT");
  const [paymentTermsDays, setPaymentTermsDays] = useState("");
  const [saving, setSaving] = useState(false);

  /* ── Receive Goods Modal State ── */
  const [grnInvoiceNumber, setGrnInvoiceNumber] = useState("");
  const [grnInvoiceDate, setGrnInvoiceDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  /* ── Credit Application State ── */
  const [supplierCredit, setSupplierCredit] = useState({
    available: 0,
    notes: [],
  });
  const [selectedCreditNoteId, setSelectedCreditNoteId] = useState("");
  const [creditAmountToApply, setCreditAmountToApply] = useState(0);
  const [applyingCredit, setApplyingCredit] = useState(false);
  const filteredMedicines = medicines.filter((m) =>
    (m.name || "").toLowerCase().includes(medicineSearch.toLowerCase()),
  );
  const addMedicine = (medicine) => {
    const exists = purchaseItems.find((i) => i.id === medicine.id);
    if (exists) return;
    setPurchaseItems([
      ...purchaseItems,
      {
        ...medicine,
        qty: 1,
      },
    ]);
    setMedicineSearch("");
  };
  const updateItem = (id, field, value) => {
    setPurchaseItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: field === "qty" ? safeNumber(value) : value,
            }
          : item,
      ),
    );
  };
  const removeMedicine = (id) => {
    setPurchaseItems((prev) => prev.filter((item) => item.id !== id));
  };
  const resetForm = useCallback(() => {
    setSelectedSupplier(null);
    setMedicineSearch("");
    setPurchaseItems([]);
    setExpectedDeliveryDate("");
    setPaymentMode("CREDIT");
    setPaymentTermsDays("");
    setSaving(false);
    setSelectedBranchId("");
  }, [
    setSelectedSupplier,
    setMedicineSearch,
    setPurchaseItems,
    setExpectedDeliveryDate,
    setPaymentMode,
    setPaymentTermsDays,
    setSaving,
    setSelectedBranchId,
  ]);
  const downloadPurchasePDF = (order) => {
    if (!order) return;
    const doc = new jsPDF();

    // Store Profile
    const shopName = storeProfile?.shopName || "Viyan MedAssist";
    const address = storeProfile?.address || "";
    const phone = storeProfile?.phone || "";
    const email = storeProfile?.email || "";
    const gstin = storeProfile?.gstin || "";

    // Header / Shop Info
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(shopName, 14, 20);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    let y = 28;
    if (address) {
      doc.text(address, 14, y);
      y += 6;
    }
    if (phone || email) {
      doc.text(
        `${phone ? `Phone: ${phone}` : ""} ${email ? `| Email: ${email}` : ""}`,
        14,
        y,
      );
      y += 6;
    }
    if (gstin) {
      doc.text(`GSTIN: ${gstin}`, 14, y);
      y += 6;
    }
    doc.setLineWidth(0.5);
    doc.line(14, y, 196, y);
    y += 10;

    // Document type detection
    let docType = "PURCHASE INVOICE";
    let docNum = order.invoiceNumber || order.id || "-";
    if (order.returnNumber) {
      docType = "PURCHASE RETURN";
      docNum = order.returnNumber;
    } else if (order.orderNumber || order.poNumber) {
      docType = "PURCHASE ORDER";
      docNum = order.orderNumber || order.poNumber;
    }

    // Document Details
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(docType, 14, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const supplierName =
      order.supplier?.name || order.supplierName || order.supplier || "-";
    const orderDate =
      order.date || (order.createdAt ? formatDate(order.createdAt) : "-");
    const refNum =
      order.referenceNumber || order.ref || order.supplierInvoiceNumber || "-";
    const invoiceDateStr = order.invoiceDate
      ? formatDate(order.invoiceDate)
      : "-";
    doc.text(
      `${docType
        .split(" ")
        .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
        .join(" ")} No: ${docNum}`,
      14,
      y,
    );
    doc.text(`Date: ${orderDate}`, 120, y);
    y += 8;
    doc.text(`Supplier: ${supplierName}`, 14, y);
    doc.text(`Ref / Inv No: ${refNum}`, 120, y);
    y += 8;
    if (order.invoiceDate) {
      doc.text(`Invoice Date: ${invoiceDateStr}`, 120, y);
      y += 8;
    }
    y += 4;

    // Table
    autoTable(doc, {
      startY: y,
      head: [["Medicine", "Quantity", "Purchase Price (Rs.)", "Total (Rs.)"]],
      body: (order.items || []).map((it) => [
        it.medicine?.name || it.medicineName || it.name || "Unknown",
        String(it.quantity || it.qty || 0),
        `Rs. ${safeNumber(it.purchasePrice || it.unitPrice || it.price || 0).toFixed(2)}`,
        `Rs. ${safeNumber((it.quantity || it.qty || 0) * (it.purchasePrice || it.unitPrice || it.price || 0)).toFixed(2)}`,
      ]),
      headStyles: {
        fillColor: [13, 148, 136],
        textColor: 255,
      },
      // teal color (matches the theme)
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      margin: {
        top: 10,
        left: 14,
        right: 14,
      },
    });
    const finalY = doc.lastAutoTable.finalY + 15;

    // Totals Box
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const subtotalVal = order.subtotal || order.totalAmount || order.total || 0;
    const gstVal = order.gstAmount || 0;
    const totalVal = order.totalAmount || order.total || 0;
    doc.text(`Subtotal:`, 130, finalY);
    doc.text(`Rs. ${safeNumber(subtotalVal).toFixed(2)}`, 165, finalY);
    doc.text(`GST:`, 130, finalY + 6);
    doc.text(`Rs. ${safeNumber(gstVal).toFixed(2)}`, 165, finalY + 6);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Amount:`, 130, finalY + 14);
    doc.text(`Rs. ${safeNumber(totalVal).toFixed(2)}`, 165, finalY + 14);
    doc.save(`${docType.replace(" ", "_")}_${docNum}.pdf`);
    showToast("PDF downloaded successfully", "success");
  };
  const handleSavePurchase = async () => {
    if (saving) return;
    if (!selectedSupplier) {
      showToast("Please select a supplier", "error");
      return;
    }
    const finalBranchId =
      selectedBranchId ||
      user?.branchId ||
      (branches.length > 0 ? branches[0].id : "");
    if (!finalBranchId) {
      showToast(
        "Please select a branch or verify your user profile branch is assigned",
        "error",
      );
      return;
    }
    if (purchaseItems.length === 0) {
      showToast("Add at least one medicine", "error");
      return;
    }
    for (const item of purchaseItems) {
      if (!Number.isFinite(item.qty) || item.qty <= 0) {
        showToast(
          "Please enter a valid quantity greater than 0 for all medicines",
          "error",
        );
        return;
      }
    }
    setSaving(true);
    try {
      const payload = {
        supplierId: selectedSupplier.id,
        branchId: finalBranchId,
        expectedDeliveryDate: expectedDeliveryDate || undefined,
        paymentMode: paymentMode || undefined,
        paymentTermsDays: paymentTermsDays
          ? Number(paymentTermsDays)
          : undefined,
        notes: undefined,
        items: purchaseItems.map((item) => ({
          medicineId: item.id,
          quantity: safeNumber(item.qty),
        })),
      };
      if (drawer === "edit-purchase" && selectedRow?.id) {
        await api.put(`/purchase-orders/${selectedRow.id}`, payload);
        showToast("Purchase order updated", "success");
      } else {
        await createPurchaseOrder(payload);
        showToast("Purchase Order Created Successfully", "success");
      }
      closeDrawer();
      await refreshData();
    } catch (err) {
      console.error("[PURCHASE] Save failed:", err);
      showToast(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          "Failed to save purchase order",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };
  const handleKeyDown = (e) => {
    if (e.key === "Escape") closeDrawer();
  };
  const handleOpenDrawer = useCallback(
    (type, row = null) => {
      if (type === "new-purchase") {
        loadMedicines();
        resetForm();
        setSelectedBranchId(
          user?.branchId || (branches.length > 0 ? branches[0].id : ""),
        );
        setDrawer(type);
        return;
      }
      if (!row) {
        showToast("Unable to load invoice details", "error");
        return;
      }
      setSelectedRow(row);
      setDrawer(type);
      if (type === "edit-purchase") {
        loadMedicines();
        setSelectedSupplier(row.supplier || null);
        setExpectedDeliveryDate(
          (row.expectedDeliveryDate || "").split("T")[0] || "",
        );
        setPaymentMode(row.paymentMode || "CREDIT");
        setPaymentTermsDays(row.paymentTermsDays || "");
        setSelectedBranchId(
          row.branchId ||
            user?.branchId ||
            (branches.length > 0 ? branches[0].id : ""),
        );
        setPurchaseItems(
          (row.items || []).map((item) => ({
            id: item.medicineId || item.medicine?.id,
            name: item.medicine?.name || item.medicineName || item.name || "",
            qty: item.quantity || item.qty || 0,
          })),
        );
      }
    },
    [
      loadMedicines,
      resetForm,
      user?.branchId,
      branches,
      showToast,
      setSelectedBranchId,
      setDrawer,
      setSelectedRow,
      setSelectedSupplier,
      setExpectedDeliveryDate,
      setPaymentMode,
      setPaymentTermsDays,
      setPurchaseItems,
    ],
  );
  const closeDrawer = () => {
    setDrawer(null);
    setSelectedRow(null);
    setSupplierCredit({
      available: 0,
      notes: [],
    });
    setSelectedCreditNoteId("");
    setCreditAmountToApply(0);
    resetForm();
  };
  const fetchSupplierCredits = async (supplierId) => {
    try {
      const [balanceRes, notesRes] = await Promise.all([
        getSupplierCreditBalance(supplierId),
        getCreditNotes({
          supplierId,
          status: "ISSUED,APPLIED",
        }),
      ]);
      setSupplierCredit({
        available: balanceRes.data?.data?.availableCredit || 0,
        notes: notesRes.data?.data || [],
      });
    } catch (err) {
      console.error("Failed to fetch supplier credits", err);
    }
  };
  useEffect(() => {
    let timerId;
    if (drawer === "invoice-detail" && selectedRow) {
      const supplierId = selectedRow.supplierId || selectedRow.supplier?.id;
      if (
        supplierId &&
        (selectedRow.paymentStatus || selectedRow.status) !== "PAID"
      ) {
        timerId = setTimeout(() => {
          fetchSupplierCredits(supplierId);
        }, 0);
      }
    }
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [drawer, selectedRow]);
  const handleApplyCredit = async () => {
    if (applyingCredit) return;
    if (!selectedCreditNoteId || creditAmountToApply <= 0) {
      showToast("Select a credit note and enter a valid amount", "warning");
      return;
    }
    setApplyingCredit(true);
    try {
      await applyCreditNote(selectedCreditNoteId, {
        purchaseInvoiceId: selectedRow.id,
        amountToApply: safeNumber(creditAmountToApply),
      });
      showToast("Credit applied successfully", "success");
      const supplierId = selectedRow.supplierId || selectedRow.supplier?.id;
      if (supplierId) {
        fetchSupplierCredits(supplierId);
      }
      setSelectedCreditNoteId("");
      setCreditAmountToApply(0);
      refreshData();
      setSelectedRow((prev) => ({
        ...prev,
        balanceAmount:
          (prev.balanceAmount || prev.totalAmount || prev.total || 0) -
          creditAmountToApply,
        paidAmount: (prev.paidAmount || 0) + creditAmountToApply,
        paymentStatus:
          (prev.balanceAmount || prev.totalAmount || prev.total || 0) -
            creditAmountToApply <=
          0
            ? "PAID"
            : "PARTIALLY_PAID",
      }));
    } catch (err) {
      showToast(
        err.response?.data?.message || err.message || "Failed to apply credit",
        "error",
      );
    } finally {
      setApplyingCredit(false);
    }
  };
  useEffect(() => {
    const state = location.state;
    if (!state) return;
    let timerId;
    if (state.action === "raise-po") {
      timerId = setTimeout(() => {
        handleOpenDrawer("new-purchase");
        if (state.medicine) {
          setPurchaseItems([
            {
              ...state.medicine,
              qty: state.medicine.reorderQty || 1,
              batchNumber: "",
              expiryDate: "",
            },
          ]);
        }
        if (state.supplierId && suppliers.length > 0) {
          const sup = suppliers.find((s) => s.id === state.supplierId);
          if (sup) {
            setSelectedSupplier(sup);
          }
        }

        // Clear route state to prevent opening the drawer again on refresh
        navigate(location.pathname, {
          replace: true,
          state: {},
        });
      }, 0);
    }
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [
    location.state,
    suppliers,
    navigate,
    location.pathname,
    handleOpenDrawer,
    setPurchaseItems,
  ]);

  /* ── Filtered Data Logic ── */
  const filteredInvoices = invoices.filter((inv) => {
    const supplierName =
      inv.supplier?.name || inv.supplierName || inv.supplier || "";
    const matchesSupplier =
      filters.supplier === "All Suppliers" || supplierName === filters.supplier;
    let statusVal = (inv.paymentStatus || inv.status || "").toLowerCase();
    if (statusVal === "partial") statusVal = "partiallypaid";
    statusVal = statusVal.replace(/[\s_-]+/g, "");
    const filterVal = filters.status.toLowerCase().replace(/[\s_-]+/g, "");
    const matchesStatus =
      filters.status === "All Status" ||
      statusVal === filterVal ||
      (statusVal === "partiallypaid" && filterVal === "partial");
    const lowerSearch = filters.search.toLowerCase();
    const matchesSearch =
      (inv.supplierInvoiceNumber || inv.invoiceNumber || inv.id || "")
        .toLowerCase()
        .includes(lowerSearch) ||
      supplierName.toLowerCase().includes(lowerSearch);
    const matchesDate =
      !filters.date || (inv.date || inv.createdAt || "").includes(filters.date);
    return matchesSupplier && matchesStatus && matchesSearch && matchesDate;
  });
  const filteredOrders = orders.filter((po) => {
    const supplierName =
      po.supplier?.name || po.supplierName || po.supplier || "";
    const matchesSupplier =
      filters.supplier === "All Suppliers" || supplierName === filters.supplier;
    const statusVal = (po.status || "").toLowerCase().replace(/[\s_-]+/g, "");
    const filterVal = filters.status.toLowerCase().replace(/[\s_-]+/g, "");
    const matchesStatus =
      filters.status === "All Status" ||
      statusVal === filterVal ||
      (statusVal === "partiallyreceived" && filterVal === "partiallypaid");
    const lowerSearch = filters.search.toLowerCase();
    const matchesSearch =
      (po.id || po.poNumber || "").toLowerCase().includes(lowerSearch) ||
      supplierName.toLowerCase().includes(lowerSearch);
    const matchesDate =
      !filters.date || (po.date || po.createdAt || "").includes(filters.date);
    return matchesSupplier && matchesStatus && matchesSearch && matchesDate;
  });
  const filteredReturns = returns.filter((ret) => {
    const supplierName =
      ret.supplier?.name || ret.supplierName || ret.supplier || "";
    const matchesSupplier =
      filters.supplier === "All Suppliers" || supplierName === filters.supplier;
    const statusVal = (ret.status || "").toLowerCase().replace(/[\s_-]+/g, "");
    const filterVal = filters.status.toLowerCase().replace(/[\s_-]+/g, "");
    const matchesStatus =
      filters.status === "All Status" || statusVal === filterVal;
    const lowerSearch = filters.search.toLowerCase();
    const matchesSearch =
      (ret.id || ret.returnNumber || "").toLowerCase().includes(lowerSearch) ||
      supplierName.toLowerCase().includes(lowerSearch);
    const matchesDate =
      !filters.date || (ret.date || ret.createdAt || "").includes(filters.date);
    return matchesSupplier && matchesStatus && matchesSearch && matchesDate;
  });
  const handleReceiveOrder = async () => {
    if (isReceiving) return;
    try {
      setIsReceiving(true);

      // Validate supplier invoice fields
      if (!grnInvoiceNumber.trim()) {
        showToast("Please enter the Supplier Invoice Number", "warning");
        return;
      }
      if (!grnInvoiceDate) {
        showToast("Please enter the Invoice Date", "warning");
        return;
      }
      const itemsToReceive = receiveItems.filter(
        (item) => safeNumber(item.receivedQuantity) > 0,
      );
      if (itemsToReceive.length === 0) {
        showToast(
          "Please receive at least one item with a quantity greater than 0",
          "warning",
        );
        return;
      }

      // Check that batchNumber and expiryDate are filled for all received items
      const incompleteItem = itemsToReceive.find(
        (item) => !item.batchNumber?.trim() || !item.expiryDate,
      );
      if (incompleteItem) {
        showToast(
          "Please provide a Batch Number and Expiry Date for all received items",
          "warning",
        );
        return;
      }

      // Validation: Total Receive Qty <= Pending Qty
      const qtySums = {};
      const pendingMap = {};
      const nameMap = {};
      for (const item of itemsToReceive) {
        const key = item.id || item.medicineId;
        if (!qtySums[key]) qtySums[key] = 0;
        qtySums[key] += safeNumber(item.receivedQuantity);
        pendingMap[key] = safeNumber(item.pendingQuantity);
        nameMap[key] =
          item.medicine?.name || item.medicineName || item.name || "item";
      }
      for (const key in qtySums) {
        if (qtySums[key] > pendingMap[key]) {
          showToast(
            `Total received quantity for ${nameMap[key]} cannot exceed the pending quantity (${pendingMap[key]})`,
            "warning",
          );
          return;
        }
      }

      // Validation: Expiry Date >= Today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiredItem = itemsToReceive.find(
        (item) => new Date(item.expiryDate) < today,
      );
      if (expiredItem) {
        showToast(
          `Expiry date for ${expiredItem.medicine?.name || expiredItem.medicineName || expiredItem.name || "item"} must be in the future`,
          "warning",
        );
        return;
      }

      // Validation: Purchase Price > 0
      const invalidPrice = itemsToReceive.find(
        (item) => safeNumber(item.purchasePrice) <= 0,
      );
      if (invalidPrice) {
        showToast(
          `Purchase price for ${invalidPrice.medicine?.name || invalidPrice.medicineName || invalidPrice.name || "item"} must be greater than 0`,
          "warning",
        );
        return;
      }

      // Validation: MRP > 0
      const invalidMRP = itemsToReceive.find(
        (item) => safeNumber(item.mrp) <= 0,
      );
      if (invalidMRP) {
        showToast(
          `MRP for ${invalidMRP.medicine?.name || invalidMRP.medicineName || invalidMRP.name || "item"} must be greater than 0`,
          "warning",
        );
        return;
      }
      showToast("Receiving order...", "info");
      const payload = {
        supplierInvoiceNumber: grnInvoiceNumber.trim(),
        invoiceDate: grnInvoiceDate,
        receivedItems: itemsToReceive.map((item) => ({
          medicineId: item.medicineId || item.id,
          receivedQuantity: safeNumber(item.receivedQuantity),
          batchNumber: item.batchNumber.trim(),
          expiryDate: item.expiryDate,
          purchasePrice: safeNumber(item.purchasePrice),
          mrp: safeNumber(item.mrp),
          gstPercentage: safeNumber(item.gstPercentage || 0),
        })),
      };
      await receivePurchaseOrder(selectedRow.id, payload);
      showToast("Order Received & Inventory Updated", "success");
      setShowReceiveModal(false);
      setDifferentBatch({});
      setGrnInvoiceNumber("");
      setGrnInvoiceDate(new Date().toISOString().split("T")[0]);
      await refreshData();
    } catch (err) {
      console.error(err);
      const errorMessage =
        typeof err.response?.data?.error?.message === "string"
          ? err.response.data.error.message
          : typeof err.response?.data?.error === "string"
            ? err.response.data.error
            : typeof err.response?.data?.message === "string"
              ? err.response.data.message
              : typeof err.message === "string"
                ? err.message
                : "Failed to receive order";
      showToast(errorMessage, "error");
    } finally {
      setIsReceiving(false);
    }
  };
  const loadReturnBatches = async (invoice) => {
    setLoadingReturnBatches(true);
    try {
      const items = invoice?.items || [];
      const results = await Promise.all(
        items.map(async (item) => {
          const medicineId = item.medicineId || item.medicine?.id;
          const medicineName = item.medicine?.name || item.name || "Unknown";
          if (!medicineId) {
            return {
              medicineId: null,
              medicineName,
              batches: [],
              selectedBatchId: "",
              quantity: 0,
            };
          }
          try {
            const { data } = await api.get(API_ROUTES.INVENTORY_BATCHES, {
              params: {
                medicineId,
                limit: 50,
              },
            });
            const batches = (
              data?.data?.batches ||
              data?.batches ||
              data?.data ||
              []
            ).filter((b) => b.quantity > 0 && b.status === "ACTIVE");
            return {
              medicineId,
              medicineName,
              batches,
              selectedBatchId: batches.length === 1 ? batches[0].id : "",
              quantity: Math.min(
                item.quantity || 0,
                batches.length > 0 ? batches[0].quantity : 0,
              ),
              maxQuantity: batches.length > 0 ? batches[0].quantity : 0,
            };
          } catch {
            return {
              medicineId,
              medicineName,
              batches: [],
              selectedBatchId: "",
              quantity: 0,
              maxQuantity: 0,
            };
          }
        }),
      );
      setReturnSelections(results);
    } finally {
      setLoadingReturnBatches(false);
    }
  };
  const handleProcessReturn = async () => {
    if (isProcessingReturnRef.current) return;
    isProcessingReturnRef.current = true;
    try {
      const supplierId = selectedRow?.supplierId || selectedRow?.supplier?.id;
      const purchaseInvoiceId = selectedRow?.id;
      if (!purchaseInvoiceId) {
        showToast("Select a valid purchase invoice", "error");
        return;
      }
      if (!supplierId) {
        showToast("Supplier information is missing", "error");
        return;
      }
      const payloadItems = returnSelections.reduce((acc, s) => {
        if (s.selectedBatchId && s.quantity > 0) {
          acc.push({
            batchId: s.selectedBatchId,
            quantity: safeNumber(s.quantity),
            medicineId: s.medicineId,
          });
        }
        return acc;
      }, []);
      if (payloadItems.length === 0) {
        showToast("Select at least one batch and quantity to return", "error");
        return;
      }
      const reason = "Return";
      if (!reason) {
        showToast("Return reason is required", "error");
        return;
      }
      showToast("Processing return...", "info");
      const payload = {
        purchaseInvoiceId,
        items: payloadItems,
        reason,
        supplierId,
      };
      await api.post(API_ROUTES.PURCHASES_RETURNS, payload);
      showToast("Return Processed Successfully", "success");
      setShowReturnModal(false);
      setReturnSelections([]);
      await refreshData();
    } catch (err) {
      console.error("STATUS:", err.response?.status);
      console.error("DATA:", err.response?.data);
      console.error("PAYLOAD:", {
        purchaseInvoiceId: selectedRow?.id,
        items: returnSelections.reduce((acc, s) => {
          if (s.selectedBatchId && s.quantity > 0) {
            acc.push({
              batchId: s.selectedBatchId,
              quantity: safeNumber(s.quantity),
              medicineId: s.medicineId,
            });
          }
          return acc;
        }, []),
        reason: "Return",
        supplierId: selectedRow?.supplierId || selectedRow?.supplier?.id,
      });
      showToast(
        err.response?.data?.message || "Failed to process return",
        "error",
      );
    } finally {
      isProcessingReturnRef.current = false;
    }
  };
  const finalBranchId =
    selectedBranchId ||
    user?.branchId ||
    (branches.length > 0 ? branches[0].id : "");
  const hasMultipleBranches = branches.length > 1;
  // PO form is only invalid if supplier, medicines, or quantities are missing
  const isFormInvalid =
    !selectedSupplier ||
    (hasMultipleBranches ? !selectedBranchId : !finalBranchId) ||
    purchaseItems.length === 0 ||
    purchaseItems.some((item) => !item.qty || safeNumber(item.qty) <= 0);
  if (loading) {
    return (
      <div
        style={{
          padding: "80px",
          textAlign: "center",
        }}
      >
        <Spinner size={32} />
        <p
          style={{
            marginTop: 16,
            color: "var(--text-muted)",
          }}
        >
          Loading purchase management...
        </p>
      </div>
    );
  }
  return (
    <div className="purchases-container">
      {/* ── Page Header ── */}
      <div className="purchases-header">
        <div>
          <h1
            style={{
              fontFamily: "Outfit",
              fontSize: "28px",
              fontWeight: 700,
            }}
          >
            Purchase Management
          </h1>
          <p className="result-meta">
            Supplier invoices, purchase orders, and supplier returns — all in
            one place.
          </p>

          <div className="purchases-tabs">
            {["Invoices", "Orders", "Returns"].map((t) => (
              <button
                key={t}
                className={`p-tab ${activeTab === t.toLowerCase() ? "active" : ""}`}
                onClick={() => setActiveTab(t.toLowerCase())}
              >
                {t === "Invoices"
                  ? "Purchase Invoices"
                  : t === "Orders"
                    ? "Purchase Orders"
                    : "Supplier Returns"}
              </button>
            ))}
          </div>
        </div>
        <div className="header-actions">
          <button
            className="pos-btn teal purchase-create-btn"
            onClick={() => handleOpenDrawer("new-purchase")}
          >
            <div className="btn-glow" />
            <Plus size={18} />
            New Purchase Order
          </button>
          <button
            className="pos-btn accent purchase-create-btn"
            style={{
              marginLeft: 12,
            }}
            onClick={() => setActiveTab("orders")}
          >
            <div className="btn-glow" />
            <Package size={18} />
            Receive Goods
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="purchases-stats">
        {[
          {
            label: "THIS MONTH PURCHASES",
            val:
              "₹" +
              invoices
                .reduce(
                  (sum, inv) =>
                    sum + safeNumber(inv.totalAmount || inv.total || 0),
                  0,
                )
                .toLocaleString(),
            icon: ShoppingCart,
            col: "var(--info)",
          },
          {
            label: "PENDING POs",
            val: orders.filter(
              (o) => o.status === "PENDING" || o.status === "SENT",
            ).length,
            icon: Clock,
            col: "var(--warning)",
          },
          {
            label: "SUPPLIER RETURNS",
            val:
              "₹" +
              returns
                .reduce(
                  (sum, r) =>
                    sum +
                    safeNumber(
                      r.returnAmount || r.refundAmount || r.value || 0,
                    ),
                  0,
                )
                .toLocaleString(),
            icon: ArrowLeft,
            col: "var(--danger)",
          },
          {
            label: "ACTIVE SUPPLIERS",
            val: suppliers.length,
            icon: Building2,
            col: "var(--primary)",
          },
        ].map((s) => (
          <div key={s.label} className="pos-stat-card">
            <div className="stat-card-header">
              <span className="stat-label">{s.label}</span>
              <div
                className="stat-icon"
                style={{
                  backgroundColor: `${s.col}15`,
                  color: s.col,
                }}
              >
                <s.icon size={16} />
              </div>
            </div>
            <div className="stat-value">{s.val}</div>
          </div>
        ))}
      </div>

      {/* ── Main Content Area ── */}
      <PurchaseManagementSection1
        setFilters={setFilters}
        filters={filters}
        handleOpenDrawer={handleOpenDrawer}
        updatePaymentStatus={updatePaymentStatus}
        setSelectedRow={setSelectedRow}
        setShowReturnModal={setShowReturnModal}
        loadReturnBatches={loadReturnBatches}
        isApprovingPORef={isApprovingPORef}
        showToast={showToast}
        refreshData={refreshData}
        handleOpenReceiveModal={handleOpenReceiveModal}
        suppliers={suppliers}
        activeTab={activeTab}
        loading={loading}
        filteredInvoices={filteredInvoices}
        filteredOrders={filteredOrders}
        filteredReturns={filteredReturns}
      />

      {/* ── Side Drawer: New Purchase ── */}
      <PurchaseManagementSection2
        drawer={drawer}
        closeDrawer={closeDrawer}
        suppliers={suppliers}
        selectedSupplier={selectedSupplier}
        setSelectedSupplier={setSelectedSupplier}
        hasMultipleBranches={hasMultipleBranches}
        branches={branches}
        selectedBranchId={selectedBranchId}
        setSelectedBranchId={setSelectedBranchId}
        expectedDeliveryDate={expectedDeliveryDate}
        setExpectedDeliveryDate={setExpectedDeliveryDate}
        paymentMode={paymentMode}
        setPaymentMode={setPaymentMode}
        paymentTermsDays={paymentTermsDays}
        setPaymentTermsDays={setPaymentTermsDays}
        medicineSearch={medicineSearch}
        setMedicineSearch={setMedicineSearch}
        loadingMedicines={loadingMedicines}
        filteredMedicines={filteredMedicines}
        addMedicine={addMedicine}
        medicines={medicines}
        purchaseItems={purchaseItems}
        updateItem={updateItem}
        removeMedicine={removeMedicine}
        supplierCredit={supplierCredit}
        selectedRow={selectedRow}
        setCreditAmountToApply={setCreditAmountToApply}
        selectedCreditNoteId={selectedCreditNoteId}
        setSelectedCreditNoteId={setSelectedCreditNoteId}
        creditAmountToApply={creditAmountToApply}
        applyingCredit={applyingCredit}
        handleApplyCredit={handleApplyCredit}
        saving={saving}
        isFormInvalid={isFormInvalid}
        handleSavePurchase={handleSavePurchase}
        downloadPurchasePDF={downloadPurchasePDF}
        handleKeyDown={handleKeyDown}
      />

      {/* ── Supplier Return Modal ── */}
      <PurchaseManagementSection3
        showReturnModal={showReturnModal}
        selectedRow={selectedRow}
        loadingReturnBatches={loadingReturnBatches}
        returnSelections={returnSelections}
        setReturnSelections={setReturnSelections}
        handleProcessReturn={handleProcessReturn}
        setShowReturnModal={setShowReturnModal}
      />

      {/* ── Receive Order Modal ── */}
      <PurchaseManagementSection4
        showReceiveModal={showReceiveModal}
        selectedRow={selectedRow}
        grnInvoiceNumber={grnInvoiceNumber}
        setGrnInvoiceNumber={setGrnInvoiceNumber}
        grnInvoiceDate={grnInvoiceDate}
        setGrnInvoiceDate={setGrnInvoiceDate}
        receiveItems={receiveItems}
        setReceiveItems={setReceiveItems}
        setDifferentBatch={setDifferentBatch}
        setShowReceiveModal={setShowReceiveModal}
        isReceiving={isReceiving}
        handleReceiveOrder={handleReceiveOrder}
      />
    </div>
  );
}
