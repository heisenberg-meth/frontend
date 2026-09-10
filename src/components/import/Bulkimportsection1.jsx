import {
  UploadCloud,
  RefreshCw,
  Truck,
  GitMerge,
  CheckCircle2,
  AlertCircle,
  X,
  FileSpreadsheet,
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
}) {
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
        <div className="det-stat danger">
          <div className="num">{commitResult?.failed ?? 0}</div>
          <span>Failed</span>
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

      {commitResult?.errors?.length > 0 && (
        <div className="error-details-section">
          <h3>{commitResult.errors.length} Records Failed</h3>
          <div className="error-summary-badges">
            {[...new Set(commitResult.errors.map((e) => e.field))].map(
              (field) => {
                const count = commitResult.errors.filter(
                  (e) => e.field === field,
                ).length;
                return (
                  <span
                    key={field}
                    className="match-badge danger"
                    style={{
                      margin: "0 4px",
                    }}
                  >
                    {field}: {count}
                  </span>
                );
              },
            )}
          </div>
          <div
            className="table-overflow"
            style={{
              maxHeight: "400px",
              marginTop: "12px",
            }}
          >
            <table className="results-table">
              <TableHeader
                columns={[
                  "Row #",
                  "Medicine Name",
                  "Field",
                  "Received",
                  "Error",
                ]}
              />
              <tbody>
                {commitResult.errors.map((err, errIdx) => (
                  <tr
                    key={
                      err.id || `${err.row}-${err.field || err.name || errIdx}`
                    }
                  >
                    <td>Row {err.row}</td>
                    <td>{err.name || "Unknown"}</td>
                    <td>
                      <span
                        className="match-badge danger"
                        style={{
                          fontSize: "11px",
                        }}
                      >
                        {err.field || "—"}
                      </span>
                    </td>
                    <td
                      style={{
                        fontFamily: "monospace",
                        fontSize: "12px",
                      }}
                    >
                      {err.value !== undefined &&
                      err.value !== null &&
                      err.value !== ""
                        ? `"${err.value}"`
                        : "(empty)"}
                    </td>
                    <td
                      style={{
                        color: "var(--danger)",
                      }}
                    >
                      {err.message || err.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
              <div
                className="validation-errors-section"
                style={{
                  marginTop: "24px",
                  padding: "16px",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  borderRadius: "8px",
                  background: "rgba(239, 68, 68, 0.02)",
                }}
              >
                <h4
                  style={{
                    color: "var(--danger)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "12px",
                  }}
                >
                  <X size={16} /> {duplicateResults.errors.length} Validation
                  Errors (These rows will be skipped)
                </h4>
                <div
                  className="table-overflow"
                  style={{
                    maxHeight: "200px",
                  }}
                >
                  <table className="duplicate-list-table">
                    <TableHeader
                      columns={[
                        "ROW #",
                        "MEDICINE NAME",
                        "INVALID FIELD",
                        "ERROR DETAILS",
                      ]}
                    />
                    <tbody>
                      {duplicateResults.errors.map((err, errIdx) => (
                        <tr
                          key={
                            err.id ||
                            `${err.row}-${err.field || err.name || errIdx}`
                          }
                        >
                          <td>Row {err.row}</td>
                          <td className="bold">{err.name || "Unknown"}</td>
                          <td>
                            <span className="match-badge danger">
                              {err.field}
                            </span>
                          </td>
                          <td
                            className="diff"
                            style={{
                              color: "var(--danger)",
                            }}
                          >
                            {err.message}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
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
            <div
              className={`val-item ${hasUnresolvedDuplicates ? "orange" : "teal"}`}
            >
              <div className="dot" />{" "}
              <span>
                {duplicateResults.duplicates || 0} duplicates — handling:{" "}
                {duplicateStrategy}
                {hasUnresolvedDuplicates && ` (${unresolvedCount} unresolved)`}
              </span>
            </div>
            <div className="val-item red">
              <div className="dot" />{" "}
              <span>
                {(duplicateResults.errors || []).length} rows with invalid data
                will be skipped
              </span>
            </div>
          </div>

          <div className="import-action-bar">
            <div className="estimate-text">
              Will import:{" "}
              <span className="green">{duplicateResults.new || 0} new</span> ·{" "}
              <span className="gray">
                {duplicateResults.duplicates || 0} duplicates
              </span>{" "}
              ·{" "}
              <span className="red">
                {(duplicateResults.errors || []).length} errors
              </span>{" "}
              = {duplicateResults.new || 0} records
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
                <span>Start Import — {parsedRows.length} Records</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
