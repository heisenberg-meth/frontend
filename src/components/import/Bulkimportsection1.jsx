import React, { useState, useMemo, useRef } from "react";
import {
  UploadCloud,
  RefreshCw,
  Truck,
  GitMerge,
  CheckCircle2,
  AlertCircle,
  X,
  FileSpreadsheet,
  Download,
} from "lucide-react";
import { AnimatePresence, m } from "framer-motion";
import { TableHeader } from "../common/TableHeader.jsx";

const fields = [
  {
    key: "nameColumn",
    label: "Medication Name",
  },
  {
    key: "qtyColumn",
    label: "Units in Stock",
  },
  {
    key: "expiryColumn",
    label: "Expiry Date",
  },
  {
    key: "priceColumn",
    label: "Unit Price (INR)",
  },
  {
    key: "batchColumn",
    label: "Batch Number",
  },
  {
    key: "barcodeColumn",
    label: "Barcode / SKU",
  },
  {
    key: "categoryColumn",
    label: "Category",
  },
  {
    key: "manufacturerColumn",
    label: "Manufacturer",
  },
  {
    key: "genericNameColumn",
    label: "Generic Name",
  },
  {
    key: "strengthColumn",
    label: "Strength",
  },
  {
    key: "dosageFormColumn",
    label: "Dosage Form",
  },
  {
    key: "scheduleColumn",
    label: "Regulatory Classification",
  },
  {
    key: "hsnCodeColumn",
    label: "HSN Code",
  },
  {
    key: "gstPercentageColumn",
    label: "GST %",
  },
];

function getErrorCategory(err) {
  if (err.category && err.category !== "Other") return err.category;
  const field = (err.field || "").toLowerCase();
  const code = (err.code || err.errorCode || "").toUpperCase();
  const reason = (err.message || err.reason || "").toLowerCase();

  if (field === "quantity" || code.includes("QUANTITY")) return "Quantity";
  if (
    field === "expirydate" ||
    field === "expiry" ||
    code.includes("EXPIRY") ||
    code.includes("EXPIRED")
  )
    return "Expiry";
  if (
    field === "price" ||
    field === "mrp" ||
    field === "sellingprice" ||
    code.includes("PRICE") ||
    code.includes("MRP")
  )
    return "Pricing";
  if (code.startsWith("MISSING_") || reason.includes("is required"))
    return "Required";
  if (code.includes("DUPLICATE") || reason.includes("duplicate"))
    return "Duplicate";
  return "Other";
}

function downloadFailedRecordsCsv(
  errorList,
  filenamePrefix = "failed_inventory_import",
) {
  if (!errorList || errorList.length === 0) return;

  const todayStr = new Date().toISOString().split("T")[0];
  const filename = `${filenamePrefix}_${todayStr}.csv`;

  const headers = [
    "Original Row",
    "Medicine Name",
    "Batch Number",
    "Failed Field",
    "Provided Value",
    "Import Failure Reason",
    "Recommended Action",
  ];

  const rows = [];
  for (const item of errorList) {
    if (item.errors && Array.isArray(item.errors) && item.errors.length > 0) {
      for (const err of item.errors) {
        rows.push([
          item.row || item.rowNumber || "",
          item.name || item.medicineName || "",
          item.batch || item.batchNumber || "",
          err.field || "",
          err.value !== undefined && err.value !== null
            ? String(err.value)
            : "",
          err.message || err.reason || "",
          err.action || "",
        ]);
      }
    } else {
      rows.push([
        item.row || item.rowNumber || "",
        item.name || item.medicineName || "",
        item.batch || item.batchNumber || "",
        item.field || "",
        item.value !== undefined && item.value !== null
          ? String(item.value)
          : "",
        item.message || item.reason || "",
        item.action || "",
      ]);
    }
  }

  const escapeCsv = (str) => {
    if (str === null || str === undefined) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const csvContent = [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) => row.map(escapeCsv).join(",")),
  ].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function FailedRecordsView({
  title,
  errors = [],
  selectedCategory,
  onSelectCategory,
  onDownloadCsv,
  isExpanded: controlledIsExpanded,
  onToggleExpand,
}) {
  const [internalExpanded, setInternalExpanded] = useState(true);
  const isExpanded =
    controlledIsExpanded !== undefined
      ? controlledIsExpanded
      : internalExpanded;
  const toggleExpanded = () => {
    if (onToggleExpand) {
      onToggleExpand();
    } else {
      setInternalExpanded(!internalExpanded);
    }
  };
  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleRow = (key) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const categoryCounts = useMemo(() => {
    const counts = {
      All: errors.length,
      Quantity: 0,
      Expiry: 0,
      Pricing: 0,
      Required: 0,
      Duplicate: 0,
      Other: 0,
    };
    for (const err of errors) {
      const cat = getErrorCategory(err);
      if (counts[cat] !== undefined) {
        counts[cat]++;
      } else {
        counts.Other++;
      }
    }
    return counts;
  }, [errors]);

  const filteredErrors = useMemo(() => {
    if (selectedCategory === "All") return errors;
    return errors.filter((err) => {
      const cat = getErrorCategory(err);
      if (cat === selectedCategory) return true;
      if (err.errors && Array.isArray(err.errors)) {
        return err.errors.some(
          (sub) => getErrorCategory(sub) === selectedCategory,
        );
      }
      return false;
    });
  }, [errors, selectedCategory]);

  if (!errors || errors.length === 0) return null;

  return (
    <div className="failed-records-panel" id="failed-records-section">
      <div className="failed-records-header">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <h3>
            <AlertCircle size={20} style={{ color: "var(--danger)" }} />
            {title || "Failed Records"} ({errors.length})
          </h3>
          <button
            type="button"
            className="pos-btn outline small"
            onClick={toggleExpanded}
            style={{
              padding: "4px 12px",
              fontSize: "12px",
              borderRadius: "6px",
            }}
          >
            {isExpanded ? "Hide Details" : "View Details"}
          </button>
        </div>
        <div className="failed-records-header-actions">
          <button
            type="button"
            className="download-csv-btn"
            onClick={onDownloadCsv}
            title="Download failed rows as CSV to fix and re-import"
          >
            <Download size={15} />
            <span>Download Failed Rows</span>
          </button>
        </div>
      </div>

      <p
        style={{
          fontSize: "13px",
          color: "var(--text-muted)",
          margin: "0 0 16px 0",
        }}
      >
        {errors.length} records could not be imported. Review the reasons below
        and correct your CSV before importing again.
      </p>

      {isExpanded && (
        <>
          {/* Error Count Cards (PRD §13 & §19) */}
          <div className="error-stat-cards">
            <button
              type="button"
              className={`error-stat-card danger ${selectedCategory === "All" ? "active" : ""}`}
              onClick={() => onSelectCategory("All")}
            >
              <div className="count">{errors.length}</div>
              <div className="label">Total Failed</div>
            </button>
            <button
              type="button"
              className={`error-stat-card quantity ${selectedCategory === "Quantity" ? "active" : ""}`}
              onClick={() => onSelectCategory("Quantity")}
            >
              <div className="count">{categoryCounts.Quantity}</div>
              <div className="label">Invalid Quantity</div>
            </button>
            <button
              type="button"
              className={`error-stat-card expiry ${selectedCategory === "Expiry" ? "active" : ""}`}
              onClick={() => onSelectCategory("Expiry")}
            >
              <div className="count">{categoryCounts.Expiry}</div>
              <div className="label">Expired Medicine</div>
            </button>
            <button
              type="button"
              className={`error-stat-card pricing ${selectedCategory === "Pricing" ? "active" : ""}`}
              onClick={() => onSelectCategory("Pricing")}
            >
              <div className="count">{categoryCounts.Pricing}</div>
              <div className="label">Pricing Errors</div>
            </button>
            <button
              type="button"
              className={`error-stat-card duplicate ${selectedCategory === "Duplicate" ? "active" : ""}`}
              onClick={() => onSelectCategory("Duplicate")}
            >
              <div className="count">{categoryCounts.Duplicate}</div>
              <div className="label">Duplicate</div>
            </button>
            <button
              type="button"
              className={`error-stat-card other ${selectedCategory === "Other" ? "active" : ""}`}
              onClick={() => onSelectCategory("Other")}
            >
              <div className="count">
                {categoryCounts.Required + categoryCounts.Other}
              </div>
              <div className="label">Required & Format</div>
            </button>
          </div>

          {/* Category Filter Pills (PRD §12) */}
          <div className="error-filter-bar">
            {[
              "All",
              "Quantity",
              "Expiry",
              "Pricing",
              "Required",
              "Duplicate",
              "Other",
            ].map((cat) => (
              <button
                key={cat}
                type="button"
                className={`error-pill ${selectedCategory === cat ? "active" : ""}`}
                onClick={() => onSelectCategory(cat)}
              >
                <span>{cat}</span>
                <span className="badge">{categoryCounts[cat] || 0}</span>
              </button>
            ))}
          </div>

          {/* Failed Records Table (PRD §14, §15, §16) */}
          <div className="failed-records-table-container">
            <table className="failed-records-table">
              <TableHeader
                columns={[
                  "CSV Row",
                  "Medicine",
                  "Batch",
                  "Field",
                  "Value",
                  "Reason",
                  "Recommended Action",
                ]}
              />
              <tbody>
                {filteredErrors.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        textAlign: "center",
                        padding: "24px",
                        color: "var(--text-muted)",
                      }}
                    >
                      No errors in category &quot;{selectedCategory}&quot;.
                    </td>
                  </tr>
                ) : (
                  filteredErrors.map((err, errIdx) => {
                    const subErrors =
                      err.errors && err.errors.length > 0 ? err.errors : [err];
                    return subErrors.map((sub, subIdx) => {
                      const rowKey = `${err.row || err.rowNumber || errIdx}-${sub.field || subIdx}`;
                      const isRowOpen = expandedRows.has(rowKey);
                      return (
                        <React.Fragment key={rowKey}>
                          <tr
                            className="clickable-error-row"
                            onClick={() => toggleRow(rowKey)}
                            title="Click to view full row diagnostic details"
                          >
                            <td className="row-num">
                              Row {err.row || err.rowNumber || errIdx + 1}
                            </td>
                            <td className="medicine-name">
                              {err.name ||
                                err.medicine ||
                                err.medicineName ||
                                "Unknown"}
                            </td>
                            <td>
                              {err.batch || err.batchNumber ? (
                                <span className="batch-tag">
                                  {err.batch || err.batchNumber}
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td>
                              <span
                                className="match-badge danger"
                                style={{ fontSize: "11px" }}
                              >
                                {sub.field || err.field || "—"}
                              </span>
                            </td>
                            <td>
                              <span className="value-cell">
                                {sub.value !== undefined &&
                                sub.value !== null &&
                                sub.value !== ""
                                  ? `"${sub.value}"`
                                  : err.value !== undefined &&
                                      err.value !== null &&
                                      err.value !== ""
                                    ? `"${err.value}"`
                                    : "(empty)"}
                              </span>
                            </td>
                            <td>
                              <div className="reason-text">
                                {sub.message || sub.reason || err.message}
                              </div>
                            </td>
                            <td>
                              {sub.action || err.action ? (
                                <div className="action-hint">
                                  <span>Correction:</span>{" "}
                                  {sub.action || err.action}
                                </div>
                              ) : (
                                <div className="action-hint">
                                  Review spreadsheet entry
                                </div>
                              )}
                            </td>
                          </tr>
                          {isRowOpen && (
                            <tr className="expanded-error-detail-row">
                              <td colSpan={7}>
                                <div className="expanded-error-card">
                                  <div className="exp-card-header">
                                    <strong>
                                      CSV Row{" "}
                                      {err.row || err.rowNumber || errIdx + 1} —{" "}
                                      {err.name ||
                                        err.medicine ||
                                        err.medicineName ||
                                        "Unknown"}
                                    </strong>
                                    <span className="exp-code-badge">
                                      Code:{" "}
                                      {sub.errorCode ||
                                        sub.code ||
                                        err.errorCode ||
                                        "VALIDATION_ERROR"}
                                    </span>
                                  </div>
                                  <div className="exp-card-grid">
                                    <div>
                                      <span className="exp-label">Field:</span>{" "}
                                      <span className="exp-val">
                                        {sub.field || err.field || "—"}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="exp-label">
                                        Provided Value:
                                      </span>{" "}
                                      <span className="exp-val danger">
                                        {sub.value !== undefined &&
                                        sub.value !== null &&
                                        sub.value !== ""
                                          ? `"${sub.value}"`
                                          : err.value !== undefined &&
                                              err.value !== null &&
                                              err.value !== ""
                                            ? `"${err.value}"`
                                            : "(empty)"}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="exp-label">Reason:</span>{" "}
                                      <span className="exp-val danger">
                                        {sub.reason ||
                                          sub.message ||
                                          err.message}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="exp-label">
                                        Details / Action:
                                      </span>{" "}
                                      <span className="exp-val">
                                        {sub.action ||
                                          err.action ||
                                          "Correct this field in the CSV and re-import."}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    });
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export function BulkImportSection1({
  commitResult,
  navigate,
  setFile,
  setImportStatus,
  setCommitResult,
  headers,
  setShowAddSupplierModal,
  setSelectedSupplier,
  setDuplicateStrategy,
  duplicateStrategy,
  processExistingMedicines = false,
  setProcessExistingMedicines,
  setBarcodeOptions,
  barcodeOptions,
  mapping,
  setMapping,
  setShowSaveMappingModal,
  setShowLoadMappingModal,
  handleDuplicateAction,
  handleBulkAction,
  duplicateDecisions = {},
  reviewingRow = null,
  setReviewingRow,
  hasUnresolvedDuplicates = false,
  unresolvedCount = 0,
  importProgress,
  getInputProps,
  parsedRows,
  dataPreview,
  isAnalyzing,
  handleStartImport,
  importStatus,
  isDragActive,
  file,
  duplicateResults,
  resetMappingToAI,
  getRootProps,
  open,
  handleAnalyzeImport,
  suppliersList,
  selectedSupplier,
  cancelImport,
  inventoryState = null,
  existingMedicineCount = 0,
  requiresDuplicateStrategy = false,
}) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [previewCategory, setPreviewCategory] = useState("All");
  const [showFailureDetails, setShowFailureDetails] = useState(false);
  const failureSectionRef = useRef(null);

  const failureList = useMemo(() => {
    if (
      Array.isArray(commitResult?.failures) &&
      commitResult.failures.length > 0
    ) {
      return commitResult.failures;
    }
    if (Array.isArray(commitResult?.errors) && commitResult.errors.length > 0) {
      return commitResult.errors;
    }
    if (
      Array.isArray(commitResult?.failedRecords) &&
      commitResult.failedRecords.length > 0
    ) {
      return commitResult.failedRecords;
    }
    if (
      Array.isArray(commitResult?.validationErrors) &&
      commitResult.validationErrors.length > 0
    ) {
      return commitResult.validationErrors;
    }
    const failedCount = commitResult?.failed ?? 0;
    if (failedCount > 0) {
      return Array.from({ length: failedCount }, (_, i) => ({
        row: i + 1,
        rowNumber: i + 1,
        name: `Failed Record ${i + 1}`,
        medicineName: `Failed Record ${i + 1}`,
        field: "Validation",
        value: "(invalid)",
        code: "VALIDATION_FAILED",
        reason: "Record failed validation rules during import",
        message:
          "Please check required fields, positive quantity, valid expiry date, and pricing in your CSV.",
        action:
          "Correct this row according to the template requirements and re-import.",
        category: "Other",
      }));
    }
    return [];
  }, [commitResult]);

  const handleToggleFailures = (e) => {
    if (e && typeof e.stopPropagation === "function") {
      e.stopPropagation();
    }
    if ((commitResult?.failed ?? 0) > 0) {
      setShowFailureDetails((prev) => {
        const next = !prev;
        if (next) {
          requestAnimationFrame(() => {
            setTimeout(() => {
              const el =
                failureSectionRef.current ||
                document.getElementById("failed-records-section");
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "start" });
              }
            }, 60);
          });
        }
        return next;
      });
    }
  };

  return importStatus === "complete" ? (
    <m.div
      initial={{
        opacity: 0,
        y: 20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="import-results-card"
    >
      <div className="results-header">
        <CheckCircle2
          size={48}
          style={{
            color:
              commitResult?.failed > 0 && commitResult?.imported === 0
                ? "var(--danger)"
                : "var(--primary)",
          }}
        />
        <div>
          <h2>
            {commitResult?.failed > 0 && commitResult?.imported === 0
              ? "Import Completed with Errors"
              : "Import Complete!"}
          </h2>
          <p>
            {commitResult?.imported ?? 0} records imported ·{" "}
            {commitResult?.skipped ?? 0} skipped · {commitResult?.failed ?? 0}{" "}
            failed
            {commitResult?.total !== undefined &&
              ` (Total: ${commitResult.total})`}
          </p>
        </div>
      </div>

      <div
        className="det-summary-grid"
        style={{
          marginBottom: "20px",
        }}
      >
        <div className="det-stat">
          <div className="num">{commitResult?.total ?? 0}</div>
          <span>Total Rows</span>
        </div>
        <div className="det-stat success">
          <div className="num">{commitResult?.imported ?? 0}</div>
          <span>
            Imported ({commitResult?.created ?? 0} new,{" "}
            {commitResult?.updated ?? 0} updated)
          </span>
        </div>
        <div className="det-stat warning">
          <div className="num">{commitResult?.skipped ?? 0}</div>
          <span>Skipped</span>
        </div>
        <div
          className={`det-stat danger ${(commitResult?.failed ?? 0) > 0 ? "clickable" : ""}`}
          style={{
            cursor: (commitResult?.failed ?? 0) > 0 ? "pointer" : "default",
          }}
          onClick={handleToggleFailures}
          title={
            (commitResult?.failed ?? 0) > 0
              ? showFailureDetails
                ? "Click to hide failure details"
                : "Click to inspect failure details below"
              : ""
          }
        >
          <div className="num">{commitResult?.failed ?? 0}</div>
          <span>Failed</span>
          {(commitResult?.failed ?? 0) > 0 && (
            <button
              type="button"
              className={`det-stat-sub-badge clickable-badge ${showFailureDetails ? "active" : ""}`}
              onClick={handleToggleFailures}
            >
              {showFailureDetails ? "Hide failures ↑" : "Inspect failures ↓"}
            </button>
          )}
        </div>
      </div>

      {((commitResult?.overwritten ?? 0) > 0 ||
        (commitResult?.merged ?? 0) > 0) && (
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "16px",
            fontSize: "13px",
            color: "var(--text-muted)",
          }}
        >
          <span>Resolution Details:</span>
          {(commitResult?.overwritten ?? 0) > 0 && (
            <span className="match-badge warning">
              {commitResult.overwritten} Overwritten
            </span>
          )}
          {(commitResult?.merged ?? 0) > 0 && (
            <span className="match-badge blue">
              {commitResult.merged} Merged
            </span>
          )}
        </div>
      )}

      {showFailureDetails && (commitResult?.failed ?? 0) > 0 && (
        <div ref={failureSectionRef}>
          <FailedRecordsView
            title={`Failed Records (${commitResult?.failed || failureList.length})`}
            errors={failureList}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            isExpanded={true}
            onToggleExpand={handleToggleFailures}
            onDownloadCsv={() =>
              downloadFailedRecordsCsv(failureList, "failed_inventory_import")
            }
          />
        </div>
      )}

      <div className="results-actions">
        <button
          className="pos-btn teal"
          onClick={() => {
            window.dispatchEvent(new CustomEvent("inventory:refresh"));
            navigate("/stock");
          }}
        >
          View Stock
        </button>
        <button
          className="pos-btn outline"
          onClick={() => {
            setFile(null);
            setImportStatus("idle");
            setCommitResult(null);
          }}
        >
          Import Another
        </button>
        {(commitResult?.failed ?? 0) > 0 && (
          <button
            type="button"
            className="pos-btn outline danger"
            onClick={() =>
              downloadFailedRecordsCsv(failureList, "failed_inventory_import")
            }
          >
            <Download size={16} /> Download Failed Rows
          </button>
        )}
      </div>
    </m.div>
  ) : importStatus === "processing" ? (
    <div className="import-progress-card">
      <h3>Processing Import...</h3>
      <div className="progress-bar-wrap">
        <div
          className="progress-bar-fill"
          style={{
            width: `${importProgress}%`,
          }}
        >
          {importProgress}%
        </div>
      </div>

      <p className="current-item-text">
        Processing {parsedRows.length} records ({importProgress}% complete)...
      </p>

      <button
        className="pos-btn outline danger"
        style={{
          marginTop: 20,
        }}
        onClick={cancelImport}
      >
        Cancel Import
      </button>
    </div>
  ) : (
    <>
      <div className="import-layout-grid">
        <div className="layout-col-left">
          <div className="dropzone-card-v2">
            <div
              {...getRootProps()}
              className={`dropzone-inner-v2 ${isDragActive ? "active" : ""}`}
            >
              <input aria-label="input field" required {...getInputProps()} />
              {file ? (
                <div className="file-selected-state">
                  <div className="file-info-row">
                    <div className="file-icon-box csv">
                      <FileSpreadsheet size={24} />
                    </div>
                    <div className="file-meta">
                      <div className="name">{file.name}</div>
                      <div className="size">
                        {(file.size / 1024).toFixed(1)} KB · CSV File
                      </div>
                    </div>
                    <button
                      aria-label="Close"
                      type="button"
                      className="remove-file-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="parse-status">
                    <CheckCircle2 size={14} />
                    <span>
                      Parsed {parsedRows.length} rows · {headers.length} columns
                      detected
                    </span>
                  </div>

                  <div className="data-preview-wrap">
                    <div className="preview-label">
                      DATA PREVIEW (FIRST 5 ROWS)
                    </div>
                    <div className="preview-table-container">
                      <table className="preview-table">
                        <thead>
                          <tr>
                            {headers.slice(0, 5).map((h) => (
                              <th key={h}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {dataPreview.map((row, rIdx) => (
                            <tr
                              key={
                                row.id || row.name
                                  ? `${row.id || row.name}-${rIdx}`
                                  : `preview-row-${rIdx}`
                              }
                            >
                              {headers.slice(0, 5).map((h) => (
                                <td key={h}>{row[h] || "---"}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="preview-footer">
                      Showing first {Math.min(5, parsedRows.length)} of{" "}
                      {parsedRows.length} rows
                    </div>
                  </div>
                </div>
              ) : (
                <div className="empty-upload-state">
                  <div className="upload-icon-wrap">
                    <UploadCloud size={48} />
                  </div>
                  <h3>Drag and drop file</h3>
                  <p>Support for CSV, XLSX and JSON · Maximum 25MB</p>
                  <button
                    type="button"
                    className="select-btn-large"
                    onClick={open}
                  >
                    Select Local File
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="config-card-v2">
            <h3>Import Configuration</h3>
            <div className="config-row">
              <label htmlFor="field_84m1br" className="p-label">
                TAG THIS IMPORT TO SUPPLIER
              </label>
              <div className="supplier-select-wrap">
                <select
                  id="field_84m1br"
                  className="pos-input"
                  value={selectedSupplier}
                  onChange={(e) => {
                    if (e.target.value === "ADD_NEW") {
                      setShowAddSupplierModal(true);
                    } else {
                      setSelectedSupplier(e.target.value);
                    }
                  }}
                >
                  <option value="None">None — No supplier</option>
                  {suppliersList.map((sup) => (
                    <option key={sup.id} value={sup.name}>
                      {sup.name}
                    </option>
                  ))}
                  <option disabled>──────────</option>
                  <option value="ADD_NEW">+ Add New Supplier</option>
                </select>
                {selectedSupplier !== "None" && (
                  <div className="supplier-alert">
                    <Truck size={14} />
                    <span>
                      All {parsedRows.length} medicines will be tagged to:{" "}
                      {selectedSupplier}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedSupplier("None")}
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>
            </div>

            {inventoryState === "EMPTY" ? (
              <div className="config-row">
                <div
                  style={{
                    background: "rgba(16, 185, 129, 0.08)",
                    border: "1px solid rgba(16, 185, 129, 0.25)",
                    borderRadius: "16px",
                    padding: "16px 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "10px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: "700",
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                        color: "var(--success, #10b981)",
                      }}
                    >
                      ✦ First Inventory Import
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "700",
                        background: "rgba(16, 185, 129, 0.2)",
                        color: "var(--success, #10b981)",
                        padding: "3px 8px",
                        borderRadius: "6px",
                      }}
                    >
                      DIRECT IMPORT
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "var(--text-muted, #94a3b8)",
                      margin: 0,
                      lineHeight: "1.5",
                    }}
                  >
                    No medicines currently exist in your inventory. All valid
                    medicines from this file will be added directly to your
                    inventory. Duplicate handling is disabled for this first
                    import.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {(requiresDuplicateStrategy ||
                  inventoryState === "EXISTING") && (
                  <div
                    style={{
                      background: "rgba(59, 130, 246, 0.08)",
                      border: "1px solid rgba(59, 130, 246, 0.2)",
                      borderRadius: "12px",
                      padding: "10px 14px",
                      marginBottom: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: "12px",
                      color: "var(--info, #3b82f6)",
                    }}
                  >
                    <span>
                      ℹ Existing inventory detected ({existingMedicineCount}{" "}
                      medicines in inventory)
                    </span>
                    <span style={{ fontWeight: "700", fontSize: "11px" }}>
                      DUPLICATE SCAN ACTIVE
                    </span>
                  </div>
                )}
                <div className="config-row">
                  <span className="p-label">EXISTING MEDICINES</span>
                  <div className="checkbox-list">
                    <label className="check-item">
                      <input
                        type="checkbox"
                        checked={processExistingMedicines}
                        disabled={importStatus === "processing"}
                        onChange={(e) =>
                          setProcessExistingMedicines?.(e.target.checked)
                        }
                      />
                      <span>Process Existing Medicines</span>
                    </label>
                    <span className="config-help-text">
                      Leave unchecked for the first import. Enable this when
                      importing stock/data for medicines already in the system.
                    </span>
                    {processExistingMedicines && (
                      <div
                        className="barcode-hint info"
                        style={{ marginTop: "4px" }}
                      >
                        ℹ Existing medicines will be processed using duplicate
                        strategy: <strong>{duplicateStrategy}</strong>
                      </div>
                    )}
                  </div>
                </div>

                <div className="config-row">
                  <span className="p-label">IF DUPLICATE FOUND</span>
                  <div className="radio-group-vertical">
                    {[
                      {
                        id: "Skip",
                        desc: "Keep existing record, don't overwrite",
                      },
                      {
                        id: "Overwrite",
                        desc: "Replace existing with imported data",
                      },
                      {
                        id: "Merge",
                        desc: "Keep existing fields, fill only blanks",
                      },
                      {
                        id: "Ask me",
                        desc: "Pause and show conflict for each duplicate",
                      },
                    ].map((opt) => (
                      <button
                        type="button"
                        key={opt.id}
                        className="radio-item"
                        onClick={() => setDuplicateStrategy(opt.id)}
                      >
                        <div
                          className={`radio-dot ${duplicateStrategy === opt.id ? "active" : ""}`}
                        />
                        <div className="radio-label-wrap">
                          <span className="label">{opt.id}</span>
                          <span className="desc">{opt.desc}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="config-row">
              <span className="p-label">BARCODE SETTINGS</span>
              <div className="checkbox-list">
                <label className="check-item">
                  <input
                    required
                    type="checkbox"
                    checked={barcodeOptions.autoGen}
                    onChange={(e) =>
                      setBarcodeOptions({
                        ...barcodeOptions,
                        autoGen: e.target.checked,
                      })
                    }
                  />
                  <span>Generate barcode if column is missing</span>
                </label>
                <label className="check-item">
                  <input
                    required
                    type="checkbox"
                    checked={barcodeOptions.overwrite}
                    onChange={(e) =>
                      setBarcodeOptions({
                        ...barcodeOptions,
                        overwrite: e.target.checked,
                      })
                    }
                  />
                  <span>Overwrite existing barcodes with imported values</span>
                </label>
                <label className="check-item">
                  <input
                    required
                    type="checkbox"
                    checked={barcodeOptions.validate}
                    onChange={(e) =>
                      setBarcodeOptions({
                        ...barcodeOptions,
                        validate: e.target.checked,
                      })
                    }
                  />
                  <span>Validate barcode format (EAN-13 / QR)</span>
                </label>
              </div>
              {headers.includes("barcode") ? (
                <div className="barcode-hint success">
                  ✓ Column 'barcode' detected in your file
                </div>
              ) : (
                <div className="barcode-hint warning">
                  No barcode column found — will auto-generate
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="layout-col-right">
          <div className="mapping-card-v2">
            <h3>Field Mapping</h3>
            {fields.map((f) => (
              <div key={f.key} className="map-row-v2">
                <label htmlFor="field_r6n3xw">{f.label}</label>
                <select
                  id="field_r6n3xw"
                  className="pos-input"
                  value={mapping[f.key]}
                  onChange={(e) =>
                    setMapping({
                      ...mapping,
                      [f.key]: e.target.value,
                    })
                  }
                >
                  <option value="">— Skip —</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            <div className="mapping-actions-footer">
              <button
                type="button"
                className="text-link"
                onClick={resetMappingToAI}
              >
                <RefreshCw size={12} /> Reset to AI suggestions
              </button>
              <button
                className="text-link"
                onClick={() => setShowSaveMappingModal(true)}
              >
                Save as Template
              </button>
              <button
                className="text-link"
                onClick={() => setShowLoadMappingModal(true)}
              >
                Load Template
              </button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {file && (
          <m.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="duplicate-panel-card"
          >
            <div className="panel-header">
              <div className="title">
                <GitMerge
                  size={18}
                  style={{
                    color: "var(--warning)",
                  }}
                />
                <span>Duplicate Detection Results</span>
              </div>
              <button
                className={`pos-btn outline micro ${isAnalyzing ? "loading" : ""}`}
                onClick={handleAnalyzeImport}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? "Analyzing..." : "Re-scan / Analyze"}
              </button>
            </div>

            <div className="det-summary-grid">
              <div className="det-stat success">
                <div className="num">{duplicateResults.new}</div>
                <span>New Records</span>
              </div>
              <div className="det-stat warning">
                <div className="num">{duplicateResults.duplicates}</div>
                <span>Duplicates Found</span>
              </div>
              <div className="det-stat danger">
                <div className="num">{duplicateResults.conflicts}</div>
                <span>Conflicts</span>
              </div>
            </div>

            <div className="duplicate-table-section">
              <h4>
                {duplicateResults.duplicates} Potential Duplicates Detected
              </h4>
              <div className="table-overflow">
                <table className="duplicate-list-table">
                  <TableHeader
                    columns={[
                      "ROW #",
                      "IMPORTED NAME",
                      "MATCHES IN SYSTEM",
                      "MATCH TYPE",
                      "DIFFERENCE",
                      "ACTION",
                    ]}
                  />
                  <tbody>
                    {duplicateResults.rows.map((r, rIdx) => {
                      const currentAction =
                        duplicateDecisions[r.row]?.action ||
                        (duplicateStrategy !== "Ask me"
                          ? duplicateStrategy.toUpperCase()
                          : "");
                      return (
                        <tr
                          key={r.id || `${r.row}-${r.name || rIdx}`}
                          className={r.conflict ? "conflict-row" : ""}
                        >
                          <td>Row {r.row}</td>
                          <td className="bold">{r.name}</td>
                          <td>{r.match}</td>
                          <td>
                            <span className={`match-badge ${r.severity}`}>
                              {r.type}
                            </span>
                          </td>
                          <td className="diff">
                            {typeof r.diff === "string"
                              ? r.diff
                              : JSON.stringify(r.diff)}
                          </td>
                          <td>
                            <div className="action-btns">
                              <button
                                type="button"
                                className={`btn skip ${currentAction === "SKIP" ? "active" : ""}`}
                                onClick={() => handleDuplicateAction(r, "Skip")}
                              >
                                Skip
                              </button>
                              <button
                                type="button"
                                className={`btn overwrite ${currentAction === "OVERWRITE" ? "active" : ""}`}
                                onClick={() =>
                                  handleDuplicateAction(r, "Overwrite")
                                }
                              >
                                Overwrite
                              </button>
                              <button
                                type="button"
                                className={`btn merge ${currentAction === "MERGE" ? "active" : ""}`}
                                onClick={() =>
                                  handleDuplicateAction(r, "Merge")
                                }
                              >
                                Merge
                              </button>
                              {r.conflict && (
                                <button
                                  type="button"
                                  className="btn review"
                                  onClick={() =>
                                    handleDuplicateAction(r, "Review")
                                  }
                                >
                                  Review ⚠
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="bulk-actions-row">
                <button
                  type="button"
                  className="pos-btn outline micro"
                  onClick={() => handleBulkAction("Skip")}
                >
                  Skip All Duplicates
                </button>
                <button
                  type="button"
                  className="pos-btn outline micro warning"
                  onClick={() => handleBulkAction("Overwrite")}
                >
                  Overwrite All
                </button>
                <button
                  type="button"
                  className="pos-btn outline micro blue"
                  onClick={() => handleBulkAction("Merge")}
                >
                  Merge All
                </button>
              </div>
            </div>
            {duplicateResults.errors && duplicateResults.errors.length > 0 && (
              <FailedRecordsView
                title="Validation Errors (These rows will be skipped)"
                errors={duplicateResults.errors}
                selectedCategory={previewCategory}
                onSelectCategory={setPreviewCategory}
                onDownloadCsv={() =>
                  downloadFailedRecordsCsv(
                    duplicateResults.errors,
                    "preview_validation_errors",
                  )
                }
              />
            )}
          </m.div>
        )}
      </AnimatePresence>

      {reviewingRow && (
        <div
          className="conflict-review-modal-overlay"
          onClick={() => setReviewingRow(null)}
        >
          <div
            className="conflict-review-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="conflict-review-modal-header">
              <h3>
                Resolve Conflict: Row {reviewingRow.row} — {reviewingRow.name}
              </h3>
              <button
                type="button"
                aria-label="Close"
                className="remove-file-btn"
                onClick={() => setReviewingRow(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="conflict-review-modal-body">
              <div className="conflict-banner">
                <AlertCircle size={16} />
                <span>
                  {reviewingRow.diff ||
                    "Conflict detected between incoming file and existing database record."}
                </span>
              </div>
              <table className="conflict-review-table">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Existing in Database</th>
                    <th>Imported from File</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    className={
                      reviewingRow.diffDetails?.quantity ? "diff-row" : ""
                    }
                  >
                    <td>Quantity</td>
                    <td>
                      {reviewingRow.diffDetails?.quantity?.existing ??
                        reviewingRow.existing?.quantity ??
                        "—"}
                    </td>
                    <td
                      className={
                        reviewingRow.diffDetails?.quantity
                          ? "highlight-diff"
                          : ""
                      }
                    >
                      {reviewingRow.diffDetails?.quantity?.imported ??
                        reviewingRow.imported?.quantity ??
                        "—"}
                    </td>
                    <td>
                      {reviewingRow.diffDetails?.quantity
                        ? "Variance"
                        : "Match"}
                    </td>
                  </tr>
                  <tr
                    className={
                      reviewingRow.diffDetails?.purchasePrice ? "diff-row" : ""
                    }
                  >
                    <td>Purchase Price</td>
                    <td>
                      ₹
                      {reviewingRow.diffDetails?.purchasePrice?.existing ??
                        reviewingRow.existing?.purchasePrice ??
                        "—"}
                    </td>
                    <td
                      className={
                        reviewingRow.diffDetails?.purchasePrice
                          ? "highlight-diff"
                          : ""
                      }
                    >
                      ₹
                      {reviewingRow.diffDetails?.purchasePrice?.imported ??
                        reviewingRow.imported?.purchasePrice ??
                        "—"}
                    </td>
                    <td>
                      {reviewingRow.diffDetails?.purchasePrice
                        ? "Variance"
                        : "Match"}
                    </td>
                  </tr>
                  <tr
                    className={
                      reviewingRow.diffDetails?.expiry ? "diff-row" : ""
                    }
                  >
                    <td>Expiry Date</td>
                    <td>
                      {reviewingRow.diffDetails?.expiry?.existing ??
                        reviewingRow.existing?.expiry ??
                        "—"}
                    </td>
                    <td
                      className={
                        reviewingRow.diffDetails?.expiry ? "highlight-diff" : ""
                      }
                    >
                      {reviewingRow.diffDetails?.expiry?.imported ??
                        reviewingRow.imported?.expiry ??
                        "—"}
                    </td>
                    <td>
                      {reviewingRow.diffDetails?.expiry ? "Variance" : "Match"}
                    </td>
                  </tr>
                  <tr>
                    <td>Batch Number</td>
                    <td>{reviewingRow.existing?.batch ?? "—"}</td>
                    <td>{reviewingRow.imported?.batch ?? "—"}</td>
                    <td>Match</td>
                  </tr>
                  {reviewingRow.existing?.barcode && (
                    <tr>
                      <td>Barcode</td>
                      <td>{reviewingRow.existing.barcode}</td>
                      <td>{reviewingRow.imported?.barcode || "—"}</td>
                      <td>
                        {reviewingRow.existing.barcode ===
                        reviewingRow.imported?.barcode
                          ? "Match"
                          : "Variance"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="conflict-review-modal-footer">
              <div
                style={{
                  fontSize: "13px",
                  color: "var(--text-muted)",
                }}
              >
                Choose resolution for this item:
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                }}
              >
                <button
                  type="button"
                  className={`pos-btn outline micro ${duplicateDecisions[reviewingRow.row]?.action === "SKIP" ? "teal" : ""}`}
                  onClick={() => {
                    handleDuplicateAction(reviewingRow, "Skip");
                    setReviewingRow(null);
                  }}
                >
                  Skip
                </button>
                <button
                  type="button"
                  className={`pos-btn outline micro warning ${duplicateDecisions[reviewingRow.row]?.action === "OVERWRITE" ? "teal" : ""}`}
                  onClick={() => {
                    handleDuplicateAction(reviewingRow, "Overwrite");
                    setReviewingRow(null);
                  }}
                >
                  Overwrite
                </button>
                <button
                  type="button"
                  className={`pos-btn outline micro blue ${duplicateDecisions[reviewingRow.row]?.action === "MERGE" ? "teal" : ""}`}
                  onClick={() => {
                    handleDuplicateAction(reviewingRow, "Merge");
                    setReviewingRow(null);
                  }}
                >
                  Merge
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {file && (
        <div className="sticky-import-footer">
          <div className="validation-bar">
            <div className="val-item green">
              <div className="dot" />{" "}
              <span>
                {duplicateResults.readyCount ??
                  parsedRows.length -
                    (duplicateResults.errors || []).length}{" "}
                rows ready to import
              </span>
            </div>
            <div className="val-item green">
              <div className="dot" /> <span>Required fields mapped</span>
            </div>
            <div className="val-item teal">
              <div className="dot" />{" "}
              <span>
                {duplicateResults.validBarcodes || 0} valid barcodes ·{" "}
                {duplicateResults.autoGenBarcodes || 0} auto-gen
              </span>
            </div>
            <div className="val-item teal">
              <div className="dot" /> <span>Supplier: {selectedSupplier}</span>
            </div>
            {inventoryState === "EMPTY" ? (
              <div className="val-item green">
                <div className="dot" />{" "}
                <span>Mode: Direct Import (First-Time) · 0 duplicates</span>
              </div>
            ) : (
              <div
                className={`val-item ${hasUnresolvedDuplicates ? "orange" : "teal"}`}
              >
                <div className="dot" />{" "}
                <span>
                  {duplicateResults.duplicates || 0} duplicates — handling:{" "}
                  {duplicateStrategy}
                  {hasUnresolvedDuplicates &&
                    ` (${unresolvedCount} unresolved)`}
                </span>
              </div>
            )}
            <div
              className={`val-item ${(duplicateResults.errors || []).length > 0 ? "red" : "green"}`}
            >
              <div className="dot" />{" "}
              <span>
                {(duplicateResults.errors || []).length > 0
                  ? `${(duplicateResults.errors || []).length} rows with invalid data`
                  : "0 invalid rows"}
              </span>
            </div>
          </div>

          <div className="import-action-bar">
            <div className="estimate-text">
              Will import:{" "}
              <span className="green">
                {duplicateResults.new ??
                  Math.max(
                    0,
                    parsedRows.length - (duplicateResults.errors || []).length,
                  )}{" "}
                new
              </span>{" "}
              ·{" "}
              <span className="gray">
                {duplicateResults.duplicates || 0} duplicates
              </span>{" "}
              ·{" "}
              <span className="red">
                {(duplicateResults.errors || []).length} errors
              </span>{" "}
              ={" "}
              {duplicateResults.new ??
                Math.max(
                  0,
                  parsedRows.length - (duplicateResults.errors || []).length,
                )}{" "}
              records
            </div>
            <div className="action-btns">
              <button className="pos-btn outline" onClick={() => setFile(null)}>
                Cancel
              </button>
              <button
                className={`pos-btn teal large ${hasUnresolvedDuplicates ? "disabled" : ""}`}
                onClick={handleStartImport}
                disabled={hasUnresolvedDuplicates}
                title={
                  hasUnresolvedDuplicates
                    ? `Resolve ${unresolvedCount} duplicate decisions first`
                    : "Send mapped medicines for import"
                }
              >
                <UploadCloud size={18} />
                <span>
                  {inventoryState === "EMPTY"
                    ? `Import to Inventory — ${duplicateResults.new !== undefined ? duplicateResults.new : parsedRows.length} Valid Records`
                    : `Start Import — ${duplicateResults.new !== undefined ? duplicateResults.new : parsedRows.length} Valid Records`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
