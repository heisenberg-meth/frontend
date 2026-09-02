import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Clock } from "lucide-react";
import api from "../api";
import { normalizeObjectResponse } from "../utils/apiNormalizer";
import ClearExpiredButton from "./ClearExpiredButton";
import {
  BulkDisposalSection1,
  BulkDisposalSection2,
  BulkDisposalSection3,
} from "./BulkDisposal/Bulkdisposal";

export default function BulkDisposal({ showToast }) {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [reason, setReason] = useState("Expired Stock");
  const [disposing, setDisposing] = useState(false);
  const [disposeProgress, setDisposeProgress] = useState({
    current: 0,
    total: 0,
  });
  const [result, setResult] = useState(null);
  const [overview, setOverview] = useState(null);
  const [expiryMetrics, setExpiryMetrics] = useState(null);
  const [selectAll, setSelectAll] = useState(false);
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [batchRes, overviewRes, metricsRes] = await Promise.all([
        api.get("/inventory/expired"),
        api.get("/inventory/expired/overview"),
        api.get("/inventory/expiry-metrics").catch(() => null),
      ]);
      const data = normalizeObjectResponse(batchRes);
      setBatches(Array.isArray(data) ? data : []);
      const ov = normalizeObjectResponse(overviewRes);
      setOverview(ov);
      const metrics = normalizeObjectResponse(metricsRes);
      setExpiryMetrics(metrics);
    } catch (err) {
      console.error(err);
      showToast?.("Failed to load expired inventory", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);
  useEffect(() => {
    (async () => {
      await fetchData();
    })();
  }, [fetchData]);
  const filtered = useMemo(() => {
    let result = batches;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.medicineName?.toLowerCase().includes(q) ||
          b.batchNumber?.toLowerCase().includes(q) ||
          b.genericName?.toLowerCase().includes(q),
      );
    }
    return result;
  }, [batches, searchQuery]);
  const toggleSelect = (batchId) => {
    const next = new Set(selected);
    if (next.has(batchId)) next.delete(batchId);
    else next.add(batchId);
    setSelected(next);
    setSelectAll(next.size === filtered.length && filtered.length > 0);
  };
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelected(new Set());
      setSelectAll(false);
    } else {
      setSelected(new Set(filtered.map((b) => b.batchId)));
      setSelectAll(true);
    }
  };
  const selectedData = useMemo(() => {
    return batches.filter((b) => selected.has(b.batchId));
  }, [batches, selected]);
  const selectedStats = useMemo(() => {
    const items = selectedData;
    const totalUnits = items.reduce((s, b) => s + b.quantity, 0);
    const totalValue = items.reduce((s, b) => s + b.totalValue, 0);
    return {
      count: items.length,
      totalUnits,
      totalValue,
    };
  }, [selectedData]);
  const disposingRef = useRef(false);
  const handleDispose = async () => {
    if (disposingRef.current) return;
    disposingRef.current = true;
    setDisposing(true);
    const total = selectedData.length;
    setDisposeProgress({
      current: 0,
      total,
    });
    try {
      const body = {
        items: selectedData.map((b) => ({
          medicineId: b.medicineId,
          batchId: b.batchId,
          quantity: b.quantity,
        })),
        reason,
      };
      setDisposeProgress({
        current: 0,
        total,
      });
      const res = await api.post("/inventory/disposal/bulk", body, {
        timeout: 30000,
      });
      // The API returns an array of result objects
      const data = Array.isArray(res.data?.data) ? res.data.data : res.data;
      setDisposeProgress({
        current: total,
        total,
      });
      const disposedItems = Array.isArray(data)
        ? data.filter((d) => d.status === "DISPOSED")
        : [];
      const skippedItems = Array.isArray(data)
        ? data.filter((d) => d.status === "SKIPPED")
        : [];
      setResult({
        items: Array.isArray(data) ? data : [],
        disposedCount: disposedItems.length,
        skippedCount: skippedItems.length,
        stats: selectedStats,
      });
      setShowConfirmModal(false);
    } catch (err) {
      showToast?.(
        "Disposal failed: " +
          (err.response?.data?.error?.message || err.message),
        "error",
      );
    } finally {
      disposingRef.current = false;
      setDisposing(false);
      setDisposeProgress({
        current: 0,
        total: 0,
      });
    }
  };
  const resetAll = () => {
    setSelected(new Set());
    setSelectAll(false);
    setShowConfirmModal(false);
    setResult(null);
    setReason("Expired Stock");
    fetchData();
  };
  if (loading) {
    return (
      <div
        className="flex items-center justify-center"
        style={{
          height: "60vh",
        }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="animate-spin"
            style={{
              width: 40,
              height: 40,
              border: "3px solid var(--primary-container)",
              borderTopColor: "var(--primary)",
              borderRadius: "50%",
            }}
          />
          <p
            style={{
              color: "var(--text-muted)",
              fontWeight: 500,
            }}
          >
            Loading expired inventory...
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="hub-container">
      <div className="hub-header">
        <div className="hub-title-group">
          <h2>Bulk Disposal</h2>
          <p>Select and dispose expired medicines in bulk</p>
        </div>
        <div
          className="hub-status-group"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div className="status-item">
            <Clock size={12} className="text-on-surface-variant" />
            <span className="text-on-surface-variant">
              {batches.length} expired batches
            </span>
          </div>
          {/* Clear already-disposed batches directly from the disposal page */}
          <ClearExpiredButton showToast={showToast} onCleared={fetchData} />
        </div>
      </div>

      <BulkDisposalSection1 overview={overview} expiryMetrics={expiryMetrics} />

      <BulkDisposalSection2
        setSearchQuery={setSearchQuery}
        setShowConfirmModal={setShowConfirmModal}
        selectedData={selectedData}
        selected={selected}
        toggleSelect={toggleSelect}
        selectedStats={selectedStats}
        filtered={filtered}
        resetAll={resetAll}
        batches={batches}
        result={result}
        selectAll={selectAll}
        toggleSelectAll={toggleSelectAll}
        searchQuery={searchQuery}
      />

      <BulkDisposalSection3
        setReason={setReason}
        setShowConfirmModal={setShowConfirmModal}
        disposing={disposing}
        showConfirmModal={showConfirmModal}
        handleDispose={handleDispose}
        selectedStats={selectedStats}
        disposeProgress={disposeProgress}
        reason={reason}
      />
    </div>
  );
}
