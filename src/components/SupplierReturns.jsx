import { useState, useEffect, useCallback } from "react";
import {
  PackageX,
  Plus,
  RefreshCw,
  AlertTriangle,
  CreditCard,
} from "lucide-react";
import {
  getDashboardMetrics,
  getExpiredGroupedBySupplier,
  getExpiredInventorySummary,
  createSupplierReturn,
  getSupplierReturns,
  updateReturnStatus,
  generateCreditNote,
  getCreditNotes,
} from "../services/supplier-returns.service.js";
import "../styles/Supplierreturn.css";
import api from "../api.js";
import { API_ROUTES } from "../constants/api.routes.js";
import { getErrorMessage } from "../utils/formUtils.js";
import {
  SupplierReturnsSection1,
  SupplierReturnsSection2,
  SupplierReturnsSection3,
  SupplierReturnsSection4,
} from "./Suppliers/Suppliers.jsx";

const tabs = [
  {
    id: "returns",
    label: "Returns",
    icon: PackageX,
  },
  {
    id: "credit-notes",
    label: "Credit Notes",
    icon: CreditCard,
  },
  {
    id: "expired",
    label: "Expired Stock",
    icon: AlertTriangle,
  },
];

export default function SupplierReturns({ showToast }) {
  const [activeTab, setActiveTab] = useState("returns");
  const [returns, setReturns] = useState([]);
  const [creditNotes, setCreditNotes] = useState([]);
  const [expiredBySupplier, setExpiredBySupplier] = useState([]);
  const [expiredSummary, setExpiredSummary] = useState(null);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createData, setCreateData] = useState({
    supplierId: "",
    reason: "",
    items: [],
    notes: "",
  });
  const [suppliers, setSuppliers] = useState([]);
  const [eligibleBatches, setEligibleBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const notify = useCallback(
    (msg, type = "success") => {
      showToast?.(msg, type);
    },
    [showToast],
  );
  const fetchReturns = useCallback(
    async (p = page) => {
      setLoading(true);
      try {
        const params = {
          page: p,
          limit: 20,
        };
        if (statusFilter) params.status = statusFilter;
        const { data } = await getSupplierReturns(params);
        if (data.success) {
          setReturns(data.data);
          setTotal(data.pagination.total);
          setTotalPages(data.pagination.totalPages);
          setPage(data.pagination.page);
        }
      } catch (err) {
        notify(getErrorMessage(err) || "Failed to load returns", "error");
      } finally {
        setLoading(false);
      }
    },
    [notify, page, statusFilter],
  );
  const fetchCreditNotes = useCallback(
    async (p = page) => {
      setLoading(true);
      try {
        const params = {
          page: p,
          limit: 20,
        };
        const { data } = await getCreditNotes(params);
        if (data.success) {
          setCreditNotes(data.data);
          setTotal(data.pagination.total);
          setTotalPages(data.pagination.totalPages);
          setPage(data.pagination.page);
        }
      } catch (err) {
        notify(getErrorMessage(err) || "Failed to load credit notes", "error");
      } finally {
        setLoading(false);
      }
    },
    [notify, page],
  );
  const loadSuppliers = useCallback(async () => {
    try {
      const res = await api.get(API_ROUTES.SUPPLIERS);
      const payload = res.data;
      const suppliersList =
        payload?.data?.suppliers ??
        payload?.data ??
        payload?.suppliers ??
        payload ??
        [];
      setSuppliers(Array.isArray(suppliersList) ? suppliersList : []);
    } catch (err) {
      console.error("Failed to load suppliers", err);
      notify(getErrorMessage(err) || "Failed to load suppliers", "error");
      setSuppliers([]);
    }
  }, [notify]);
  const fetchExpiredData = useCallback(async () => {
    setLoading(true);
    try {
      const [returnsRes, creditRes, groupRes, sumRes] = await Promise.all([
        getSupplierReturns({
          page: 1,
          limit: 10,
        }),
        getCreditNotes({
          page: 1,
          limit: 10,
        }),
        getExpiredGroupedBySupplier(),
        getExpiredInventorySummary(),
      ]);
      setReturns(returnsRes.data?.data?.returns || []);
      setCreditNotes(creditRes.data?.data?.notes || []);
      setExpiredBySupplier(groupRes.data?.data || []);
      setExpiredSummary(sumRes.data?.data);
    } catch (err) {
      notify(getErrorMessage(err) || "Failed to load expired data", "error");
    } finally {
      setLoading(false);
    }
  }, [notify]);
  useEffect(() => {
    const initSuppliers = async () => {
      await loadSuppliers();
    };
    initSuppliers();
  }, [loadSuppliers]);
  useEffect(() => {
    if (showCreateModal) {
      const fetchModalSuppliers = async () => {
        await loadSuppliers();
      };
      fetchModalSuppliers();
    }
  }, [showCreateModal, loadSuppliers]);
  const loadEligibleBatches = async (supplierId, reason) => {
    if (!supplierId || !reason) {
      setEligibleBatches([]);
      return;
    }
    setLoadingBatches(true);
    try {
      const res = await api.get(
        `${API_ROUTES.SUPPLIER_RETURNS}/suppliers/${supplierId}/inward`,
        {
          params: {
            limit: 1000,
          },
        },
      );
      let batches = res.data?.data?.transactions || [];
      if (reason === "EXPIRED") {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        batches = batches.filter(
          (b) => new Date(b.expiryDate) < now || b.status === "EXPIRED",
        );
      }
      setEligibleBatches(batches);
    } catch (err) {
      showToast("Failed to load batches", "error", err);
    } finally {
      setLoadingBatches(false);
    }
  };
  useEffect(() => {
    const loadData = async () => {
      if (activeTab === "returns") {
        await fetchReturns();
      } else if (activeTab === "credit-notes") {
        await fetchCreditNotes();
      } else {
        await fetchExpiredData();
      }
    };
    loadData();
  }, [activeTab, fetchCreditNotes, fetchExpiredData, fetchReturns]);
  useEffect(() => {
    getDashboardMetrics()
      .then((res) => setMetrics(res.data?.data || null))
      .catch(() => {});
  }, []);
  const handleCreateReturn = async () => {
    try {
      if (
        !createData.supplierId ||
        createData.items.length === 0 ||
        !createData.reason
      ) {
        showToast(
          "Please select a supplier, reason, and at least one item",
          "error",
        );
        return;
      }
      const payload = {
        supplierId: createData.supplierId,
        notes: createData.notes,
        reason: createData.reason,
        items: createData.items.map((i) => ({
          medicineId: i.medicineId,
          batchId: i.id,
          quantity: i.returnQty,
          reason: createData.reason,
        })),
      };
      await createSupplierReturn(payload);
      showToast("Return created successfully", "success");
      setShowCreateModal(false);
      setCreateData({
        supplierId: "",
        reason: "",
        items: [],
        notes: "",
      });
      fetchReturns();
    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to create return",
        "error",
      );
    }
  };
  const handleStatusUpdate = async (id, status) => {
    try {
      const { data } = await updateReturnStatus(id, status);
      if (data.success) {
        notify(`Return status updated to ${status}`);
        fetchReturns();
        if (selectedReturn?.id === id) setSelectedReturn(data.data);
      }
    } catch (err) {
      notify(getErrorMessage(err) || "Failed to update status", "error");
    }
  };
  const handleGenerateCreditNote = async (returnId) => {
    try {
      const res = await generateCreditNote(returnId, {
        notes: "Auto-generated credit note",
      });
      showToast("Credit note generated successfully", "success", res);
      fetchReturns();
    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to generate credit note",
        "error",
      );
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-left">
          <PackageX size={28} />
          <div>
            <h1 className="page-title">Supplier Returns</h1>
            <p className="page-subtitle">Manage returns, credit notes & expired inventory</p>
          </div>
        </div>
        <div className="page-header-actions">
          {activeTab === "returns" && (
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={16} /> New Return
            </button>
          )}
          <button
            className="btn btn-ghost"
            onClick={() => {
              if (activeTab === "returns") fetchReturns();
              else if (activeTab === "credit-notes") fetchCreditNotes();
              else fetchExpiredData();
            }}
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      <div className="tabs-nav">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => {
              setActiveTab(tab.id);
              setPage(1);
            }}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <SupplierReturnsSection1 metrics={metrics} />

      <SupplierReturnsSection2
        setSearchQuery={setSearchQuery}
        setStatusFilter={setStatusFilter}
        setPage={setPage}
        notify={notify}
        fetchReturns={fetchReturns}
        setSelectedReturn={setSelectedReturn}
        setExpandedGroup={setExpandedGroup}
        expandedGroup={expandedGroup}
        setCreateData={setCreateData}
        setEligibleBatches={setEligibleBatches}
        setShowCreateModal={setShowCreateModal}
        loading={loading}
        activeTab={activeTab}
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        returns={returns}
        page={page}
        totalPages={totalPages}
        total={total}
        creditNotes={creditNotes}
        expiredSummary={expiredSummary}
        expiredBySupplier={expiredBySupplier}
      />

      <SupplierReturnsSection3
        setSelectedReturn={setSelectedReturn}
        handleStatusUpdate={handleStatusUpdate}
        selectedReturn={selectedReturn}
        handleGenerateCreditNote={handleGenerateCreditNote}
      />

      <SupplierReturnsSection4
        setShowCreateModal={setShowCreateModal}
        setCreateData={setCreateData}
        loadEligibleBatches={loadEligibleBatches}
        createData={createData}
        suppliers={suppliers}
        loadingBatches={loadingBatches}
        eligibleBatches={eligibleBatches}
        handleCreateReturn={handleCreateReturn}
      />
    </div>
  );
}
