import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useNavigate } from "react-router-dom";
import {
  UploadCloud,
  Download,
  RefreshCw,
  History,
  Truck,
  GitMerge,
  CheckCircle2,
  X,
  FileSpreadsheet,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ExcelJS from "exceljs";
import Papa from "papaparse";
import api from "../api";
import { getSuppliers } from "../services/suppliers.service";
import "../styles/BulkImport.css";

export default function BulkImport({ fetchData, showToast }) {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({
    nameColumn: "med_name",
    qtyColumn: "stock_qty",
    expiryColumn: "expiry_dt",
    priceColumn: "price_inr",
    batchColumn: "batch_no",
    barcodeColumn: "barcode",
  });
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState("idle");
  const [importType, setImportType] = useState("New Medicines");
  const [selectedSupplier, setSelectedSupplier] = useState("None");
  const [duplicateStrategy, setDuplicateStrategy] = useState("Skip");
  const [barcodeOptions, setBarcodeOptions] = useState({
    autoGen: true,
    overwrite: false,
    validate: true,
  });

  const [dataPreview, setDataPreview] = useState([]);
  const [duplicateResults, setDuplicateResults] = useState({
    new: 0,
    duplicates: 0,
    conflicts: 0,
    rows: [],
    errors: [],
  });
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [importHistory, setImportHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [suppliersList, setSuppliersList] = useState([]);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [showSaveMappingModal, setShowSaveMappingModal] = useState(false);
  const [showLoadMappingModal, setShowLoadMappingModal] = useState(false);
  const [importJobId, setImportJobId] = useState(null);
  const [importSummary, setImportSummary] = useState(null);
  const [savedTemplates, setSavedTemplates] = useState(() => {
    try {
      const stored = localStorage.getItem("bulkImportTemplates");
      return stored ? JSON.parse(stored) : [];
    } catch (err) {
      console.error(err);
      return [];
    }
  });
  const [templateName, setTemplateName] = useState("");
  const [templateDesc, setTemplateDesc] = useState("");
  const [templateDefault, setTemplateDefault] = useState(false);
  const [supplierForm, setSupplierForm] = useState({
    name: "",
    contact: "",
    phone: "",
    email: "",
    gst: "",
    leadTime: "",
    paymentTerms: "Net 30",
  });
  const [parsedRows, setParsedRows] = useState([]);
  const [commitResult, setCommitResult] = useState(null);

  const autoMapHeaders = useCallback(
    (fileHeaders) => {
      const newMapping = {};
      const usedHeaders = new Set();
      const fieldKeywords = {
        nameColumn: ["name", "med", "medicine", "drug", "item"],
        qtyColumn: ["qty", "quantity", "stock", "units", "count"],
        expiryColumn: ["expiry", "exp", "date", "valid"],
        priceColumn: ["price", "rate", "cost", "inr"],
        batchColumn: ["batch", "lot", "no", "code"],
        barcodeColumn: ["barcode", "upc", "ean", "sku"],
      };

      if (fileHeaders.length <= 1) {
        showToast(
          "Import file has no column delimiters. Use a comma-separated CSV.",
          "error",
        );
        return;
      }

      const fieldOrder = [
        "nameColumn",
        "qtyColumn",
        "expiryColumn",
        "priceColumn",
        "batchColumn",
        "barcodeColumn",
      ];

      fieldOrder.forEach((field) => {
        const match = fileHeaders.find((header) => {
          if (usedHeaders.has(header)) return false;
          const lower = header.toLowerCase();
          return fieldKeywords[field].some((keyword) =>
            lower.includes(keyword),
          );
        });
        if (match) {
          newMapping[field] = match;
          usedHeaders.add(match);
        }
      });

      setMapping(newMapping);
    },
    [showToast],
  );

  const getMappedMedicines = useCallback(() => {
    const result = parsedRows.map((row) => ({
      name: String(row[mapping.nameColumn] || "").trim(),
      qty: String(row[mapping.qtyColumn] || "0").trim(),
      expiry: String(row[mapping.expiryColumn] || "").trim(),
      price: String(row[mapping.priceColumn] || "0").trim(),
      batch: String(row[mapping.batchColumn] || "").trim(),
      barcode: String(row[mapping.barcodeColumn] || "").trim(),
    }));

    if (result.length > 0) {
      const vals = Object.values(result[0]);
      const uniqueVals = new Set(vals.filter((v) => v !== ""));
      if (uniqueVals.size === 1 && result[0].name !== "") {
        console.error(
          "[BulkImport] CRITICAL: All fields have identical value. Mapping is broken.",
          {
            mapping,
            sampleRow: parsedRows[0],
          },
        );
      }
    }

    return result;
  }, [parsedRows, mapping]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await getSuppliers();
        if (active && res.data?.success) {
          setSuppliersList(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load suppliers", err);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (showHistoryDrawer) {
      const fetchHist = async () => {
        setHistoryLoading(true);
        try {
          const res = await api.get("/import/history");
          if (active && res.data?.success) {
            setImportHistory(res.data.data);
          }
        } catch (err) {
          console.error(err);
          showToast(err.message || "Failed to fetch import history", "error");
        } finally {
          if (active) setHistoryLoading(false);
        }
      };
      fetchHist();
    }
    return () => {
      active = false;
    };
  }, [showHistoryDrawer, showToast]);

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyzeImport = useCallback(async () => {
    if (!file) {
      showToast("Upload a file first", "error");
      return;
    }
    if (!mapping.nameColumn || !mapping.qtyColumn) {
      showToast("Required field mappings missing (Name + Quantity)", "error");
      return;
    }

    setIsAnalyzing(true);
    const medicines = getMappedMedicines();
    try {
      const res = await api.post("/import/bulk", {
        medicines,
        supplier: selectedSupplier,
        duplicateStrategy,
        barcodeOptions,
        dryRun: true,
      });
      if (res.data?.success) {
        setDuplicateResults(res.data.summary);
        showToast("✓ Import analysis / duplicate scan completed", "success");
      } else {
        throw new Error(res.data?.message || "Failed to analyze import data");
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to analyze import data", "error");
    } finally {
      setIsAnalyzing(false);
    }
  }, [
    file,
    getMappedMedicines,
    selectedSupplier,
    duplicateStrategy,
    barcodeOptions,
    mapping,
    showToast,
  ]);

  useEffect(() => {
    let active = true;
    if (file && parsedRows.length > 0 && mapping.nameColumn) {
      const initScan = async () => {
        setIsAnalyzing(true);
        const medicines = getMappedMedicines();
        try {
          const res = await api.post("/import/bulk", {
            medicines,
            supplier: selectedSupplier,
            duplicateStrategy,
            barcodeOptions,
            dryRun: true,
          });
          if (active && res.data?.success) {
            setDuplicateResults(res.data.summary);
          }
        } catch (err) {
          console.error(err);
        } finally {
          if (active) setIsAnalyzing(false);
        }
      };
      initScan();
    }
    return () => {
      active = false;
    };
  }, [
    barcodeOptions,
    duplicateStrategy,
    file,
    getMappedMedicines,
    mapping.nameColumn,
    parsedRows.length,
    selectedSupplier,
  ]);

  const onDrop = useCallback(
    async (files) => {
      const f = files[0];
      if (!f) return;
      setFile(f);

      try {
        if (f.name.endsWith(".csv")) {
          Papa.parse(f, {
            header: true,
            skipEmptyLines: true,
            delimiter: ",",
            dynamicTyping: false,
            complete: (results) => {
              const parsedHeaders = results.meta.fields || [];
              const parsedData = results.data;

              if (parsedData.length > 10000) {
                showToast(
                  `Import exceeds maximum supported size (10,000 rows). Your file has ${parsedData.length.toLocaleString()} rows. Please split the file or reduce the size.`,
                  "error",
                );
                setFile(null);
                return;
              }

              if (parsedHeaders.length <= 1 && parsedData.length > 0) {
                const val = Object.values(parsedData[0])[0] || "";
                showToast(
                  `CSV has no column delimiters. Only 1 column detected. Value: "${val.slice(0, 60)}..."`,
                  "error",
                );
                return;
              }

              setHeaders(parsedHeaders);
              setParsedRows(parsedData);
              setDataPreview(parsedData.slice(0, 5));
              autoMapHeaders(parsedHeaders);
              showToast(`✓ CSV File ${f.name} loaded successfully`, "success");
            },
            error: (err) => {
              console.error("[BulkImport] PapaParse Error:", err);
              showToast("Failed to parse CSV file", "error");
            },
          });
        } else if (f.name.endsWith(".xlsx")) {
          const reader = new FileReader();
          reader.onload = async (e) => {
            const buffer = e.target.result;
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(buffer);
            const worksheet = workbook.getWorksheet(1);

            const totalRowsCount = worksheet.rowCount - 1;
            if (totalRowsCount > 10000) {
              showToast(
                `Import exceeds maximum supported size (10,000 rows). Your file has ${totalRowsCount.toLocaleString()} rows. Please split the file or reduce the size.`,
                "error",
              );
              setFile(null);
              return;
            }

            const parsedHeaders = [];
            const parsedData = [];
            worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
              if (rowNumber === 1) {
                row.eachCell({ includeEmpty: true }, (cell) => {
                  parsedHeaders.push(String(cell.value || "").trim());
                });
              } else {
                const rowObj = {};
                parsedHeaders.forEach((header, index) => {
                  const cell = row.getCell(index + 1);
                  let val = cell.value;
                  if (val && typeof val === "object") {
                    if (val.result !== undefined) val = val.result;
                    else if (val.richText)
                      val = val.richText.map((t) => t.text).join("");
                    else if (val instanceof Date)
                      val = val.toISOString().split("T")[0];
                  }
                  rowObj[header] =
                    val !== null && val !== undefined ? String(val).trim() : "";
                });
                parsedData.push(rowObj);
              }
            });
            setHeaders(parsedHeaders);
            setParsedRows(parsedData);
            setDataPreview(parsedData.slice(0, 5));
            autoMapHeaders(parsedHeaders);
            showToast(`Excel File ${f.name} loaded successfully`, "success");
          };
          reader.readAsArrayBuffer(f);
        }
      } catch (err) {
        console.error(err);
        showToast("Failed to parse file", "error");
      }
    },
    [showToast, autoMapHeaders],
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
    },
  });

  const downloadSampleTemplate = () => {
    const link = document.createElement("a");
    link.href = "/templates/pharmacy_import_template.xlsx";
    link.download = "pharmacy_import_template.xlsx";
    link.click();
    showToast("Sample template downloaded", "success");
  };

  const resetMappingToAI = () => {
    setMapping({
      nameColumn: "med_name",
      qtyColumn: "stock_qty",
      expiryColumn: "expiry_dt",
      priceColumn: "price_inr",
      batchColumn: "batch_no",
      brandColumn: "",
      genericColumn: "",
      categoryColumn: "",
      manufacturerColumn: "",
      barcodeColumn: "barcode",
      supplierInvColumn: "",
      reorderColumn: "",
      mrpColumn: "",
      hsnColumn: "",
      gstColumn: "",
    });
    showToast("AI mapping restored", "success");
  };

  const handleDuplicateAction = (row, action) => {
    showToast(`${action} selected for ${row.name}`, "info");
  };

  const handleViewImport = (item) => {
    showToast(`Viewing ${item?.id || "Import"}`, "info");
  };

  const handleDownloadImport = (item) => {
    showToast(
      `Downloading ${item?.name || item?.fileName || "Report"}`,
      "success",
    );
  };

  const saveTemplate = () => {
    if (!templateName.trim()) {
      showToast("Template name required", "error");
      return;
    }
    const newTemplate = {
      name: templateName,
      description: templateDesc,
      mapping,
      default: templateDefault,
      date: new Date().toLocaleDateString(),
    };
    const updated = [...savedTemplates, newTemplate];
    setSavedTemplates(updated);
    localStorage.setItem("bulkImportTemplates", JSON.stringify(updated));
    showToast("Template saved", "success");
    setShowSaveMappingModal(false);
    setTemplateName("");
    setTemplateDesc("");
    setTemplateDefault(false);
  };

  const loadTemplate = (template) => {
    setMapping(template.mapping);
    showToast(`${template.name} loaded`, "success");
    setShowLoadMappingModal(false);
  };

  const saveSupplier = () => {
    if (!supplierForm.name.trim()) {
      showToast("Supplier name required", "error");
      return;
    }
    setSelectedSupplier(supplierForm.name);
    setShowAddSupplierModal(false);
    setSupplierForm({
      name: "",
      contact: "",
      phone: "",
      email: "",
      gst: "",
      leadTime: "",
      paymentTerms: "Net 30",
    });
    showToast("Supplier added and selected", "success");
  };

  const handleStartImport = async () => {
    if (!file) {
      showToast("Upload a file first", "error");
      return;
    }
    if (!mapping.nameColumn || !mapping.qtyColumn) {
      showToast("Required field mappings missing (Name + Quantity)", "error");
      return;
    }

    setImportStatus("processing");
    setImportProgress(15);

    const medicines = getMappedMedicines();
    try {
      setImportProgress(45);
      const res = await api.post("/import/bulk", {
        medicines,
        supplier: selectedSupplier,
        duplicateStrategy,
        barcodeOptions,
        dryRun: false,
      });

      if (res.data?.success) {
        setImportProgress(100);
        setImportStatus("complete");
        setCommitResult(res.data.summary || null);
        const imported = res.data.summary?.importedCount ?? 0;
        const skipped = res.data.summary?.skippedCount ?? 0;
        showToast(
          `Import complete: ${imported} imported, ${skipped} skipped`,
          imported > 0 ? "success" : "warning",
        );
        if (fetchData) fetchData();
      } else {
        throw new Error(res.data?.message || "Failed to commit import");
      }
    } catch (err) {
      console.error(err);
      setImportStatus("idle");
      showToast(err.message || "Import failed", "error");
    }
  };

  const handleFileUploadImport = async () => {
    if (!file) {
      showToast("Upload a file first", "error");
      return;
    }

    setImportStatus("processing");
    setImportProgress(10);

    try {
      const text = await file.text();

      setImportProgress(25);

      const res = await api.post("/import/upload", {
        fileName: file.name,
        fileContent: text,
        duplicateStrategy,
        barcodeOptions,
      });

      if (!res.data?.success) {
        throw new Error(res.data?.message || "Upload failed");
      }

      const { jobId } = res.data.data;
      setImportJobId(jobId);
      setImportProgress(30);

      await pollImportProgress(jobId);

      if (fetchData) fetchData();
    } catch (err) {
      console.error(err);
      setImportStatus("idle");
      setImportJobId(null);
      showToast(err.message || "Upload import failed", "error");
    }
  };

  const pollImportProgress = async (jobId) => {
    const maxAttempts = 600;
    let attempts = 0;

    return new Promise((resolve, reject) => {
      const poll = async () => {
        attempts++;
        try {
          const res = await api.get(`/import/status/${jobId}`);
          const data = res.data?.data;

          if (!data) {
            if (attempts >= maxAttempts) {
              reject(new Error("Import timed out"));
              return;
            }
            setTimeout(poll, 2000);
            return;
          }

          const { processed, total, status, summary } = data;
          const pct =
            total > 0
              ? Math.min(90, Math.round((processed / total) * 85) + 10)
              : 50;
          setImportProgress(pct);

          if (status === "completed" || status === "complete") {
            setImportProgress(100);
            setImportStatus("complete");
            setCommitResult(summary || null);
            setImportSummary(summary);
            const imported = summary?.importedCount ?? summary?.created ?? 0;
            const skipped = summary?.skippedCount ?? summary?.skipped ?? 0;
            showToast(
              `Import complete: ${imported} imported, ${skipped} skipped`,
              imported > 0 ? "success" : "warning",
            );
            resolve();
          } else if (status === "failed" || status === "error") {
            setImportStatus("idle");
            showToast(summary?.error || "Import failed", "error");
            reject(new Error(summary?.error || "Import failed"));
          } else if (attempts >= maxAttempts) {
            setImportStatus("idle");
            reject(new Error("Import timed out"));
          } else {
            setTimeout(poll, 2000);
          }
        } catch (err) {
          if (attempts >= maxAttempts) {
            reject(new Error("Import polling failed"));
            return;
          }
          setTimeout(poll, 3000);
          console.error(err);
        }
      };
      poll();
    });
  };

  const cancelImport = () => {
    if (window._importPollTimer) {
      clearTimeout(window._importPollTimer);
      window._importPollTimer = null;
    }
    setImportStatus("idle");
    showToast("Import cancelled", "info");
  };

  const fields = [
    { key: "nameColumn", label: "Medication Name" },
    { key: "qtyColumn", label: "Units in Stock" },
    { key: "expiryColumn", label: "Expiry Date" },
    { key: "priceColumn", label: "Unit Price (INR)" },
    { key: "batchColumn", label: "Batch Number" },
    { key: "barcodeColumn", label: "Barcode / SKU" },
  ];

  return (
    <div className="import-hub-container">
      {/* ── PAGE HEADER ── */}
      <div className="import-header-v2">
        <div className="header-left">
          <div className="import-pill">
            <UploadCloud size={12} />
            <span>SMART IMPORT HUB</span>
          </div>
          <h1>Bulk Inventory Import</h1>
          <p>
            Upload CSV or XLSX files to synchronize pharmacy stock with live
            data mapping.
          </p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="pos-btn outline"
            onClick={downloadSampleTemplate}
          >
            <Download size={16} />
            <span>Sample Template</span>
          </button>
          <button
            className="pos-btn outline"
            onClick={() => setShowHistoryDrawer(true)}
          >
            <History size={16} />
            <span>Import History</span>
          </button>
        </div>
      </div>

      {importStatus === "complete" ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="import-results-card"
        >
          <div className="results-header">
            <CheckCircle2 size={48} style={{ color: "var(--primary)" }} />
            <div>
              <h2>Import Complete!</h2>
              <p>
                {commitResult?.importedCount ?? 0} records imported
                {commitResult?.skippedCount > 0 &&
                  ` · ${commitResult.skippedCount} skipped`}
                {commitResult?.newBatchesCount > 0 &&
                  ` · ${commitResult.newBatchesCount} new batches`}
              </p>
            </div>
          </div>

          {commitResult?.errors?.length > 0 && (
            <div className="error-details-section">
              <h3>{commitResult.errors.length} Records Failed</h3>
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Row #</th>
                    <th>Medicine Name</th>
                    <th>Error Reason</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {commitResult.errors.map((err, i) => (
                    <tr key={i}>
                      <td>Row {err.row}</td>
                      <td>{err.name}</td>
                      <td>{err.reason}</td>
                      <td>
                        <button
                          className="micro-link"
                          onClick={() =>
                            showToast(
                              `Error on row ${err.row}: ${err.reason}`,
                              "info",
                            )
                          }
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="results-actions">
            <button className="pos-btn teal" onClick={() => navigate("/stock")}>
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
        </motion.div>
      ) : importStatus === "processing" ? (
        <div className="import-progress-card">
          <h3>Processing Import...</h3>
          <div className="progress-bar-wrap">
            <div
              className="progress-bar-fill"
              style={{ width: `${importProgress}%` }}
            >
              {importProgress}%
            </div>
          </div>

          <p className="current-item-text">
            Processing {parsedRows.length} records ({importProgress}%
            complete)...
          </p>

          <button
            className="pos-btn outline danger"
            style={{ marginTop: 20 }}
            onClick={cancelImport}
          >
            Cancel Import
          </button>
        </div>
      ) : (
        <>
          <div className="import-layout-grid">
            {/* ── LEFT COLUMN: UPLOAD & CONFIG ── */}
            <div className="layout-col-left">
              {/* Upload Zone */}
              <div className="dropzone-card-v2">
                <div
                  {...getRootProps()}
                  className={`dropzone-inner-v2 ${isDragActive ? "active" : ""}`}
                >
                  <input {...getInputProps()} />
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
                          Parsed {parsedRows.length} rows · {headers.length}{" "}
                          columns detected
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
                              {dataPreview.map((row, i) => (
                                <tr key={i}>
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

              {/* Import Configuration */}
              <div className="config-card-v2">
                <h3>Import Configuration</h3>

                <div className="config-row">
                  <label className="p-label">IMPORT TYPE</label>
                  <div className="pill-selector">
                    {[
                      "New Medicines",
                      "Update Existing",
                      "Stock Entry Only",
                    ].map((t) => (
                      <button
                        key={t}
                        className={`pill ${importType === t ? "active" : ""}`}
                        onClick={() => setImportType(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="config-row">
                  <label className="p-label">TAG THIS IMPORT TO SUPPLIER</label>
                  <div className="supplier-select-wrap">
                    <select
                      className="pos-input"
                      value={selectedSupplier}
                      onChange={(e) => {
                        if (e.target.value === "ADD_NEW")
                          setShowAddSupplierModal(true);
                        else setSelectedSupplier(e.target.value);
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
                  <label className="p-label">IF DUPLICATE FOUND</label>
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
                      <div
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
                      </div>
                    ))}
                  </div>
                </div>

                <div className="config-row">
                  <label className="p-label">BARCODE SETTINGS</label>
                  <div className="checkbox-list">
                    <label className="check-item">
                      <input
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
                        type="checkbox"
                        checked={barcodeOptions.overwrite}
                        onChange={(e) =>
                          setBarcodeOptions({
                            ...barcodeOptions,
                            overwrite: e.target.checked,
                          })
                        }
                      />
                      <span>
                        Overwrite existing barcodes with imported values
                      </span>
                    </label>
                    <label className="check-item">
                      <input
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
                    <label>{f.label}</label>
                    <select
                      className="pos-input"
                      value={mapping[f.key]}
                      onChange={(e) =>
                        setMapping({ ...mapping, [f.key]: e.target.value })
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

          {/* ── DUPLICATE DETECTION PANEL ── */}
          <AnimatePresence>
            {file && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="duplicate-panel-card"
              >
                <div className="panel-header">
                  <div className="title">
                    <GitMerge size={18} style={{ color: "var(--warning)" }} />
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
                    <label>New Records</label>
                  </div>
                  <div className="det-stat warning">
                    <div className="num">{duplicateResults.duplicates}</div>
                    <label>Duplicates Found</label>
                  </div>
                  <div className="det-stat danger">
                    <div className="num">{duplicateResults.conflicts}</div>
                    <label>Conflicts</label>
                  </div>
                </div>

                <div className="duplicate-table-section">
                  <h4>
                    {duplicateResults.duplicates} Potential Duplicates Detected
                  </h4>
                  <div className="table-overflow">
                    <table className="duplicate-list-table">
                      <thead>
                        <tr>
                          <th>ROW #</th>
                          <th>IMPORTED NAME</th>
                          <th>MATCHES IN SYSTEM</th>
                          <th>MATCH TYPE</th>
                          <th>DIFFERENCE</th>
                          <th>ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {duplicateResults.rows.map((r, i) => (
                          <tr
                            key={i}
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
                            <td className="diff">{r.diff}</td>
                            <td>
                              <div className="action-btns">
                                <button
                                  type="button"
                                  className="btn skip"
                                  onClick={() =>
                                    handleDuplicateAction(r, "Skip")
                                  }
                                >
                                  Skip
                                </button>
                                <button
                                  type="button"
                                  className="btn overwrite"
                                  onClick={() =>
                                    handleDuplicateAction(r, "Overwrite")
                                  }
                                >
                                  Overwrite
                                </button>
                                <button
                                  type="button"
                                  className="btn merge"
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
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="bulk-actions-row">
                    <button
                      className="pos-btn outline micro"
                      onClick={() =>
                        showToast("All duplicates will be skipped", "info")
                      }
                    >
                      Skip All Duplicates
                    </button>
                    <button
                      className="pos-btn outline micro warning"
                      onClick={() =>
                        showToast("All duplicates will be overwritten", "info")
                      }
                    >
                      Overwrite All
                    </button>
                    <button
                      className="pos-btn outline micro blue"
                      onClick={() =>
                        showToast("All duplicates will be merged", "info")
                      }
                    >
                      Merge All
                    </button>
                  </div>
                </div>
                {duplicateResults.errors &&
                  duplicateResults.errors.length > 0 && (
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
                        <X size={16} /> {duplicateResults.errors.length}{" "}
                        Validation Errors (These rows will be skipped)
                      </h4>
                      <div
                        className="table-overflow"
                        style={{ maxHeight: "200px" }}
                      >
                        <table className="duplicate-list-table">
                          <thead>
                            <tr>
                              <th>ROW #</th>
                              <th>MEDICATION NAME</th>
                              <th>FIELD / COLUMN</th>
                              <th>ERROR DETAILS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {duplicateResults.errors.map((err, i) => (
                              <tr key={i} className="conflict-row">
                                <td>Row {err.row}</td>
                                <td className="bold">
                                  {err.name || "Unknown"}
                                </td>
                                <td>
                                  <span
                                    className="match-badge danger"
                                    style={{
                                      color: "var(--danger)",
                                      background: "rgba(239, 68, 68, 0.1)",
                                      padding: "2px 6px",
                                      borderRadius: "4px",
                                    }}
                                  >
                                    {err.field}
                                  </span>
                                </td>
                                <td
                                  className="diff"
                                  style={{ color: "var(--danger)" }}
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
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── STICKY VALIDATION SUMMARY ── */}
          {file && (
            <div className="sticky-import-footer">
              <div className="validation-bar">
                <div className="val-item green">
                  <div className="dot" />{" "}
                  <span>
                    {duplicateResults.readyCount} rows ready to import
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
                  <div className="dot" />{" "}
                  <span>Supplier: {selectedSupplier}</span>
                </div>
                <div className="val-item orange">
                  <div className="dot" />{" "}
                  <span>
                    {duplicateResults.duplicates || 0} duplicates — handling:{" "}
                    {duplicateStrategy}
                  </span>
                </div>
                <div className="val-item red">
                  <div className="dot" />{" "}
                  <span>
                    {(duplicateResults.errors || []).length} rows with invalid
                    data will be skipped
                  </span>
                </div>
              </div>

              <div className="import-action-bar">
                <div className="estimate-text">
                  Will import:{" "}
                  <span className="green">{duplicateResults.new || 0} new</span>{" "}
                  ·{" "}
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
                  <button
                    className="pos-btn outline"
                    onClick={() => setFile(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="pos-btn teal large"
                    onClick={handleStartImport}
                    title="Send parsed JSON (legacy — for small imports)"
                  >
                    <UploadCloud size={18} />
                    <span>Import (Legacy) — {parsedRows.length} Records</span>
                  </button>
                  <button
                    className="pos-btn outline large"
                    onClick={handleFileUploadImport}
                    title="Upload raw CSV for server-side ETL processing"
                  >
                    <UploadCloud size={18} />
                    <span>
                      Upload as File (ETL) — {parsedRows.length} Records
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── IMPORT HISTORY DRAWER ── */}
      <AnimatePresence>
        {showHistoryDrawer && (
          <>
            <div
              className="drawer-overlay"
              onClick={() => setShowHistoryDrawer(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="import-history-drawer"
            >
              <div className="drawer-header">
                <h3>Import History</h3>
                <button
                  type="button"
                  onClick={() => setShowHistoryDrawer(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="drawer-quick-stats">
                <label>Total imported</label>
                <div className="val">1,248 medicines</div>
                <div className="sub">Last import: 2 hours ago</div>
              </div>
              <div className="history-list">
                {historyLoading ? (
                  <p>Loading history...</p>
                ) : (
                  importHistory.map((item) => (
                    <div key={item.id} className="history-item-card">
                      <div className="top-row">
                        <span className="filename">
                          {item.fileName || item.name}
                        </span>
                        <span className="date">
                          {new Date(item.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="stats-row">
                        {item.records} records imported
                      </div>
                      <div className="tags-row">
                        <span className="tag supplier">{item.supplier}</span>
                        <span className="tag type">{item.type}</span>
                        <span className="tag ai">AI Mapping</span>
                      </div>
                      <div className="footer-row">
                        <span
                          className={`status-badge ${String(item.status || "").toLowerCase()}`}
                        >
                          {item.status}
                        </span>
                        <div className="links">
                          <button
                            className="link-btn"
                            onClick={() => handleViewImport(item)}
                          >
                            View Details
                          </button>
                          <button
                            className="link-btn"
                            onClick={() => handleDownloadImport(item)}
                          >
                            Download
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <button
                  className="load-more-btn"
                  onClick={() => showToast("Loading more history...", "info")}
                >
                  Load More History...
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── ADD SUPPLIER MODAL ── */}
      {showAddSupplierModal && (
        <div className="modal-overlay-v2">
          <div className="modal-content-v2">
            <div className="modal-header">
              <div>
                <h3>Add New Supplier</h3>
                <p>Quickly add a supplier for this import.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddSupplierModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="p-form-grid">
                <div className="pos-input-group">
                  <label className="p-label">SUPPLIER NAME*</label>
                  <input
                    className="pos-input"
                    placeholder="e.g. Cipla Ltd"
                    value={supplierForm.name}
                    onChange={(e) =>
                      setSupplierForm({ ...supplierForm, name: e.target.value })
                    }
                  />
                </div>
                <div className="pos-input-group">
                  <label className="p-label">CONTACT PERSON</label>
                  <input
                    className="pos-input"
                    placeholder="Name"
                    value={supplierForm.contact}
                    onChange={(e) =>
                      setSupplierForm({
                        ...supplierForm,
                        contact: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="pos-input-group">
                  <label className="p-label">PHONE</label>
                  <input
                    className="pos-input"
                    placeholder="+91..."
                    value={supplierForm.phone}
                    onChange={(e) =>
                      setSupplierForm({
                        ...supplierForm,
                        phone: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="pos-input-group">
                  <label className="p-label">EMAIL</label>
                  <input
                    className="pos-input"
                    placeholder="supplier@mail.com"
                    value={supplierForm.email}
                    onChange={(e) =>
                      setSupplierForm({
                        ...supplierForm,
                        email: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="pos-input-group">
                  <label className="p-label">GST NUMBER</label>
                  <input
                    className="pos-input"
                    placeholder="29AAB..."
                    value={supplierForm.gst}
                    onChange={(e) =>
                      setSupplierForm({ ...supplierForm, gst: e.target.value })
                    }
                  />
                </div>
                <div className="pos-input-group">
                  <label className="p-label">LEAD TIME (DAYS)</label>
                  <input
                    className="pos-input"
                    type="number"
                    placeholder="3"
                    value={supplierForm.leadTime}
                    onChange={(e) =>
                      setSupplierForm({
                        ...supplierForm,
                        leadTime: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="pos-input-group">
                <label className="p-label">PAYMENT TERMS</label>
                <select
                  className="pos-input"
                  value={supplierForm.paymentTerms}
                  onChange={(e) =>
                    setSupplierForm({
                      ...supplierForm,
                      paymentTerms: e.target.value,
                    })
                  }
                >
                  <option>Net 30</option>
                  <option>Net 15</option>
                  <option>Advance</option>
                  <option>COD</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="pos-btn outline"
                onClick={() => setShowAddSupplierModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="pos-btn teal"
                onClick={saveSupplier}
              >
                Save & Use Supplier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SAVE MAPPING MODAL ── */}
      {showSaveMappingModal && (
        <div className="modal-overlay-v2">
          <div className="modal-content-v2">
            <div className="modal-header">
              <h3>Save Mapping Template</h3>
              <button
                type="button"
                onClick={() => setShowSaveMappingModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="pos-input-group">
                <label className="p-label">TEMPLATE NAME</label>
                <input
                  className="pos-input"
                  placeholder="e.g. Cipla Invoice Format"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
              </div>
              <div className="pos-input-group full">
                <label className="p-label">DESCRIPTION</label>
                <textarea
                  className="pos-input"
                  placeholder="Optional notes..."
                  style={{ height: 80 }}
                  value={templateDesc}
                  onChange={(e) => setTemplateDesc(e.target.value)}
                />
              </div>
              <label className="check-item">
                <input
                  type="checkbox"
                  checked={templateDefault}
                  onChange={(e) => setTemplateDefault(e.target.checked)}
                />
                <span>Make this my default mapping</span>
              </label>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="pos-btn outline"
                onClick={() => setShowSaveMappingModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="pos-btn teal"
                onClick={saveTemplate}
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── LOAD MAPPING MODAL ── */}
      {showLoadMappingModal && (
        <div className="modal-overlay-v2">
          <div className="modal-content-v2">
            <div className="modal-header">
              <h3>Load Mapping Template</h3>
              <button
                type="button"
                onClick={() => setShowLoadMappingModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="template-load-list">
                {savedTemplates.length === 0 ? (
                  <div className="empty-templates">
                    <p>No saved templates yet. Save one to get started.</p>
                  </div>
                ) : (
                  savedTemplates.map((t) => (
                    <div key={t.name} className="template-row">
                      <div className="t-info">
                        <div className="t-name">{t.name}</div>
                        <div className="t-date">
                          {t.description ? `${t.description} · ` : ""}
                          Saved {t.date}
                          {t.default ? " · Default" : ""}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="pos-btn outline micro"
                        onClick={() => loadTemplate(t)}
                      >
                        Load
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="pos-btn outline"
                style={{ width: "100%" }}
              >
                Manage Templates
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
