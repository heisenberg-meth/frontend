import { useState, useCallback, useEffect, useReducer, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { useNavigate } from "react-router-dom";
import { UploadCloud, Download, History, X } from "lucide-react";
import ExcelJS from "exceljs";
import Papa from "papaparse";
import api from "../api";
import { getSuppliers, createSupplier } from "../services/suppliers.service.js";
import { safeNumber } from "../utils/number.js";
import { BulkImportSection1 } from "../components/import/Bulkimportsection1.jsx";
import {
  BulkImportSection2,
  BulkImportSection3,
} from "../components/import/Bulkimportsection2.jsx";
import {
  fieldExcludes,
  fieldOrder,
  fieldKeywords,
} from "../components/import/importConstants.js";

const normalizeDate = (dateStr) => {
  if (!dateStr) return null;
  const trimmed = String(dateStr).trim();
  const numVal = Number(trimmed);
  if (!isNaN(numVal) && numVal > 10000 && numVal < 100000) {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + numVal * 86400000);
    if (!isNaN(date.getTime())) return date.toISOString().split("T")[0];
  }
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
  return trimmed;
};

export default function BulkImport({ fetchData, showToast }) {
  const navigate = useNavigate();
  const [importState, dispatchImport] = useReducer(
    (state, action) => {
      if (action.type === "RESET_IMPORT") {
        return {
          ...state,
          file: null,
          headers: [],
          importProgress: 0,
          importStatus: "idle",
          dataPreview: [],
          duplicateResults: {
            new: 0,
            duplicates: 0,
            conflicts: 0,
            rows: [],
            errors: [],
          },
          parsedRows: [],
          commitResult: null,
        };
      }
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
      file: null,
      headers: [],
      mapping: {
        nameColumn: "med_name",
        qtyColumn: "stock_qty",
        expiryColumn: "expiry_dt",
        priceColumn: "price_inr",
        categoryColumn: "category",
        batchColumn: "batch_no",
        barcodeColumn: "barcode",
        manufacturerColumn: "manufacturer",
        genericNameColumn: "generic_name",
        strengthColumn: "strength",
        dosageFormColumn: "dosage_form",
        scheduleColumn: "schedule",
        hsnCodeColumn: "hsn_code",
        gstPercentageColumn: "gst_percent",
      },
      importProgress: 0,
      importStatus: "idle",
      importType: "New Medicines",
      selectedSupplier: "None",
      duplicateStrategy: "Skip",
      barcodeOptions: {
        autoGen: true,
        overwrite: false,
        validate: true,
      },
      dataPreview: [],
      duplicateResults: {
        new: 0,
        duplicates: 0,
        conflicts: 0,
        rows: [],
        errors: [],
      },
      parsedRows: [],
      commitResult: null,
    },
  );
  const {
    file,
    headers,
    mapping,
    importProgress,
    importStatus,
    importType,
    selectedSupplier,
    duplicateStrategy,
    barcodeOptions,
    dataPreview,
    duplicateResults,
    parsedRows,
    commitResult,
  } = importState;
  const setFile = useCallback(
    (val) =>
      dispatchImport({
        type: "SET_FIELD",
        field: "file",
        value: val,
      }),
    [],
  );
  const setHeaders = useCallback(
    (val) =>
      dispatchImport({
        type: "SET_FIELD",
        field: "headers",
        value: val,
      }),
    [],
  );
  const setMapping = useCallback(
    (val) =>
      dispatchImport({
        type: "SET_FIELD",
        field: "mapping",
        value: val,
      }),
    [],
  );
  const setImportProgress = useCallback(
    (val) =>
      dispatchImport({
        type: "SET_FIELD",
        field: "importProgress",
        value: val,
      }),
    [],
  );
  const setImportStatus = useCallback(
    (val) =>
      dispatchImport({
        type: "SET_FIELD",
        field: "importStatus",
        value: val,
      }),
    [],
  );
  const setImportType = useCallback(
    (val) =>
      dispatchImport({
        type: "SET_FIELD",
        field: "importType",
        value: val,
      }),
    [],
  );
  const setSelectedSupplier = useCallback(
    (val) =>
      dispatchImport({
        type: "SET_FIELD",
        field: "selectedSupplier",
        value: val,
      }),
    [],
  );
  const setDuplicateStrategy = useCallback(
    (val) =>
      dispatchImport({
        type: "SET_FIELD",
        field: "duplicateStrategy",
        value: val,
      }),
    [],
  );
  const setBarcodeOptions = useCallback(
    (val) =>
      dispatchImport({
        type: "SET_FIELD",
        field: "barcodeOptions",
        value: val,
      }),
    [],
  );
  const setDataPreview = useCallback(
    (val) =>
      dispatchImport({
        type: "SET_FIELD",
        field: "dataPreview",
        value: val,
      }),
    [],
  );
  const setDuplicateResults = useCallback(
    (val) =>
      dispatchImport({
        type: "SET_FIELD",
        field: "duplicateResults",
        value: val,
      }),
    [],
  );
  const setParsedRows = useCallback(
    (val) =>
      dispatchImport({
        type: "SET_FIELD",
        field: "parsedRows",
        value: val,
      }),
    [],
  );
  const setCommitResult = useCallback(
    (val) =>
      dispatchImport({
        type: "SET_FIELD",
        field: "commitResult",
        value: val,
      }),
    [],
  );
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [importHistory, setImportHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [suppliersList, setSuppliersList] = useState([]);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  useEffect(() => {}, [showAddSupplierModal]);
  useEffect(() => {
    return () => {
      if (window._importPollTimer) {
        clearTimeout(window._importPollTimer);
        window._importPollTimer = null;
      }
    };
  }, []);
  const initialTemplates = (() => {
    try {
      localStorage.removeItem("bulkImportTemplates");
      const stored = localStorage.getItem("bulkImportTemplates:v1");
      return stored ? JSON.parse(stored) : [];
    } catch (err) {
      console.error(err);
      return [];
    }
  })();
  const [templateState, dispatchTemplate] = useReducer(
    (state, action) => {
      switch (action.type) {
        case "SAVE_TEMPLATE":
          return {
            ...state,
            savedTemplates: action.payload,
            showSaveMappingModal: false,
            templateName: "",
            templateDesc: "",
            templateDefault: false,
          };
        case "SET_FIELD":
          return {
            ...state,
            [action.field]:
              typeof action.value === "function"
                ? action.value(state[action.field])
                : action.value,
          };
        default:
          return state;
      }
    },
    {
      savedTemplates: initialTemplates,
      showSaveMappingModal: false,
      showLoadMappingModal: false,
      templateName: "",
      templateDesc: "",
      templateDefault: false,
    },
  );
  const {
    savedTemplates,
    showSaveMappingModal,
    showLoadMappingModal,
    templateName,
    templateDesc,
    templateDefault,
  } = templateState;
  const setShowSaveMappingModal = useCallback(
    (val) =>
      dispatchTemplate({
        type: "SET_FIELD",
        field: "showSaveMappingModal",
        value: val,
      }),
    [],
  );
  const setShowLoadMappingModal = useCallback(
    (val) =>
      dispatchTemplate({
        type: "SET_FIELD",
        field: "showLoadMappingModal",
        value: val,
      }),
    [],
  );
  const setTemplateName = useCallback(
    (val) =>
      dispatchTemplate({
        type: "SET_FIELD",
        field: "templateName",
        value: val,
      }),
    [],
  );
  const setTemplateDesc = useCallback(
    (val) =>
      dispatchTemplate({
        type: "SET_FIELD",
        field: "templateDesc",
        value: val,
      }),
    [],
  );
  const setTemplateDefault = useCallback(
    (val) =>
      dispatchTemplate({
        type: "SET_FIELD",
        field: "templateDefault",
        value: val,
      }),
    [],
  );
  const [supplierForm, setSupplierForm] = useState({
    name: "",
    contact: "",
    phone: "",
    email: "",
    gst: "",
    leadTime: "",
    paymentTerms: "Net 30",
  });
  const autoMapHeaders = useCallback(
    (fileHeaders) => {
      const newMapping = {};
      const usedHeaders = new Set();
      if (fileHeaders.length <= 1) {
        showToast(
          "Import file has no column delimiters. Use a comma-separated CSV.",
          "error",
        );
        return;
      }
      fieldOrder.forEach((field) => {
        const match = fileHeaders.find((header) => {
          if (usedHeaders.has(header)) return false;
          const lower = header.toLowerCase();
          const excludes = fieldExcludes[field] || [];
          const hasExclude = excludes.some((ex) => lower.includes(ex));
          if (hasExclude) return false;
          return fieldKeywords[field].some((keyword) =>
            lower.includes(keyword),
          );
        });
        if (match) {
          newMapping[field] = match;
          usedHeaders.add(match);
        }
      });
      setMapping((prev) => ({
        ...prev,
        ...newMapping,
      }));
    },
    [setMapping, showToast],
  );
  const getMappedMedicines = useCallback(() => {
    const result = parsedRows.map((row) => {
      const name = String(row[mapping.nameColumn] || "").trim();
      const qtyStr = mapping.qtyColumn
        ? String(row[mapping.qtyColumn] ?? "").trim()
        : "";
      const priceStr = mapping.priceColumn
        ? String(row[mapping.priceColumn] ?? "").trim()
        : "";
      const expiryStr = mapping.expiryColumn
        ? String(row[mapping.expiryColumn] ?? "").trim()
        : "";
      return {
        name,
        qty: qtyStr ? Number(qtyStr.replace(/[^0-9.-]/g, "")) || 0 : 0,
        expiry: normalizeDate(expiryStr),
        price: priceStr ? Number(priceStr.replace(/[^0-9.-]/g, "")) || 0 : 0,
        batch: String(row[mapping.batchColumn] || "").trim(),
        barcode: String(row[mapping.barcodeColumn] || "").trim(),
        category: String(row[mapping.categoryColumn] || "").trim(),
        manufacturer: String(row[mapping.manufacturerColumn] || "").trim(),
        genericName: String(row[mapping.genericNameColumn] || "").trim(),
        strength: String(row[mapping.strengthColumn] || "").trim(),
        dosageForm: String(row[mapping.dosageFormColumn] || "").trim(),
        schedule: String(row[mapping.scheduleColumn] || "").trim(),
        hsnCode: String(row[mapping.hsnCodeColumn] || "").trim(),
        gstPercentage: String(row[mapping.gstPercentageColumn] || "").trim(),
      };
    });
    if (result.length > 0) {
      const vals = Object.values(result[0]);
      const uniqueVals = new Set(
        vals.filter((v) => v !== "" && v !== 0 && v !== null),
      );
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
          if (!active) return;
          if (res.data?.success) {
            setImportHistory(res.data.data);
          }
        } catch (err) {
          if (!active) return;
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
const isAnalyzingRef = useRef(false);
/* eslint-disable no-unused-vars */
  const [parsingProgress, setParsingProgress] = useState(0);
  const [parsingStatus, setParsingStatus] = useState("");
/* eslint-enable no-unused-vars */
  const handleAnalyzeImport = useCallback(async () => {
    if (isAnalyzingRef.current) return;
    if (!file) {
      showToast("Upload a file first", "error");
      return;
    }
    if (!mapping.nameColumn || !mapping.qtyColumn) {
      showToast("Required field mappings missing (Name + Quantity)", "error");
      return;
    }
    isAnalyzingRef.current = true;
    setIsAnalyzing(true);
    const medicines = getMappedMedicines();
    try {
      const res = await api.post("/import/bulk/analyze", {
        medicines,
        supplier: selectedSupplier,
        duplicateStrategy,
        barcodeOptions,
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
      isAnalyzingRef.current = false;
      setIsAnalyzing(false);
    }
  }, [
    file,
    mapping.nameColumn,
    mapping.qtyColumn,
    getMappedMedicines,
    showToast,
    selectedSupplier,
    duplicateStrategy,
    barcodeOptions,
    setDuplicateResults,
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
            const parsedHeaders = [];
            const parsedData = [];

            // Read headers first
            const headerRow = worksheet.getRow(1);

            headerRow.eachCell(
              {
                includeEmpty: true,
              },
              (cell) => {
                parsedHeaders.push(String(cell.value || "").trim());
              },
            );

            setHeaders(parsedHeaders);

            // Parse rows progressively
            const totalRowsCount = Math.max(worksheet.rowCount - 1, 0);

            if (totalRowsCount > 10000) {
              showToast(
                `Import exceeds maximum supported size (10,000 rows). Your file has ${totalRowsCount.toLocaleString()} rows. Please split the file or reduce the size.`,
                "error",
              );
              setFile(null);
              return;
            }

            setParsingStatus(`Parsing Excel data... 0 of ${totalRowsCount.toLocaleString()} rows`);

            for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
              const row = worksheet.getRow(rowNumber);

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
                  val !== null && val !== undefined
                    ? String(val).trim()
                    : "";
              });

              parsedData.push(rowObj);

              // Update progress while parsing (approx 100 updates max)
              const parsedCount = rowNumber - 1;

              if (
                parsedCount === totalRowsCount ||
                parsedCount % Math.max(1, Math.floor(totalRowsCount / 100)) === 0
              ) {
                const percentage =
                  totalRowsCount > 0
                    ? Math.round((parsedCount / totalRowsCount) * 60)
                    : 60;

                setParsingProgress(percentage);
                setImportProgress(percentage);

                setParsingStatus(
                  `Parsing Excel data... ${parsedCount.toLocaleString()} of ${totalRowsCount.toLocaleString()} rows`,
                );

                // Give React/browser a chance to render the progress update
                await new Promise((resolve) => setTimeout(resolve, 0));
              }
            }

            setParsedRows(parsedData);
            setDataPreview(parsedData.slice(0, 5));

            setParsingProgress(60);
            setImportProgress(60);
            setParsingStatus(
              `Excel parsing complete — ${parsedData.length.toLocaleString()} rows loaded`,
            );

            autoMapHeaders(parsedHeaders);

            setImportStatus("idle");

            showToast(`Excel File ${f.name} loaded successfully`, "success");
          };
          reader.readAsArrayBuffer(f);
        }
      } catch (err) {
        console.error(err);
        showToast("Failed to parse file", "error");
      }
    },
    [
      setFile,
      setHeaders,
      setParsedRows,
      setDataPreview,
      autoMapHeaders,
      showToast,
      setImportProgress,
      setImportStatus,
    ],
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
    const csvContent =
      "med_name,stock_qty,expiry_dt,price_inr,batch_no,barcode,category,manufacturer,generic_name,strength,dosage_form,schedule,hsn_code,gst_percent\n" +
      "Paracetamol 500mg,150,2026-12-31,25.50,BTC-2024-001,8901234567890,Analgesics,Cipla Ltd,Paracetamol,500mg,Tablet,OTC,30049099,12\n" +
      "Amoxicillin 250mg,80,2025-10-15,45.00,BTC-2024-002,8901234567891,Antibiotics,Sun Pharma,Amoxicillin,250mg,Capsule,Schedule H,30041010,12\n" +
      "Cetirizine 10mg,200,2027-05-20,18.00,BTC-2024-003,8901234567892,Antihistamines,Dr. Reddy's,Cetirizine,10mg,Tablet,OTC,30049099,12\n" +
      "Metformin 500mg,120,2026-08-10,32.00,BTC-2024-004,8901234567893,Antidiabetic,Lupin Ltd,Metformin,500mg,Tablet,Schedule H,30049099,12\n" +
      "Azithromycin 500mg,60,2025-11-30,115.00,BTC-2024-005,8901234567894,Antibiotics,Zydus Cadila,Azithromycin,500mg,Tablet,Schedule H1,30041010,12\n" +
      "Atorvastatin 10mg,90,2026-09-15,65.50,BTC-2024-006,8901234567895,Cardiovascular,Torrent Pharma,Atorvastatin,10mg,Tablet,Schedule H,30049099,12\n" +
      "Pantoprazole 40mg,110,2027-01-25,48.00,BTC-2024-007,8901234567896,Gastrointestinal,Alkem Labs,Pantoprazole,40mg,Tablet,OTC,30049099,12\n" +
      "Cough Syrup 100ml,40,2025-12-01,85.00,BTC-2024-008,8901234567897,Respiratory,Dabur India,Dextromethorphan,10mg/5ml,Syrup,OTC,30049099,18\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "pharmacy_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Sample CSV template downloaded", "success");
  };
  const resetMappingToAI = () => {
    setMapping({
      nameColumn: "med_name",
      qtyColumn: "stock_qty",
      expiryColumn: "expiry_dt",
      priceColumn: "price_inr",
      batchColumn: "batch_no",
      categoryColumn: "",
      manufacturerColumn: "",
      barcodeColumn: "barcode",
      genericNameColumn: "",
      strengthColumn: "",
      dosageFormColumn: "",
      scheduleColumn: "",
      hsnCodeColumn: "",
      gstPercentageColumn: "",
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
    dispatchTemplate({
      type: "SAVE_TEMPLATE",
      payload: updated,
    });
    localStorage.setItem("bulkImportTemplates:v1", JSON.stringify(updated));
    showToast("Template saved", "success");
  };
  const loadTemplate = (template) => {
    setMapping(template.mapping);
    showToast(`${template.name} loaded`, "success");
    setShowLoadMappingModal(false);
  };
  const isSavingSupplierRef = useRef(false);
  const saveSupplier = async () => {
    if (isSavingSupplierRef.current) return;
    if (!supplierForm.name.trim()) {
      showToast("Supplier name required", "error");
      return;
    }
    isSavingSupplierRef.current = true;
    try {
      const payload = {
        name: supplierForm.name.trim(),
        contactPerson: supplierForm.contact.trim(),
        phone: supplierForm.phone.trim(),
        email: supplierForm.email.trim(),
        gstNumber: supplierForm.gst.trim(),
        leadTimeDays: safeNumber(supplierForm.leadTime || 7),
        paymentTermsDays:
          supplierForm.paymentTerms === "Net 15"
            ? 15
            : supplierForm.paymentTerms === "Net 30"
              ? 30
              : 0,
        status: "ACTIVE",
      };
      const res = await createSupplier(payload);
      if (res.data?.success) {
        await getSuppliers().then((r) => {
          if (r.data?.success) {
            setSuppliersList(r.data.data);
          }
        });
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
        showToast("Supplier Added", "success");
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.error || "Failed to add supplier", "error");
    } finally {
      isSavingSupplierRef.current = false;
    }
  };
  const importProcessingRef = useRef(false);
  const handleStartImport = async () => {
    if (importProcessingRef.current) return;
    if (!file) {
      showToast("Upload a file first", "error");
      return;
    }
    if (!mapping.nameColumn || !mapping.qtyColumn) {
      showToast("Required field mappings missing (Name + Quantity)", "error");
      return;
    }
    importProcessingRef.current = true;
    setImportStatus("processing");
    setImportProgress(15);
    const medicines = getMappedMedicines();
    try {
      setImportProgress(45);
      const res = await api.post("/import/bulk/commit", {
        medicines,
        fileName: file?.name || "bulk_import.csv",
        supplier: selectedSupplier,
        duplicateStrategy,
        barcodeOptions,
      });
      if (res.data?.success) {
        setImportProgress(100);
        setImportStatus("complete");
        setCommitResult({
          ...(res.data.summary || {}),
          errors: res.data.errors || [],
        });
        const imported = res.data.summary?.imported ?? 0;
        const duplicates = res.data.summary?.duplicates ?? 0;
        const failed = res.data.summary?.failed ?? 0;
        showToast(
          `Import complete: ${imported} imported, ${duplicates} duplicates, ${failed} failed`,
          imported > 0 ? "success" : "warning",
        );
        if (fetchData) fetchData();
      } else {
        throw new Error(res.data?.message || "Failed to commit import");
      }
    } catch (error) {
      console.error(error);
      setImportStatus("idle");
      const errMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to commit import";
      showToast(errMsg, "error");
    } finally {
      importProcessingRef.current = false;
    }
  };
  const cancelImport = () => {
    if (window._importPollTimer) {
      clearTimeout(window._importPollTimer);
      window._importPollTimer = null;
    }
    setImportStatus("idle");
    showToast("Import cancelled", "info");
  };
  return (
    <div className="import-hub-container">
      <div className="import-header-v2">
        <div className="header-left">
          <div className="import-pill">
            <UploadCloud size={12} />
            <span>SMART IMPORT HUB</span>
          </div>
          <h1 className="page-title">Bulk Inventory Import</h1>
          <p className="page-subtitle">
            Upload CSV or XLSX files to synchronize pharmacy stock with live
            data mapping.
          </p>
        </div>
        <div className="page-header-actions header-actions">
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

      <BulkImportSection1
        commitResult={commitResult}
        navigate={navigate}
        setFile={setFile}
        setImportStatus={setImportStatus}
        setCommitResult={setCommitResult}
        headers={headers}
        importType={importType}
        setImportType={setImportType}
        setShowAddSupplierModal={setShowAddSupplierModal}
        setSelectedSupplier={setSelectedSupplier}
        setDuplicateStrategy={setDuplicateStrategy}
        duplicateStrategy={duplicateStrategy}
        setBarcodeOptions={setBarcodeOptions}
        barcodeOptions={barcodeOptions}
        mapping={mapping}
        setMapping={setMapping}
        setShowSaveMappingModal={setShowSaveMappingModal}
        setShowLoadMappingModal={setShowLoadMappingModal}
        handleDuplicateAction={handleDuplicateAction}
        showToast={showToast}
        importProgress={importProgress}
        getInputProps={getInputProps}
        parsedRows={parsedRows}
        dataPreview={dataPreview}
        isAnalyzing={isAnalyzing}
        handleStartImport={handleStartImport}
        importStatus={importStatus}
        isDragActive={isDragActive}
        file={file}
        duplicateResults={duplicateResults}
        resetMappingToAI={resetMappingToAI}
        getRootProps={getRootProps}
        open={open}
        handleAnalyzeImport={handleAnalyzeImport}
        suppliersList={suppliersList}
        selectedSupplier={selectedSupplier}
        cancelImport={cancelImport}
      />

      <BulkImportSection2
        setShowHistoryDrawer={setShowHistoryDrawer}
        handleViewImport={handleViewImport}
        handleDownloadImport={handleDownloadImport}
        showToast={showToast}
        importHistory={importHistory}
        historyLoading={historyLoading}
        showHistoryDrawer={showHistoryDrawer}
      />

      <BulkImportSection3
        setShowAddSupplierModal={setShowAddSupplierModal}
        setSupplierForm={setSupplierForm}
        supplierForm={supplierForm}
        saveSupplier={saveSupplier}
        showAddSupplierModal={showAddSupplierModal}
      />

      {showSaveMappingModal && (
        <div className="modal-overlay-v2">
          <div className="modal-content-v2">
            <div className="modal-header">
              <h3>Save Mapping Template</h3>
              <button
                aria-label="Close"
                type="button"
                onClick={() => setShowSaveMappingModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="pos-input-group">
                <label htmlFor="field_himsdq" className="p-label">
                  TEMPLATE NAME
                </label>
                <input
                  aria-label="e.g. Cipla Invoice Format"
                  id="field_himsdq"
                  required
                  className="pos-input"
                  placeholder="e.g. Cipla Invoice Format"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
              </div>
              <div className="pos-input-group full">
                <label htmlFor="field_vvjc94" className="p-label">
                  DESCRIPTION
                </label>
                <textarea
                  aria-label="Optional notes..."
                  id="field_vvjc94"
                  className="pos-input"
                  placeholder="Optional notes..."
                  style={{
                    height: 80,
                  }}
                  value={templateDesc}
                  onChange={(e) => setTemplateDesc(e.target.value)}
                />
              </div>
              <label className="check-item">
                <input
                  required
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

      {showLoadMappingModal && (
        <div className="modal-overlay-v2">
          <div className="modal-content-v2">
            <div className="modal-header">
              <h3>Load Mapping Template</h3>
              <button
                aria-label="Close"
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
                style={{
                  width: "100%",
                }}
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
