import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  ChevronUp,
  ChevronDown,
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";

function Spinner({ size = 14 }) {
  return (
    <Loader2 size={size} style={{ animation: "spin 0.8s linear infinite" }} />
  );
}

export default function DataTable({
  data = [],
  columns = [],
  loading = false,
  searchPlaceholder = "Search...",
  searchable = true,
  sortable = true,
  paginated = true,
  pageSize = 10,
  emptyMessage = "No data found",
  onRowClick = null,
  renderActions = null,
  exportData = null,
  exportFileName = "export",
  idField = "id",
}) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = useMemo(() => {
    if (!search) return data;
    const lowerSearch = search.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const value = col.accessor ? col.accessor(row) : row[col.field];
        return (
          value != null && String(value).toLowerCase().includes(lowerSearch)
        );
      }),
    );
  }, [data, search, columns]);

  const sortedData = useMemo(() => {
    if (!sortField || !sortable) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = columns.find((c) => c.field === sortField)?.accessor
        ? columns.find((c) => c.field === sortField).accessor(a)
        : a[sortField];
      const bVal = columns.find((c) => c.field === sortField)?.accessor
        ? columns.find((c) => c.field === sortField).accessor(b)
        : b[sortField];

      if (aVal == null) return 1;
      if (bVal == null) return -1;

      const comparison = String(aVal).localeCompare(String(bVal), undefined, {
        numeric: true,
      });
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredData, sortField, sortDirection, sortable, columns]);

  const paginatedData = useMemo(() => {
    if (!paginated) return sortedData;
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize, paginated]);

  const totalPages = paginated ? Math.ceil(sortedData.length / pageSize) : 1;

  const handleSort = (field) => {
    if (!sortable) return;
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleExport = () => {
    if (!exportData) {
      const headers = columns.map((c) => c.header).join(",");
      const rows = sortedData.map((row) =>
        columns
          .map((col) => {
            const val = col.accessor ? col.accessor(row) : row[col.field];
            return `"${String(val ?? "").replace(/"/g, '""')}"`;
          })
          .join(","),
      );
      const csv = [headers, ...rows].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${exportFileName}.csv`;
      a.click();
      return;
    }
    exportData(sortedData);
  };

  return (
    <div className="data-table-container">
      {/* Toolbar */}
      <div className="data-table-toolbar">
        {searchable && (
          <div className="data-table-search">
            <Search size={18} className="search-icon" />
            <input
              required
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        )}
        {exportData !== false && (
          <button className="data-table-export-btn" onClick={handleExport}>
            <Download size={16} /> Export
          </button>
        )}
      </div>

      {/* Table */}
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.field}
                  className={
                    sortable && col.sortable !== false ? "sortable" : ""
                  }
                  onClick={() => handleSort(col.field)}
                  style={col.headerStyle}
                >
                  <span>{col.header}</span>
                  {sortable &&
                    col.sortable !== false &&
                    sortField === col.field && (
                      <span className="sort-indicator">
                        {sortDirection === "asc" ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        )}
                      </span>
                    )}
                </th>
              ))}
              {renderActions && <th>ACTIONS</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length + (renderActions ? 1 : 0)}
                  className="data-table-loading"
                >
                  <Spinner size={20} /> Loading data...
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (renderActions ? 1 : 0)}
                  className="data-table-empty"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <motion.tr
                  key={row[idField] || idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => onRowClick && onRowClick(row)}
                  style={{ cursor: onRowClick ? "pointer" : "default" }}
                >
                  {columns.map((col) => (
                    <td key={col.field} style={col.cellStyle}>
                      {col.render
                        ? col.render(row)
                        : col.accessor
                          ? col.accessor(row)
                          : row[col.field]}
                    </td>
                  ))}
                  {renderActions && (
                    <td className="data-table-actions">{renderActions(row)}</td>
                  )}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {paginated && totalPages > 1 && (
        <div className="data-table-pagination">
          <span className="pagination-info">
            Showing {(currentPage - 1) * pageSize + 1}–
            {Math.min(currentPage * pageSize, sortedData.length)} of{" "}
            {sortedData.length}
          </span>
          <div className="pagination-controls">
            <button
              className="pagination-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page;
              if (totalPages <= 5) {
                page = i + 1;
              } else if (currentPage <= 3) {
                page = i + 1;
              } else if (currentPage >= totalPages - 2) {
                page = totalPages - 4 + i;
              } else {
                page = currentPage - 2 + i;
              }
              return (
                <button
                  key={page}
                  className={`pagination-btn ${currentPage === page ? "active" : ""}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              );
            })}
            <button
              className="pagination-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
