import { useState, useEffect, useRef, useCallback } from "react";
import api from "../api.js";
import { API_ROUTES } from "../constants/api.routes.js";
import { receiveGoods } from "../services/purchases.service.js";
import { getMedicines } from "../services/inventory.service";
import {
  ShoppingCart,
  Clock,
  ArrowLeft,
  Building2,
  Plus,
  X,
  Download,
  Eye,
  Edit2,
  Truck,
  UploadCloud,
  ScanLine,
  Package,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
function Spinner({ size = 14 }) {
  return (
    <Loader2 size={size} style={{ animation: "spin 0.8s linear infinite" }} />
  );
}

const formatDate = (date) => {
  if (!date) return "-";
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? "-"
    : parsed.toLocaleDateString("en-IN");
};

const safeData = (result, ...keys) => {
  if (result.status !== "fulfilled") return [];
  let val = result.value?.data;
  for (const key of keys) {
    if (val && typeof val === "object" && key in val) {
      val = val[key];
    }
  }
  if (Array.isArray(val)) return val;
  if (val && typeof val === "object") {
    if (Array.isArray(val.data)) return val.data;
  }
  return [];
};

export default function PurchaseManagement({ showToast }) {
  const [activeTab, setActiveTab] = useState("invoices");
  const [drawer, setDrawer] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [medicines, setMedicines] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [, setLoadingMedicines] = useState(false);
  const [returns, setReturns] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const refreshData = async () => {
    try {
      const results = await Promise.allSettled([
        api.get(API_ROUTES.SUPPLIERS),
        api.get(API_ROUTES.PURCHASES_ORDERS),
        api.get(API_ROUTES.PURCHASES_RETURNS),
        api.get(API_ROUTES.PURCHASES_ORDERS, {
          params: { status: "RECEIVED" },
        }),
      ]);

      setSuppliers(safeData(results[0], "data"));
      setOrders(safeData(results[1], "data"));
      setReturns(safeData(results[2], "data"));
      setInvoices(safeData(results[3], "data"));
    } catch (err) {
      console.error("[FETCH DATA ERROR]", err);

      showToast("Failed to load live data", "error");
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
          api.get(API_ROUTES.PURCHASES_ORDERS, {
            params: { status: "RECEIVED" },
          }),
        ]);

        if (!mounted) return;

        setSuppliers(safeData(results[0], "data"));
        setOrders(safeData(results[1], "data"));
        setReturns(safeData(results[2], "data"));
        setInvoices(safeData(results[3], "data"));

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
  }, [showToast]);

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
      console.error("Failed to load medicines", error);
    } finally {
      setLoadingMedicines(false);
    }
  }, []);

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
  const [purchaseItems, setPurchaseItems] = useState([]);
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [supplierInvNo, setSupplierInvNo] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const filteredMedicines = medicines.filter((m) =>
    (m.name || "").toLowerCase().includes(medicineSearch.toLowerCase()),
  );

  const subtotal = purchaseItems.reduce(
    (acc, i) => acc + i.qty * (i.purchasePrice || 0),
    0,
  );
  const gstTotal = purchaseItems.reduce(
    (acc, i) =>
      acc + (i.qty * (i.purchasePrice || 0) * (i.gstPercentage || 0)) / 100,
    0,
  );
  const grandTotal = subtotal + gstTotal;

  const addMedicine = (medicine) => {
    const exists = purchaseItems.find((i) => i.id === medicine.id);
    if (exists) return;
    setPurchaseItems([
      ...purchaseItems,
      {
        ...medicine,
        qty: 1,
        purchasePrice: medicine.purchasePrice || 0,
        gstPercentage: medicine.gstPercentage || 12,
        batchNumber: "",
        expiryDate: "",
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
              [field]:
                field === "qty" ||
                field === "purchasePrice" ||
                field === "sellingPrice" ||
                field === "gstPercentage"
                  ? Number(value)
                  : value,
            }
          : item,
      ),
    );
  };

  const removeMedicine = (id) => {
    setPurchaseItems((prev) => prev.filter((item) => item.id !== id));
  };

  const resetForm = () => {
    setSelectedSupplier(null);
    setMedicineSearch("");
    setPurchaseItems([]);
    setInvoiceDate(new Date().toISOString().split("T")[0]);
    setSupplierInvNo("");
    setSaving(false);
    setUploadedFile(null);
    setDragOver(false);
  };

  const handleSavePurchase = async () => {
    if (!selectedSupplier) {
      showToast("Please select a supplier", "error");
      return;
    }
    if (purchaseItems.length === 0) {
      showToast("Add at least one medicine", "error");
      return;
    }
    if (!supplierInvNo.trim()) {
      showToast("Enter supplier invoice number", "error");
      return;
    }
    if (
      purchaseItems.some(
        (item) => !item.batchNumber || !item.batchNumber.trim(),
      )
    ) {
      showToast("Please enter batch number for all medicines", "error");
      return;
    }
    if (purchaseItems.some((item) => !item.expiryDate)) {
      showToast("Please enter expiry date for all medicines", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        supplierId: selectedSupplier.id,
        supplierInvoiceNumber: supplierInvNo.trim(),
        invoiceDate: invoiceDate || new Date().toISOString().split("T")[0],
        items: purchaseItems.map((item) => ({
          medicineId: item.id,
          quantity: Number(item.qty),
          purchasePrice: Number(item.purchasePrice || 0),
          sellingPrice: Number(
            item.sellingPrice || item.mrp || item.purchasePrice || 0,
          ),
          batchNumber: item.batchNumber.trim(),
          expiryDate: new Date(item.expiryDate).toISOString(),
        })),
        subtotal,
        gstAmount: gstTotal,
        totalAmount: grandTotal,
      };
      await receiveGoods(payload);
      showToast("Purchase Saved Successfully", "success");
      closeDrawer();
      await refreshData();
    } catch (err) {
      console.error("[PURCHASE] Save failed:", err);
      showToast(
        err.response?.data?.error || err.message || "Failed to save purchase",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") closeDrawer();
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast("File too large. Max 5MB allowed.", "error");
      return;
    }
    if (file.type !== "application/pdf") {
      showToast("Only PDF files are supported.", "error");
      return;
    }
    setUploadedFile(file);
    showToast(`Uploaded: ${file.name}`, "success");
  };

  const handleFileChange = (e) => {
    handleFileSelect(e.target.files[0]);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleOpenDrawer = (type, row = null) => {
    setSelectedRow(row);
    setDrawer(type);
    if (type === "new-purchase" || type === "edit-purchase") {
      loadMedicines();
    }
  };

  const closeDrawer = () => {
    setDrawer(null);
    setSelectedRow(null);
    resetForm();
  };

  /* ── Filtered Data Logic ── */
  const filteredInvoices = invoices.filter((inv) => {
    const supplierName =
      inv.supplier?.name || inv.supplierName || inv.supplier || "";
    const matchesSupplier =
      filters.supplier === "All Suppliers" || supplierName === filters.supplier;
    const matchesStatus =
      filters.status === "All Status" ||
      (inv.status || "").toLowerCase() === filters.status.toLowerCase();
    const matchesSearch =
      (inv.id || "").toLowerCase().includes(filters.search.toLowerCase()) ||
      supplierName.toLowerCase().includes(filters.search.toLowerCase());
    const matchesDate =
      !filters.date || (inv.date || inv.createdAt || "").includes(filters.date);
    return matchesSupplier && matchesStatus && matchesSearch && matchesDate;
  });

  const filteredOrders = orders.filter((po) => {
    const supplierName =
      po.supplier?.name || po.supplierName || po.supplier || "";
    const matchesSupplier =
      filters.supplier === "All Suppliers" || supplierName === filters.supplier;
    const matchesStatus =
      filters.status === "All Status" ||
      (po.status || "").toLowerCase() === filters.status.toLowerCase();
    const matchesSearch =
      (po.id || po.poNumber || "")
        .toLowerCase()
        .includes(filters.search.toLowerCase()) ||
      supplierName.toLowerCase().includes(filters.search.toLowerCase());
    const matchesDate =
      !filters.date || (po.date || po.createdAt || "").includes(filters.date);
    return matchesSupplier && matchesStatus && matchesSearch && matchesDate;
  });

  const filteredReturns = returns.filter((ret) => {
    const supplierName =
      ret.supplier?.name || ret.supplierName || ret.supplier || "";
    const matchesSupplier =
      filters.supplier === "All Suppliers" || supplierName === filters.supplier;
    const matchesStatus =
      filters.status === "All Status" ||
      (ret.status || "").toLowerCase() === filters.status.toLowerCase();
    const matchesSearch =
      (ret.id || ret.returnNumber || "")
        .toLowerCase()
        .includes(filters.search.toLowerCase()) ||
      supplierName.toLowerCase().includes(filters.search.toLowerCase());
    const matchesDate =
      !filters.date || (ret.date || ret.createdAt || "").includes(filters.date);
    return matchesSupplier && matchesStatus && matchesSearch && matchesDate;
  });

  const handleReceiveOrder = async () => {
    try {
      showToast("Receiving order...", "info");
      await api.post(API_ROUTES.PURCHASES_RECEIVE, {
        orderId: selectedRow.id,
        items: selectedRow.items || [],
      });
      showToast("Order Received & Inventory Updated", "success");
      setShowReceiveModal(false);
      await refreshData();
    } catch (err) {
      console.error(err);
      showToast("Failed to receive order", "error");
    }
  };

  const handleProcessReturn = async () => {
    try {
      showToast("Processing return...", "info");
      await api.post(API_ROUTES.PURCHASES_RETURNS, {
        originalInvoiceId: selectedRow.id,
        items: selectedRow.items || [],
        reason: "Quality Issue",
        supplierId: selectedRow.supplierId || selectedRow.supplier?.id,
      });
      showToast("Return Submitted Successfully", "success");
      setShowReturnModal(false);
      await refreshData();
    } catch (err) {
      console.error(err);
      showToast("Failed to process return", "error");
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "80px", textAlign: "center" }}>
        <Spinner size={32} />
        <p style={{ marginTop: 16, color: "var(--text-muted)" }}>
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
            style={{ fontFamily: "Outfit", fontSize: "28px", fontWeight: 700 }}
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
            New Purchase
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
                  (sum, inv) => sum + (inv.totalAmount || inv.total || 0),
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
                .reduce((sum, r) => sum + (r.refundAmount || r.value || 0), 0)
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
        ].map((s, i) => (
          <div key={i} className="pos-stat-card">
            <div className="stat-card-header">
              <span className="stat-label">{s.label}</span>
              <div
                className="stat-icon"
                style={{ backgroundColor: `${s.col}15`, color: s.col }}
              >
                <s.icon size={16} />
              </div>
            </div>
            <div className="stat-value">{s.val}</div>
          </div>
        ))}
      </div>

      {/* ── Main Content Area ── */}
      <div className="purchase-table-card">
        {/* Filter Row */}
        <div className="purchase-filters">
          <div className="pos-input-group" style={{ maxWidth: "200px" }}>
            <input
              className="filter-input"
              type="date"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            />
          </div>
          <select
            className="filter-input"
            value={filters.supplier}
            onChange={(e) =>
              setFilters({ ...filters, supplier: e.target.value })
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
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option>All Status</option>
            <option>Paid</option>
            <option>Pending</option>
            <option>Partially Paid</option>
            <option>Sent</option>
            <option>Confirmed</option>
            <option>Received</option>
            <option>Approved</option>
            <option>Completed</option>
          </select>
          <div className="pos-input-group" style={{ flex: 1 }}>
            <input
              className="filter-input"
              placeholder="Search by ID or Supplier..."
              style={{ width: "100%" }}
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
            />
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
                  <th>Inv #</th>
                  <th>Supplier</th>
                  <th>Medicines</th>
                  <th>Total ₹</th>
                  <th>GST ₹</th>
                  <th>Payment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => handleOpenDrawer("invoice-detail", inv)}
                  >
                    <td>{inv.date || formatDate(inv.createdAt)}</td>
                    <td style={{ fontWeight: 700 }}>
                      {inv.invoiceNumber || inv.id}
                    </td>
                    <td>
                      {inv.supplier?.name || inv.supplierName || inv.supplier}
                    </td>
                    <td>{inv.items?.length || inv.medicines || 0} items</td>
                    <td style={{ fontWeight: 700 }}>
                      ₹{(inv.totalAmount || inv.total || 0).toLocaleString()}
                    </td>
                    <td className="result-meta">₹{inv.gstAmount || 0}</td>
                    <td>
                      <span
                        className={`p-status ${(inv.status || "").toLowerCase().replace(" ", "")}`}
                      >
                        {inv.status || "PAID"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "8px" }}>
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
                          style={{ color: "var(--danger)" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRow(inv);
                            setShowReturnModal(true);
                          }}
                        >
                          <ArrowLeft size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredInvoices.length === 0 && (
                  <tr>
                    <td
                      colSpan="8"
                      style={{ textAlign: "center", padding: "20px" }}
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
                <th>PO #</th>
                <th>Date</th>
                <th>Supplier</th>
                <th>Items</th>
                <th>Total ₹</th>
                <th>Delivery</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((po) => (
                <tr
                  key={po.id}
                  onClick={() => handleOpenDrawer("invoice-detail", po)}
                >
                  <td style={{ fontWeight: 700 }}>{po.poNumber || po.id}</td>
                  <td>{po.date || formatDate(po.createdAt)}</td>
                  <td>{po.supplier?.name || po.supplierName || po.supplier}</td>
                  <td>{po.items?.length || po.items || 0}</td>
                  <td style={{ fontWeight: 700 }}>
                    ₹{(po.totalAmount || po.total || 0).toLocaleString()}
                  </td>
                  <td>{po.deliveryDate || po.delivery || "-"}</td>
                  <td>
                    <span
                      className={`p-status ${(po.status || "").toLowerCase()}`}
                    >
                      {po.status || "PENDING"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "8px" }}>
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
                      {(po.status === "SENT" || po.status === "PENDING") && (
                        <button
                          className="pos-btn teal"
                          style={{ padding: "4px 10px", fontSize: "11px" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRow(po);
                            setShowReceiveModal(true);
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
                    colSpan="8"
                    style={{ textAlign: "center", padding: "20px" }}
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
                  key={ret.id}
                  onClick={() => handleOpenDrawer("invoice-detail", ret)}
                >
                  <td>{ret.date || formatDate(ret.createdAt)}</td>
                  <td style={{ fontWeight: 700 }}>
                    {ret.returnNumber || ret.id}
                  </td>
                  <td>
                    {ret.supplier?.name || ret.supplierName || ret.supplier}
                  </td>
                  <td className="result-meta">
                    {ret.originalInvoiceId || ret.origInv}
                  </td>
                  <td>{ret.items?.length || ret.items || 0}</td>
                  <td style={{ fontWeight: 700, color: "var(--danger)" }}>
                    ₹{(ret.refundAmount || ret.value || 0).toLocaleString()}
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
                    style={{ textAlign: "center", padding: "20px" }}
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
            <b style={{ color: "var(--text)" }}>
              ₹
              {filteredInvoices
                .reduce((s, i) => s + (i.totalAmount || 0), 0)
                .toLocaleString()}
            </b>{" "}
            | GST input credit:{" "}
            <b style={{ color: "var(--primary)" }}>
              ₹
              {filteredInvoices
                .reduce((s, i) => s + (i.gstAmount || 0), 0)
                .toLocaleString()}
            </b>
          </div>
        </div>
      </div>

      {/* ── Side Drawer: New Purchase ── */}
      <AnimatePresence>
        {drawer && (
          <motion.div
            className="stock-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onKeyDown={handleKeyDown}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                closeDrawer();
              }
            }}
          >
            <motion.div
              className="p-drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div className="p-drawer-header">
                <div>
                  <h2 style={{ fontFamily: "Outfit", fontWeight: 700 }}>
                    {drawer === "new-purchase"
                      ? "New Purchase Entry"
                      : drawer === "edit-purchase"
                        ? "Edit Purchase"
                        : selectedRow?.invoiceNumber ||
                          selectedRow?.poNumber ||
                          selectedRow?.id}
                  </h2>
                  {drawer === "invoice-detail" && (
                    <span
                      className={`p-status ${(selectedRow?.status || "PAID").toLowerCase().replace(" ", "")}`}
                    >
                      {selectedRow?.status || "PAID"}
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
                          style={{ width: "100%" }}
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
                        style={{ marginTop: "16px" }}
                      >
                        <div className="pos-input-group">
                          <label className="p-label">INVOICE DATE</label>
                          <input
                            className="pos-input"
                            type="date"
                            value={invoiceDate}
                            onChange={(e) => setInvoiceDate(e.target.value)}
                          />
                        </div>
                        <div className="pos-input-group">
                          <label className="p-label">SUPPLIER INV #</label>
                          <input
                            className="pos-input"
                            placeholder="e.g. CIP-9921"
                            value={supplierInvNo}
                            onChange={(e) => setSupplierInvNo(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-form-card">
                      <span className="p-label">ADD MEDICINES</span>
                      <div className="medicine-toolbar">
                        <div
                          className="medicine-search-wrapper"
                          style={{ position: "relative" }}
                        >
                          <input
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
                          />
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
                                    key={m.id}
                                    className="medicine-suggestion-item"
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
                            <th>Batch #</th>
                            <th>Expiry</th>
                            <th>Qty</th>
                            <th>Cost</th>
                            <th style={{ textAlign: "right" }}>Total</th>
                            <th></th>
                          </tr>
                        </thead>
                        {purchaseItems.length === 0 ? (
                          <tbody>
                            <tr>
                              <td
                                colSpan={7}
                                style={{
                                  textAlign: "center",
                                  padding: "24px",
                                  color: "rgba(255,255,255,0.25)",
                                  fontSize: "13px",
                                }}
                              >
                                No medicines added yet. Search and add from
                                above.
                              </td>
                            </tr>
                          </tbody>
                        ) : (
                          <tbody>
                            {purchaseItems.map((item) => (
                              <tr key={item.id}>
                                <td style={{ fontSize: "12px" }}>
                                  <b>{item.name}</b>
                                  <div className="result-meta">
                                    GST: {item.gstPercentage}%
                                  </div>
                                </td>
                                <td>
                                  <input
                                    className="p-cost-input"
                                    style={{ width: "80px" }}
                                    placeholder="Batch..."
                                    value={item.batchNumber || ""}
                                    onChange={(e) =>
                                      updateItem(
                                        item.id,
                                        "batchNumber",
                                        e.target.value,
                                      )
                                    }
                                  />
                                </td>
                                <td>
                                  <input
                                    className="p-cost-input"
                                    type="date"
                                    style={{ width: "125px" }}
                                    value={item.expiryDate || ""}
                                    onChange={(e) =>
                                      updateItem(
                                        item.id,
                                        "expiryDate",
                                        e.target.value,
                                      )
                                    }
                                  />
                                </td>
                                <td>
                                  <input
                                    className="p-cost-input"
                                    style={{ width: "50px" }}
                                    value={item.qty}
                                    onChange={(e) =>
                                      updateItem(item.id, "qty", e.target.value)
                                    }
                                  />
                                </td>
                                <td>
                                  <input
                                    className="p-cost-input"
                                    style={{ width: "65px" }}
                                    value={item.purchasePrice}
                                    onChange={(e) =>
                                      updateItem(
                                        item.id,
                                        "purchasePrice",
                                        e.target.value,
                                      )
                                    }
                                  />
                                </td>
                                <td
                                  style={{
                                    textAlign: "right",
                                    fontWeight: 700,
                                  }}
                                >
                                  ₹{(item.qty * item.purchasePrice).toFixed(2)}
                                </td>
                                <td>
                                  <button
                                    className="micro-btn"
                                    style={{ color: "var(--danger)" }}
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

                      <div className="purchase-summary">
                        <div className="summary-row">
                          <span>Subtotal</span>
                          <span>₹{subtotal.toFixed(2)}</span>
                        </div>
                        {purchaseItems.map((item) => {
                          const itemGst =
                            (item.qty *
                              item.purchasePrice *
                              item.gstPercentage) /
                            100;
                          return (
                            <div
                              key={item.id}
                              className="summary-row result-meta"
                              style={{ fontSize: "11px" }}
                            >
                              <span>
                                {item.name} (GST {item.gstPercentage}%)
                              </span>
                              <span>₹{itemGst.toFixed(2)}</span>
                            </div>
                          );
                        })}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontFamily: "Outfit",
                            fontSize: "22px",
                            fontWeight: 700,
                            color: "var(--primary)",
                            borderTop: "1px solid rgba(255,255,255,0.06)",
                            paddingTop: "12px",
                            marginTop: "8px",
                          }}
                        >
                          <span>Total</span>
                          <span>₹{grandTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`p-upload-zone ${dragOver ? "drag-over" : ""} ${uploadedFile ? "has-file" : ""}`}
                      onClick={() => fileInputRef.current?.click()}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,application/pdf"
                        style={{ display: "none" }}
                        onChange={handleFileChange}
                      />
                      {uploadedFile ? (
                        <>
                          <div
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "10px",
                              background: "rgba(79, 219, 200, 0.1)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              marginBottom: "8px",
                            }}
                          >
                            <UploadCloud
                              size={20}
                              style={{ color: "var(--primary)" }}
                            />
                          </div>
                          <div style={{ fontWeight: 700, fontSize: "13px" }}>
                            {uploadedFile.name}
                          </div>
                          <div
                            className="result-meta"
                            style={{ fontSize: "10px" }}
                          >
                            {(uploadedFile.size / 1024).toFixed(1)} KB
                          </div>
                          <button
                            className="micro-btn"
                            style={{
                              marginTop: "4px",
                              color: "var(--danger)",
                              fontSize: "11px",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setUploadedFile(null);
                            }}
                          >
                            <X size={14} /> Remove
                          </button>
                        </>
                      ) : (
                        <>
                          <UploadCloud
                            size={32}
                            style={{
                              color: "var(--primary)",
                              marginBottom: "8px",
                            }}
                          />
                          <div>
                            <b>Click or Drag</b> to upload invoice PDF
                          </div>
                          <div style={{ fontSize: "10px" }}>
                            Max file size: 5MB
                          </div>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="detail-view">
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">SUPPLIER</span>
                        <span className="detail-value">
                          {selectedRow.supplier?.name || selectedRow.supplier}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">DATE</span>
                        <span className="detail-value">
                          {selectedRow.date ||
                            formatDate(selectedRow.createdAt)}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">REF #</span>
                        <span className="detail-value">
                          {selectedRow.referenceNumber ||
                            selectedRow.ref ||
                            "-"}
                        </span>
                      </div>
                    </div>

                    <div style={{ marginTop: "32px" }}>
                      <span className="p-label">ITEMS</span>
                      <table className="p-line-table">
                        <thead>
                          <tr>
                            <th>Medicine</th>
                            <th>Qty</th>
                            <th>Cost</th>
                            <th style={{ textAlign: "right" }}>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(selectedRow.items || []).map((item, idx) => (
                            <tr key={idx}>
                              <td>{item.medicine?.name || item.name}</td>
                              <td>{item.quantity}</td>
                              <td>₹{item.purchasePrice}</td>
                              <td style={{ textAlign: "right" }}>
                                ₹
                                {Number(
                                  item.total || item.quantity * item.price || 0,
                                ).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                          {(!selectedRow.items ||
                            selectedRow.items.length === 0) && (
                            <tr>
                              <td colSpan="4">No item details available.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="detail-summary-card">
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "8px",
                        }}
                      >
                        <span>Subtotal</span>{" "}
                        <span>
                          ₹
                          {Number(
                            selectedRow?.subtotal ||
                              selectedRow?.totalAmount ||
                              selectedRow?.total ||
                              0,
                          ).toFixed(2)}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "8px",
                        }}
                      >
                        <span>GST</span>{" "}
                        <span>
                          ₹{Number(selectedRow?.gstAmount || 0).toFixed(2)}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontWeight: 800,
                          fontSize: "18px",
                          borderTop: "1px solid var(--outline-variant)",
                          paddingTop: "12px",
                          color: "var(--primary)",
                        }}
                      >
                        <span>TOTAL</span>{" "}
                        <span>
                          ₹
                          {Number(
                            selectedRow?.totalAmount || selectedRow?.total || 0,
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-drawer-footer">
                <button
                  className="pos-btn outline"
                  style={{ flex: 1 }}
                  onClick={closeDrawer}
                >
                  Cancel
                </button>
                {drawer === "invoice-detail" ? (
                  <button className="pos-btn teal" style={{ flex: 2 }}>
                    <Download size={16} /> Download PDF
                  </button>
                ) : (
                  <button
                    className="pos-btn teal"
                    style={{ flex: 2 }}
                    disabled={saving}
                    onClick={handleSavePurchase}
                  >
                    {saving ? "Saving..." : "Save Purchase"}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Supplier Return Modal ── */}
      <AnimatePresence>
        {showReturnModal && selectedRow && (
          <div className="stock-modal-overlay">
            <motion.div
              className="stock-modal-content"
              style={{ width: "500px" }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="stock-modal-header">
                <h3 style={{ fontFamily: "Outfit", fontWeight: 700 }}>
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
                  <label>Original Invoice</label>
                  <input
                    className="pos-input"
                    value={selectedRow.invoiceNumber || selectedRow.id}
                    disabled
                    style={{ width: "100%" }}
                  />
                </div>
                <div style={{ marginTop: "20px" }}>
                  {(selectedRow.items || []).map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        marginBottom: "12px",
                      }}
                    >
                      <input type="checkbox" defaultChecked />
                      <div style={{ flex: 1 }}>
                        {item.medicine?.name || item.name}
                      </div>
                      <input
                        className="p-cost-input"
                        defaultValue={item.quantity}
                        max={item.quantity}
                        style={{ width: "50px" }}
                      />
                    </div>
                  ))}
                  {(!selectedRow.items || selectedRow.items.length === 0) && (
                    <div>No items found to return.</div>
                  )}
                </div>
                <div className="pos-input-group" style={{ marginTop: "20px" }}>
                  <label>Return Reason</label>
                  <select className="pos-input" style={{ width: "100%" }}>
                    <option>Expired</option>
                    <option>Wrong Item</option>
                    <option>Quality Issue</option>
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
                  onClick={handleProcessReturn}
                >
                  Submit Return
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Receive Order Modal ── */}
      <AnimatePresence>
        {showReceiveModal && selectedRow && (
          <div className="stock-modal-overlay">
            <motion.div
              className="stock-modal-content"
              style={{ width: "600px" }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="stock-modal-header">
                <h3 style={{ fontFamily: "Outfit", fontWeight: 700 }}>
                  Confirm Order Receipt
                </h3>
                <button
                  className="micro-btn"
                  onClick={() => setShowReceiveModal(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="stock-modal-body">
                <p className="result-meta" style={{ marginBottom: "16px" }}>
                  Please confirm the quantities received for{" "}
                  {selectedRow.poNumber || selectedRow.id}.
                </p>

                <table className="p-line-table">
                  <thead>
                    <tr>
                      <th>Medicine</th>
                      <th>Ordered</th>
                      <th>Received</th>
                      <th>Batch #</th>
                      <th>Expiry</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedRow.items || []).map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.medicine?.name || item.name}</td>
                        <td>{item.quantity}</td>
                        <td>
                          <input
                            className="p-cost-input"
                            style={{ width: "60px" }}
                            defaultValue={item.quantity}
                          />
                        </td>
                        <td>
                          <input
                            className="p-cost-input"
                            placeholder="Batch..."
                          />
                        </td>
                        <td>
                          <input className="p-cost-input" type="date" />
                        </td>
                      </tr>
                    ))}
                    {(!selectedRow.items || selectedRow.items.length === 0) && (
                      <tr>
                        <td colSpan="5">No items to receive.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="stock-modal-footer">
                <button
                  className="pos-btn outline"
                  onClick={() => setShowReceiveModal(false)}
                >
                  Cancel
                </button>
                <button className="pos-btn teal" onClick={handleReceiveOrder}>
                  Confirm Receipt
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
