import { useState, useEffect, useMemo, useCallback } from "react";
import { History, Package, IndianRupee, FileText } from "lucide-react";
import { format } from "date-fns";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import api from "../api";
import { safeNumber } from "../utils/number.js";
import {
  DisposalHistorySection1,
  DisposalHistorySection2,
  DisposalHistorySection3,
  DisposalHistorySection4,
} from "./Disposal/Disposal.jsx";

const headers = [
  "Date",
  "Medicine",
  "Batch",
  "Quantity",
  "Purchase Price",
  "MRP",
  "Loss Value",
  "Reason",
  "Disposed By",
];

export default function DisposalHistory({ showToast }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        limit,
        skip: (page - 1) * limit,
      };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await api.get("/inventory/disposal-history", {
        params,
      });
      const data = res.data?.data || res.data || {};
      setItems(
        Array.isArray(data.items)
          ? data.items
          : Array.isArray(data)
            ? data
            : [],
      );
      setTotal(data.total || 0);
    } catch (err) {
      console.error("Failed to load disposal history:", err);
      showToast?.("Failed to load disposal history", "error");
    } finally {
      setLoading(false);
    }
  }, [page, limit, startDate, endDate, showToast]);
  useEffect(() => {
    (async () => {
      await fetchHistory();
    })();
  }, [fetchHistory]);
  const filtered = useMemo(() => {
    if (!searchQuery) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.medicine?.name?.toLowerCase().includes(q) ||
        item.medicine?.genericName?.toLowerCase().includes(q) ||
        item.batch?.batchNumber?.toLowerCase().includes(q) ||
        item.batchNumber?.toLowerCase().includes(q) ||
        item.reason?.toLowerCase().includes(q),
    );
  }, [items, searchQuery]);
  const totalPages = Math.ceil(total / limit);
  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Disposal History");
      sheet.columns = [
        {
          header: "Date",
          key: "date",
          width: 16,
        },
        {
          header: "Medicine",
          key: "medicine",
          width: 30,
        },
        {
          header: "Batch",
          key: "batch",
          width: 18,
        },
        {
          header: "Quantity",
          key: "quantity",
          width: 12,
        },
        {
          header: "Purchase Price",
          key: "purchasePrice",
          width: 16,
        },
        {
          header: "MRP",
          key: "mrp",
          width: 12,
        },
        {
          header: "Loss Value",
          key: "lossValue",
          width: 16,
        },
        {
          header: "Reason",
          key: "reason",
          width: 20,
        },
        {
          header: "Disposed By",
          key: "disposedBy",
          width: 20,
        },
      ];
      sheet.getRow(1).font = {
        bold: true,
      };
      sheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {
          argb: "FF1E293B",
        },
      };
      sheet.getRow(1).font = {
        bold: true,
        color: {
          argb: "FFFFFFFF",
        },
      };
      filtered.forEach((item) => {
        const qty = item.disposedQuantity || item.quantity || 0;
        const purchasePrice = safeNumber(item.purchasePrice || 0);
        const mrp = safeNumber(item.mrp || 0);
        sheet.addRow({
          date: item.disposedAt
            ? format(new Date(item.disposedAt), "dd-MMM-yyyy HH:mm")
            : "N/A",
          medicine: item.medicine?.name || item.medicineName || "Unknown",
          batch: item.batch?.batchNumber || item.batchNumber || "N/A",
          quantity: qty,
          purchasePrice: purchasePrice,
          mrp: mrp,
          lossValue: qty * purchasePrice,
          reason: item.reason || "N/A",
          disposedBy:
            item.user?.fullName ||
            item.user?.firstName + " " + item.user?.lastName ||
            item.disposedByName ||
            "N/A",
        });
      });
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(
        new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        `disposal-history-${format(new Date(), "yyyy-MM-dd")}.xlsx`,
      );
      showToast?.("Export downloaded", "success");
    } catch (err) {
      console.error("Export failed:", err);
      showToast?.("Export failed", "error");
    }
  };
  const handleExportCSV = () => {
    const rows = filtered.map((item) => {
      const qty = item.disposedQuantity || item.quantity || 0;
      const purchasePrice = safeNumber(item.purchasePrice || 0);
      return [
        item.disposedAt
          ? format(new Date(item.disposedAt), "dd-MMM-yyyy HH:mm")
          : "N/A",
        item.medicine?.name || item.medicineName || "Unknown",
        item.batch?.batchNumber || item.batchNumber || "N/A",
        qty,
        purchasePrice,
        safeNumber(item.mrp || 0),
        qty * purchasePrice,
        item.reason || "N/A",
        item.user?.fullName ||
          (item.user?.firstName
            ? `${item.user.firstName} ${item.user.lastName || ""}`
            : "") ||
          item.disposedByName ||
          "N/A",
      ];
    });
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], {
      type: "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `disposal-history-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast?.("CSV downloaded", "success");
  };
  const totalLoss = useMemo(
    () =>
      filtered.reduce(
        (s, item) =>
          s +
          (item.disposedQuantity || item.quantity || 0) *
            safeNumber(item.purchasePrice || 0),
        0,
      ),
    [filtered],
  );
  const totalUnits = useMemo(
    () =>
      filtered.reduce(
        (s, item) => s + (item.disposedQuantity || item.quantity || 0),
        0,
      ),
    [filtered],
  );
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
            Loading disposal history...
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="hub-container">
      <div className="hub-header">
        <div className="hub-title-group">
          <h2>Disposal History</h2>
          <p>Complete audit trail of all inventory disposals</p>
        </div>
        <div className="hub-status-group">
          <div className="status-item">
            <History size={12} className="text-on-surface-variant" />
            <span className="text-on-surface-variant">{total} records</span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div
          className="stat-card-v2"
          style={{
            cursor: "default",
          }}
        >
          <div className="stat-v2-header">
            <span className="stat-v2-label">Total Disposals</span>
            <div className="stat-v2-icon danger bg-rose-500/10 text-rose-500">
              <Package size={14} />
            </div>
          </div>
          <div className="stat-v2-val danger text-rose-500">{total}</div>
        </div>
        <div
          className="stat-card-v2"
          style={{
            cursor: "default",
          }}
        >
          <div className="stat-v2-header">
            <span className="stat-v2-label">Units Disposed</span>
            <div className="stat-v2-icon warning bg-yellow-500/10 text-yellow-500">
              <FileText size={14} />
            </div>
          </div>
          <div className="stat-v2-val warning text-yellow-500">
            {totalUnits.toLocaleString("en-IN")}
          </div>
        </div>
        <div
          className="stat-card-v2"
          style={{
            cursor: "default",
          }}
        >
          <div className="stat-v2-header">
            <span className="stat-v2-label">Total Loss Value</span>
            <div className="stat-v2-icon danger bg-rose-500/10 text-rose-500">
              <IndianRupee size={14} />
            </div>
          </div>
          <div className="stat-v2-val danger text-rose-500">
            {"\u20B9"}
            {safeNumber(totalLoss).toLocaleString("en-IN", {
              maximumFractionDigits: 2,
            })}
          </div>
        </div>
      </div>

      {/* Filters */}
      <DisposalHistorySection1
        setSearchQuery={setSearchQuery}
        setStartDate={setStartDate}
        setPage={setPage}
        setEndDate={setEndDate}
        searchQuery={searchQuery}
        startDate={startDate}
        endDate={endDate}
        handleExportCSV={handleExportCSV}
        handleExportExcel={handleExportExcel}
      />

      {/* Table */}
      <DisposalHistorySection2
        filtered={filtered}
        items={items}
        setSelectedItem={setSelectedItem}
      />

      {/* Pagination */}
      <DisposalHistorySection3
        setPage={setPage}
        totalPages={totalPages}
        page={page}
        limit={limit}
        total={total}
      />

      {/* Detail Modal */}
      <DisposalHistorySection4
        selectedItem={selectedItem}
        setSelectedItem={setSelectedItem}
      />
    </div>
  );
}
