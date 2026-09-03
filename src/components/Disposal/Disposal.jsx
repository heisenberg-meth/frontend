import {
  Download,
  Search,
  X,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { AnimatePresence, m } from "framer-motion";

import { safeNumber } from "../../utils/number.js";

export function DisposalHistorySection1({
  searchQuery,
  startDate,
  endDate,
  handleExportCSV,
  handleExportExcel,
  setSearchQuery,
  setStartDate,
  setPage,
  setEndDate,
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          flex: 1,
        }}
      >
        <div
          className="search-box"
          style={{
            maxWidth: 320,
          }}
        >
          <Search size={14} className="search-icon" />
          <>
            <label htmlFor="field_sjjuwf" className="sr-only">
              Search medicine, batch, or reason...
            </label>
            <input
              type="text"
              placeholder="Search medicine, batch, or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              id="field_sjjuwf"
            />
          </>
          {searchQuery && (
            <button
              className="search-clear"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <input
          type="date"
          value={startDate}
          aria-label="Start date"
          onChange={(e) => {
            setStartDate(e.target.value);
            setPage(1);
          }}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid var(--outline-variant)",
            background: "var(--surface)",
            color: "var(--text)",
            fontSize: 13,
          }}
        />
        <input
          type="date"
          value={endDate}
          aria-label="End date"
          onChange={(e) => {
            setEndDate(e.target.value);
            setPage(1);
          }}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid var(--outline-variant)",
            background: "var(--surface)",
            color: "var(--text)",
            fontSize: 13,
          }}
        />
        {(startDate || endDate) && (
          <button
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid var(--outline-variant)",
              background: "transparent",
              color: "var(--text-muted)",
              fontSize: 12,
              cursor: "pointer",
            }}
            onClick={() => {
              setStartDate("");
              setEndDate("");
              setPage(1);
            }}
          >
            Clear Dates
          </button>
        )}
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
        }}
      >
        <button
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "1px solid var(--outline-variant)",
            background: "var(--surface-container)",
            color: "var(--text-muted)",
            fontSize: 13,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
          onClick={handleExportCSV}
        >
          <Download size={14} />
          CSV
        </button>
        <button
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "1px solid var(--outline-variant)",
            background: "var(--surface-container)",
            color: "var(--text-muted)",
            fontSize: 13,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
          onClick={handleExportExcel}
        >
          <Download size={14} />
          Excel
        </button>
      </div>
    </div>
  );
}
export function DisposalHistorySection2({ filtered, items, setSelectedItem }) {
  return (
    <div
      className="bento-card"
      style={{
        overflow: "auto",
        padding: 0,
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 13,
        }}
      >
        <thead>
          <tr
            style={{
              borderBottom: "1px solid var(--outline-variant)",
              background: "var(--surface-container)",
            }}
          >
            <th
              style={{
                padding: "12px 16px",
                textAlign: "left",
              }}
            >
              Date
            </th>
            <th
              style={{
                padding: "12px 16px",
                textAlign: "left",
              }}
            >
              Medicine
            </th>
            <th
              style={{
                padding: "12px 16px",
                textAlign: "left",
              }}
            >
              Batch
            </th>
            <th
              style={{
                padding: "12px 16px",
                textAlign: "right",
              }}
            >
              Qty
            </th>
            <th
              style={{
                padding: "12px 16px",
                textAlign: "right",
              }}
            >
              Loss Value
            </th>
            <th
              style={{
                padding: "12px 16px",
                textAlign: "left",
              }}
            >
              Reason
            </th>
            <th
              style={{
                padding: "12px 16px",
                textAlign: "left",
              }}
            >
              Disposed By
            </th>
            <th
              style={{
                padding: "12px 16px",
                textAlign: "center",
              }}
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td
                colSpan={8}
                style={{
                  padding: 40,
                  textAlign: "center",
                  color: "var(--text-muted)",
                }}
              >
                {items.length === 0
                  ? "No disposal records found"
                  : "No results match your search"}
              </td>
            </tr>
          ) : (
            filtered.map((item) => {
              const qty = item.disposedQuantity || item.quantity || 0;
              const lossValue = qty * safeNumber(item.purchasePrice || 0);
              return (
                <tr
                  key={item.id}
                  style={{
                    borderBottom: "1px solid var(--outline-variant)",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--overlay-03)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <td
                    style={{
                      padding: "10px 16px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Calendar
                        size={12}
                        style={{
                          color: "var(--text-dim)",
                        }}
                      />
                      {item.disposedAt
                        ? format(new Date(item.disposedAt), "dd-MMM-yyyy")
                        : "N/A"}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-dim)",
                        marginTop: 2,
                      }}
                    >
                      {item.disposedAt
                        ? format(new Date(item.disposedAt), "HH:mm")
                        : ""}
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "10px 16px",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                      }}
                    >
                      {item.medicine?.name || item.medicineName || "Unknown"}
                    </div>
                    {item.medicine?.genericName && (
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--text-dim)",
                        }}
                      >
                        {item.medicine.genericName}
                      </div>
                    )}
                  </td>
                  <td
                    style={{
                      padding: "10px 16px",
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                    }}
                  >
                    {item.batch?.batchNumber || item.batchNumber || "N/A"}
                  </td>
                  <td
                    style={{
                      padding: "10px 16px",
                      textAlign: "right",
                      fontWeight: 600,
                    }}
                  >
                    {qty.toLocaleString("en-IN")}
                  </td>
                  <td
                    style={{
                      padding: "10px 16px",
                      textAlign: "right",
                      fontWeight: 600,
                      color: "var(--danger)",
                    }}
                  >
                    {"\u20B9"}
                    {safeNumber(lossValue).toLocaleString("en-IN", {
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td
                    style={{
                      padding: "10px 16px",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: 4,
                        background: "var(--overlay-10)",
                        fontSize: 12,
                        fontWeight: 500,
                      }}
                    >
                      {item.reason || "N/A"}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "10px 16px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <User
                        size={12}
                        style={{
                          color: "var(--text-dim)",
                        }}
                      />
                      {item.user?.fullName ||
                        (item.user?.firstName
                          ? `${item.user.firstName} ${item.user.lastName || ""}`
                          : "") ||
                        item.disposedByName ||
                        "N/A"}
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "10px 16px",
                      textAlign: "center",
                    }}
                  >
                    <button
                      style={{
                        padding: "4px 10px",
                        borderRadius: 6,
                        border: "1px solid var(--outline-variant)",
                        background: "transparent",
                        color: "var(--primary)",
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedItem(item);
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
export function DisposalHistorySection3({
  setPage,
  totalPages,
  page,
  limit,
  total,
}) {
  return (
    totalPages > 1 && (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 16,
          padding: "12px 20px",
          borderRadius: 12,
          background: "var(--surface-container)",
          border: "1px solid var(--outline-variant)",
        }}
      >
        <span
          style={{
            fontSize: 13,
            color: "var(--text-muted)",
          }}
        >
          Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of{" "}
          {total}
        </span>
        <div
          style={{
            display: "flex",
            gap: 6,
          }}
        >
          <button
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid var(--outline-variant)",
              background: page === 1 ? "var(--overlay-05)" : "var(--surface)",
              color: page === 1 ? "var(--text-dim)" : "var(--text)",
              fontSize: 13,
              cursor: page === 1 ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft size={14} />
            Prev
          </button>
          <button
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid var(--outline-variant)",
              background:
                page === totalPages ? "var(--overlay-05)" : "var(--surface)",
              color: page === totalPages ? "var(--text-dim)" : "var(--text)",
              fontSize: 13,
              cursor: page === totalPages ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    )
  );
}
export function DisposalHistorySection4({ selectedItem, setSelectedItem }) {
  return (
    <AnimatePresence>
      {selectedItem && (
        <div
          className="stock-modal-overlay"
          role="presentation"
          onClick={() => setSelectedItem(null)}
        >
          <m.div
            role="presentation"
            className="stock-modal-content"
            style={{
              maxWidth: 520,
            }}
            initial={{
              opacity: 0,
              scale: 0.95,
              y: 20,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.95,
              y: 20,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="stock-modal-header">
              <h3>Disposal Record Details</h3>
              <button
                className="micro-btn"
                onClick={() => setSelectedItem(null)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>
            <div className="stock-modal-body">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                {[
                  {
                    label: "Medicine",
                    value:
                      selectedItem.medicine?.name ||
                      selectedItem.medicineName ||
                      "Unknown",
                  },
                  {
                    label: "Batch Number",
                    value:
                      selectedItem.batch?.batchNumber ||
                      selectedItem.batchNumber ||
                      "N/A",
                  },
                  {
                    label: "Disposed Date",
                    value: selectedItem.disposedAt
                      ? format(
                          new Date(selectedItem.disposedAt),
                          "dd-MMM-yyyy HH:mm",
                        )
                      : "N/A",
                  },
                  {
                    label: "Quantity Disposed",
                    value: (
                      selectedItem.disposedQuantity ||
                      selectedItem.quantity ||
                      0
                    ).toLocaleString("en-IN"),
                  },
                  {
                    label: "Purchase Price",
                    value:
                      "\u20B9" +
                      safeNumber(
                        selectedItem.purchasePrice || 0,
                      ).toLocaleString("en-IN", {
                        maximumFractionDigits: 2,
                      }),
                  },
                  {
                    label: "MRP",
                    value:
                      "\u20B9" +
                      safeNumber(selectedItem.mrp || 0).toLocaleString(
                        "en-IN",
                        {
                          maximumFractionDigits: 2,
                        },
                      ),
                  },
                  {
                    label: "Loss Value",
                    value:
                      "\u20B9" +
                      (
                        (selectedItem.disposedQuantity ||
                          selectedItem.quantity ||
                          0) * safeNumber(selectedItem.purchasePrice || 0)
                      ).toLocaleString("en-IN", {
                        maximumFractionDigits: 2,
                      }),
                  },
                  {
                    label: "Reason",
                    value: selectedItem.reason || "N/A",
                  },
                  {
                    label: "Disposed By",
                    value:
                      selectedItem.user?.fullName ||
                      (selectedItem.user?.firstName
                        ? `${selectedItem.user.firstName} ${selectedItem.user.lastName || ""}`
                        : "") ||
                      selectedItem.disposedByName ||
                      "N/A",
                  },
                  {
                    label: "Record ID",
                    value: selectedItem.id
                      ? selectedItem.id.slice(0, 8) + "..."
                      : "N/A",
                  },
                ].map((field) => (
                  <div
                    key={field.label}
                    style={{
                      background: "var(--surface-container)",
                      borderRadius: 8,
                      padding: "10px 12px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginBottom: 4,
                      }}
                    >
                      {field.label}
                    </div>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 14,
                      }}
                    >
                      {field.value}
                    </div>
                  </div>
                ))}
              </div>

              {selectedItem.notes && (
                <div
                  style={{
                    marginTop: 12,
                    background: "var(--surface-container)",
                    borderRadius: 8,
                    padding: "10px 12px",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: 4,
                    }}
                  >
                    Notes
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                    }}
                  >
                    {selectedItem.notes}
                  </div>
                </div>
              )}
            </div>
            <div className="stock-modal-footer">
              <button
                className="pos-btn outline"
                style={{
                  flex: 1,
                }}
                onClick={() => setSelectedItem(null)}
              >
                Close
              </button>
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}
