import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Printer,
  Scan,
  QrCode,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Plus,
  Minus,
  Camera,
  ShieldCheck,
  Zap,
  Download,
  Loader2,
  Search,
  X,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { searchByBarcode, getMedicines } from "../services/inventory.service";
import { getBarcodes, verifyBarcode } from "../services/reports.service";
import "../styles/BarcodeEcosystem.css";

function Spinner({ size = 14 }) {
  return (
    <Loader2 size={size} style={{ animation: "spin 0.8s linear infinite" }} />
  );
}

const LABEL_TEMPLATES = {
  Standard: { width: 100, height: 50, scale: 1, desc: "38×25mm — Thermal Sticker" },
  Large: { width: 130, height: 70, scale: 1.3, desc: "50×35mm — Large Label" },
  Strip: { width: 160, height: 28, scale: 0.85, desc: "Strip Label (16×28mm)" },
  Custom: { width: 100, height: 50, scale: 1, desc: "Custom Configuration" },
};

export default function BarcodeEcosystem({
  showToast,
}) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("labels");
  const [labelQty, setLabelQty] = useState(10);
  const [previewScale, setPreviewScale] = useState(1);
  const [template, setTemplate] = useState("Standard");
  const [verificationResult, setVerificationResult] = useState(null);
  const [verifiedMedicine, setVerifiedMedicine] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [scannerConnected] = useState(true);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [labelFields, setLabelFields] = useState({
    medName: true,
    generic: true,
    batch: true,
    expiry: true,
    mrp: true,
    barcode: true,
    qr: true,
    manufacturer: false,
    schedule: false,
    storage: false,
  });

  const [medicines, setMedicines] = useState([]);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [medicineSearch, setMedicineSearch] = useState("");
  const [showMedDropdown, setShowMedDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    getMedicines({ limit: 100 })
      .then((res) => {
        const data = res.data.data || res.data;
        const list =
          Array.isArray(data) && data.length > 0
            ? data
            : data.medicines || [];
        setMedicines(list);
      })
      .catch(() => {
        setMedicines([]);
      });
  }, []);

  const filteredMedicines = useMemo(() => {
    if (!medicineSearch.trim()) return medicines.slice(0, 50);
    const q = medicineSearch.toLowerCase();
    return medicines
      .filter(
        (m) =>
          m.name?.toLowerCase().includes(q) ||
          m.genericName?.toLowerCase().includes(q) ||
          (m.inventoryBatches?.[0]?.batchNumber || m.batchNumber || "")
            .toLowerCase()
            .includes(q) ||
          (m.manufacturer?.name || m.manufacturer || "")
            .toLowerCase()
            .includes(q),
      )
      .slice(0, 50);
  }, [medicines, medicineSearch]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowMedDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectMedicine = (med) => {
  setSelectedMedicine(med);
  setMedicineSearch(med.name);
  setPreviewScale(1);
  setShowMedDropdown(false);
};

  const clearMedicine = () => {
    setSelectedMedicine(null);
    setMedicineSearch("");
    setShowMedDropdown(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  const handleVerify = async () => {
    if (!barcodeInput.trim()) {
      showToast("Enter a barcode", "error");
      return;
    }
    setVerifying(true);
    try {
      const res = await verifyBarcode(barcodeInput.trim());
      const data = res.data.data || res.data;
      if (data) {
        setVerifiedMedicine(data);
        setVerificationResult("verified");
        showToast("Medicine Verified", "success");
      } else {
        setVerificationResult("notfound");
        showToast("Medicine not found", "error");
      }
    } catch {
      try {
        const res2 = await searchByBarcode(barcodeInput.trim());
        const data2 = res2.data.data || res2.data;
        const med = Array.isArray(data2) ? data2[0] : data2;
        if (med) {
          setVerifiedMedicine(med);
          setVerificationResult("verified");
          showToast("Medicine Verified", "success");
        } else {
          setVerificationResult("notfound");
          showToast("Medicine not found", "error");
        }
      } catch {
        setVerificationResult("notfound");
        showToast("Medicine not found", "error");
      }
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
  if (activeTab !== "history") return;

  let mounted = true;

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);

      const res = await getBarcodes({ limit: 50 });

      if (!mounted) return;

      const data = res.data.data || res.data;

      setScanHistory(
        Array.isArray(data) ? data : []
      );
    } catch {
      if (mounted) {
        setScanHistory([]);
      }
    } finally {
      if (mounted) {
        setHistoryLoading(false);
      }
    }
  };

  loadHistory();

  return () => {
    mounted = false;
  };
}, [activeTab]);

  const handlePrintLabels = async () => {
    if (!selectedMedicine) {
      showToast("Select a medicine first", "error");
      return;
    }
    setIsPrinting(true);
    try {
      const templateInfo = LABEL_TEMPLATES[template] || LABEL_TEMPLATES.Standard;
      const labelItem = selectedMedicine;
      const expiryStr = labelItem.expiryDate
        ? new Date(labelItem.expiryDate).toLocaleDateString("en-IN", {
            month: "2-digit",
            year: "2-digit",
          })
        : "—";

      const labelHtml = `
        <html>
          <head>
            <title>Print Label — ${labelItem.name}</title>
            <style>
              @page {
                size: ${templateInfo.width}mm ${templateInfo.height}mm;
                margin: 0;
              }
              * { box-sizing: border-box; margin: 0; padding: 0; }
              body {
                width: ${templateInfo.width}mm;
                height: ${templateInfo.height}mm;
                font-family: 'Courier New', monospace;
                padding: 4px;
                display: flex;
                flex-direction: column;
                justify-content: center;
              }
              .name { font-size: 11px; font-weight: bold; }
              .generic { font-size: 8px; color: #555; }
              .meta { font-size: 8px; display: flex; justify-content: space-between; margin-top: 2px; }
              .mrp { font-size: 9px; font-weight: bold; margin-top: 2px; }
              .barcode { margin-top: 2px; height: 18px; width: 100%; }
              .qr-code { position: absolute; bottom: 2px; right: 2px; width: 18px; height: 18px; border: 1px solid black; display: flex; align-items: center; justify-content: center; font-size: 6px; }
            </style>
          </head>
          <body>
            ${labelFields.medName ? `<div class="name">${labelItem.name}</div>` : ""}
            ${labelFields.generic ? `<div class="generic">(${labelItem.genericName || labelItem.name})</div>` : ""}
            ${labelFields.batch || labelFields.expiry ? `<div class="meta">${labelFields.batch ? `Batch: ${labelItem.batchNumber || "—"}` : ""}${labelFields.expiry ? ` Exp: ${expiryStr}` : ""}</div>` : ""}
            ${labelFields.mrp ? `<div class="mrp">MRP: ₹${(labelItem.mrp || 0).toFixed(2)}/tab</div>` : ""}
            ${labelFields.barcode ? `<div class="barcode"><svg viewBox="0 0 100 18" preserveAspectRatio="none" style="width:100%;height:100%">${Array.from({ length: 30 }, (_, i) => `<rect x="${i * 3.3}" y="0" width="${(i * 7) % 10 > 4 ? 1 : 2}" height="18" fill="black" />`).join("")}</svg></div>` : ""}
            ${labelFields.qr ? `<div class="qr-code">QR</div>` : ""}
          </body>
        </html>
      `;

      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        showToast("Pop-up blocked. Please allow pop-ups.", "error");
        setIsPrinting(false);
        return;
      }
      const allLabels = Array.from({ length: labelQty }, () => labelHtml).join(
        '<div style="page-break-after: always;"></div>',
      );
      printWindow.document.write(allLabels);
      printWindow.document.close();
      printWindow.focus();
      printWindow.onafterprint = () => {
        printWindow.close();
        setIsPrinting(false);
      };
      setTimeout(() => {
        printWindow.print();
        showToast(`Printing ${labelQty} labels...`, "success");
      }, 500);
    } catch (err) {
      console.error("Print error:", err);
      showToast("Print failed: " + err.message, "error");
      setIsPrinting(false);
    }
  };

  const handlePreview = () => {
    if (!selectedMedicine) {
      showToast("Select a medicine first", "error");
      return;
    }
    const previewPanel = document.querySelector(".label-preview-panel");
    if (previewPanel) {
      previewPanel.scrollIntoView({ behavior: "smooth", block: "center" });
      showToast(`Previewing: ${selectedMedicine.name}`, "success");
    }
  };

  const handleDownloadScanLog = () => {
    if (scanHistory.length === 0) {
      showToast("No scan history to download", "error");
      return;
    }
    setIsDownloading(true);
    try {
      const headers = [
        "Date/Time",
        "Barcode",
        "Medicine Matched",
        "Action Taken",
        "Result",
      ];
      const rows = scanHistory.map((h) => [
        h.createdAt ? new Date(h.createdAt).toLocaleString() : "—",
        h.barcode || h.code || "—",
        h.medicineName || "—",
        (h.action || "SCAN").toUpperCase(),
        h.verified ? "VERIFIED" : "NOT FOUND",
      ]);
      const csvContent = [
        headers.join(","),
        ...rows.map((r) =>
          r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","),
        ),
      ].join("\n");
      const blob = new Blob(["\uFEFF" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `scan-log-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      showToast("Scan log downloaded", "success");
    } catch (err) {
      console.error("Download error:", err);
      showToast("Download failed: " + err.message, "error");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSaveScannerSettings = () => {
    setIsSaving(true);
    try {
      const settings = {
        scannerType: "USB",
        formats: ["EAN-13", "EAN-8", "QR Code", "Code 128", "Code 39", "UPC-A"],
        autoAddToBill: true,
        beepOnScan: true,
        vibrateOnScan: false,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem("barcode_scanner_settings", JSON.stringify(settings));
      setTimeout(() => {
        showToast("Scanner settings saved successfully", "success");
        setIsSaving(false);
      }, 600);
    } catch (err) {
      console.error("Save error:", err);
      showToast("Failed to save settings", "error");
      setIsSaving(false);
    }
  };

  const isExpiringSoon =
    verifiedMedicine?.expiryDate &&
    new Date(verifiedMedicine.expiryDate) <
      new Date(new Date().setDate(new Date().getDate() + 30));

  return (
    <div className="barcode-container">
      <div className="purchases-header">
        <div>
          <h1
            style={{ fontFamily: "Outfit", fontSize: "28px", fontWeight: 700 }}
          >
            Barcode & QR Ecosystem
          </h1>
          <p className="result-meta">
            Label printing, medicine verification, and scanner integration.
          </p>
          <div className="purchases-tabs">
            {["Labels", "Verify", "Settings", "History"].map((t) => (
              <button
                key={t}
                className={`p-tab ${activeTab === t.toLowerCase() ? "active" : ""}`}
                onClick={() => setActiveTab(t.toLowerCase())}
              >
                {t === "Labels"
                  ? "Label Printing"
                  : t === "Verify"
                    ? "QR Verification"
                    : t === "Settings"
                      ? "Scanner Settings"
                      : "Scan History"}
              </button>
            ))}
          </div>
        </div>
        <div className="header-actions">
          <button
            className="pos-btn outline"
            onClick={() => setActiveTab("labels")}
          >
            <Printer size={16} /> Print Labels
          </button>
          <button
            className="pos-btn teal"
            onClick={() => setActiveTab("verify")}
          >
            <Scan size={18} /> Quick Scan
          </button>
        </div>
      </div>

      <div className="barcode-features-grid">
        <div className="feature-overview-card">
          <div
            className="feature-icon-circle"
            style={{
              background: "var(--primary-glow)",
              color: "var(--primary)",
            }}
          >
            <QrCode size={24} />
          </div>
          <div style={{ fontWeight: 700 }}>QR Verification</div>
          <p className="result-meta" style={{ fontSize: "13px" }}>
            Scan any medicine QR to verify authenticity and view details.
          </p>
          <button
            className="pos-btn teal"
            style={{ width: "100%" }}
            onClick={() => setActiveTab("verify")}
          >
            Scan QR Code
          </button>
        </div>
        <div className="feature-overview-card">
          <div
            className="feature-icon-circle"
            style={{
              background: "rgba(59, 130, 246, 0.1)",
              color: "var(--info)",
            }}
          >
            <Printer size={24} />
          </div>
          <div style={{ fontWeight: 700 }}>Label Printing</div>
          <p className="result-meta" style={{ fontSize: "13px" }}>
            Generate and print barcode labels for any medicine or batch.
          </p>
          <button
            className="pos-btn outline"
            style={{
              width: "100%",
              borderColor: "var(--info)",
              color: "var(--info)",
            }}
            onClick={() => setActiveTab("labels")}
          >
            Print Labels
          </button>
        </div>
        <div className="feature-overview-card">
          <div
            className="feature-icon-circle"
            style={{
              background: scannerConnected
                ? "rgba(10, 185, 129, 0.1)"
                : "rgba(239, 68, 68, 0.1)",
              color: scannerConnected ? "var(--success)" : "var(--danger)",
            }}
          >
            {scannerConnected ? <ShieldCheck size={24} /> : <Zap size={24} />}
          </div>
          <div style={{ fontWeight: 700 }}>Scanner Status</div>
          <p className="result-meta" style={{ fontSize: "13px" }}>
            {scannerConnected
              ? "USB Scanner Connected — Ready to use"
              : "No Scanner Detected — Connect device"}
          </p>
          <button
            className="pos-btn outline"
            style={{ width: "100%" }}
            onClick={() => setActiveTab("settings")}
          >
            Configure Scanner
          </button>
        </div>
      </div>

      {activeTab === "labels" && (
        <>
          <div className="label-print-panels">
            <div className="label-config-panel">
              <div className="pos-card">
                <div style={{ fontWeight: 700, marginBottom: "16px" }}>
                  Label Configuration
                </div>
                <div
                  className="pos-input-group"
                  style={{ marginBottom: "20px" }}
                  ref={dropdownRef}
                >
                  <label className="p-label">SEARCH MEDICINE</label>
                  <div
                    style={{ position: "relative" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        background: "var(--surface-container)",
                        border: `1px solid ${selectedMedicine ? "var(--primary)" : "var(--outline-variant)"}`,
                        borderRadius: "12px",
                        padding: "8px 12px",
                        gap: "8px",
                        cursor: "pointer",
                        transition: "border-color 0.2s",
                      }}
                      onClick={() => {
                        setShowMedDropdown(!showMedDropdown);
                        if (!showMedDropdown) {
                          setTimeout(() => searchInputRef.current?.focus(), 50);
                        }
                      }}
                    >
                      <Search size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                      {selectedMedicine && !showMedDropdown ? (
                        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: "14px", lineHeight: 1.3 }}>
                              {selectedMedicine.name}
                            </div>
                            <div style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.2 }}>
                              Batch: {selectedMedicine.batchNumber || "—"} · ₹{(selectedMedicine.mrp || 0).toFixed(2)}
                            </div>
                          </div>
                          <button
                            className="micro-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              clearMedicine();
                            }}
                            title="Clear selection"
                            style={{ flexShrink: 0, width: "24px", height: "24px" }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <input
                          ref={searchInputRef}
                          type="text"
                          placeholder="Type to search medicines..."
                          value={medicineSearch}
                          onChange={(e) => {
                            setMedicineSearch(e.target.value);
                            if (!showMedDropdown) setShowMedDropdown(true);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") setShowMedDropdown(false);
                          }}
                          style={{
                            flex: 1,
                            background: "none",
                            border: "none",
                            outline: "none",
                            color: "var(--text)",
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: "14px",
                            width: "100%",
                          }}
                        />
                      )}
                      <ChevronDown
                        size={16}
                        style={{
                          color: "var(--text-muted)",
                          flexShrink: 0,
                          transform: showMedDropdown ? "rotate(180deg)" : "rotate(0deg)",
                          transition: "transform 0.2s",
                        }}
                      />
                    </div>

                    {/* Dropdown */}
                    {showMedDropdown && (
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          marginTop: "4px",
                          background: "var(--surface)",
                          border: "1px solid var(--outline-variant)",
                          borderRadius: "12px",
                          maxHeight: "280px",
                          overflow: "auto",
                          zIndex: 100,
                          boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
                        }}
                      >
                        {filteredMedicines.length === 0 ? (
                          <div
                            style={{
                              padding: "20px",
                              textAlign: "center",
                              color: "var(--text-muted)",
                              fontSize: "13px",
                            }}
                          >
                            No medicines found
                          </div>
                        ) : (
                          filteredMedicines.map((m) => {
                            const isSelected = selectedMedicine?.id === m.id;
                            const mfgName = m.manufacturer?.name || m.manufacturer || "";

                            return (
                              <div
                                key={m.id}
                                onClick={() => selectMedicine(m)}
                                style={{
                                  padding: "10px 14px",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "12px",
                                  borderBottom: "1px solid var(--overlay-05)",
                                  background: isSelected ? "rgba(79, 219, 200, 0.08)" : "transparent",
                                  transition: "background 0.15s",
                                }}
                                onMouseEnter={(e) => {
                                  if (!isSelected) e.currentTarget.style.background = "var(--overlay-03)";
                                }}
                                onMouseLeave={(e) => {
                                  if (!isSelected) e.currentTarget.style.background = "transparent";
                                }}
                              >
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: 700, fontSize: "13px" }}>
                                    {m.name}
                                  </div>
                                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                                    Batch: {m.batchNumber || "—"} · ₹{(m.mrp || 0).toFixed(2)} · {mfgName}
                                  </div>
                                </div>
                                <div style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "right" }}>
                                  <div>Qty: {m.stock ?? 0}</div>
                                  {m.expiryDate && (
                                    <div style={{ color: new Date(m.expiryDate) < new Date() ? "var(--danger)" : "inherit" }}>
                                      Exp: {new Date(m.expiryDate).toLocaleDateString("en-IN", { month: "short", year: "2-digit" })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                        {medicines.length > 0 && (
                          <div
                            style={{
                              padding: "8px 14px",
                              fontSize: "10px",
                              color: "var(--text-muted)",
                              textAlign: "center",
                              borderTop: "1px solid var(--overlay-05)",
                            }}
                          >
                            {filteredMedicines.length} of {medicines.length} medicines shown
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div
                  className="pos-input-group"
                  style={{ marginBottom: "20px" }}
                >
                  <label className="p-label">TEMPLATE SELECTOR</label>
                  <div
                    className="purchases-tabs"
                    style={{ background: "none", border: "none", padding: 0 }}
                  >
                    {["Standard", "Large", "Strip", "Custom"].map((t) => (
                      <button
                        key={t}
                        className={`p-tab ${template === t ? "active" : ""}`}
                        onClick={() => setTemplate(t)}
                        title={LABEL_TEMPLATES[t]?.desc || ""}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <div
                    className="result-meta"
                    style={{ fontSize: "11px", marginTop: "6px" }}
                  >
                    {LABEL_TEMPLATES[template]?.desc || "Standard template"}
                  </div>
                </div>
                <div
                  className="pos-input-group"
                  style={{ marginBottom: "20px" }}
                >
                  <label className="p-label">CONTENT FIELDS</label>
                  <div className="format-checkboxes">
                    {Object.keys(labelFields).map((k) => (
                      <label key={k} className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={labelFields[k]}
                          onChange={(e) =>
                            setLabelFields({
                              ...labelFields,
                              [k]: e.target.checked,
                            })
                          }
                        />
                        {k.charAt(0).toUpperCase() +
                          k.slice(1).replace(/([A-Z])/g, " $1")}
                      </label>
                    ))}
                  </div>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "20px",
                  }}
                >
                  <div className="pos-input-group">
                    <label className="p-label">QUANTITY</label>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <button
                        className="micro-btn"
                        onClick={() => setLabelQty(Math.max(1, labelQty - 1))}
                      >
                        <Minus size={16} />
                      </button>
                      <b style={{ minWidth: "30px", textAlign: "center" }}>
                        {labelQty}
                      </b>
                      <button
                        className="micro-btn"
                        onClick={() => setLabelQty(labelQty + 1)}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="pos-input-group">
                    <label className="p-label">PRINTER</label>
                    <select className="pos-input">
                      <option>HP LaserJet (Default)</option>
                      <option>TSC Label Printer</option>
                    </select>
                  </div>
                </div>
                <div
                  style={{ display: "flex", gap: "12px", marginTop: "24px" }}
                >
                  <button
                    className="pos-btn outline"
                    style={{ flex: 1 }}
                    onClick={handlePreview}
                  >
                    Preview
                  </button>
                  <button
                    className="pos-btn teal"
                    style={{ flex: 2 }}
                    onClick={handlePrintLabels}
                    disabled={isPrinting || !selectedMedicine}
                  >
                    {isPrinting ? (
                      <>
                        <Spinner size={16} /> Printing...
                      </>
                    ) : (
                      <>
                        <Printer size={18} /> Print Now
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
            <div className="label-preview-panel">
              <div className="pos-card" style={{ textAlign: "center" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "20px",
                  }}
                >
                  <div style={{ fontWeight: 700 }}>Label Preview</div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {[0.5, 0.75, 1].map((s) => (
                      <button
                        key={s}
                        className={`micro-btn ${previewScale === s ? "active" : ""}`}
                        style={{ fontSize: "10px", padding: "4px 8px" }}
                        onClick={() => setPreviewScale(s)}
                      >
                        {s * 100}%
                      </button>
                    ))}
                  </div>
                </div>
                <div
                  style={{
                    transform: `scale(${previewScale})`,
                    transition: "0.2s",
                  }}
                >
                  {selectedMedicine ? (
                    <div className="label-preview-sticker">
                      {labelFields.medName && (
                        <div className="label-med-name">
                          {selectedMedicine.name}
                        </div>
                      )}
                      {labelFields.generic && (
                        <div className="label-generic">
                          ({selectedMedicine.genericName || selectedMedicine.name})
                        </div>
                      )}
                      <div className="label-meta">
                        {labelFields.batch && (
                          <span>Batch: {selectedMedicine.batchNumber || "—"}</span>
                        )}
                        {labelFields.expiry && (
                          <span style={{ color: "var(--danger)" }}>
                            Exp:{" "}
                            {selectedMedicine.expiryDate
                              ? new Date(
                                  selectedMedicine.expiryDate,
                                ).toLocaleDateString("en-IN", {
                                  month: "2-digit",
                                  year: "2-digit",
                                })
                              : "—"}
                          </span>
                        )}
                      </div>
                      {labelFields.mrp && (
                        <div className="label-mrp">
                          MRP: ₹{(selectedMedicine.mrp || 0).toFixed(2)}/tab
                        </div>
                      )}
                      {labelFields.barcode && (
                        <div className="label-barcode">
                          <svg
                            viewBox="0 0 100 20"
                            preserveAspectRatio="none"
                            style={{ width: "100%", height: "100%" }}
                          >
                            {[...Array(30)].map((_, i) => (
                              <rect
                                key={i}
                                x={i * 3.3}
                                y="0"
                                width={(i * 7) % 10 > 4 ? 1 : 2}
                                height="20"
                                fill="black"
                              />
                            ))}
                          </svg>
                        </div>
                      )}
                      {labelFields.qr && (
                        <div
                          className="label-qr"
                          style={{ border: "2px solid black", padding: "2px" }}
                        >
                          <QrCode size={24} color="black" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className="label-preview-sticker"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "var(--overlay-02)",
                        border: "2px dashed var(--outline-variant)",
                        color: "var(--text-muted)",
                      }}
                    >
                      <div style={{ textAlign: "center" }}>
                        <Printer size={28} style={{ opacity: 0.3, marginBottom: "8px" }} />
                        <div style={{ fontSize: "12px", fontWeight: 600 }}>
                          No Medicine Selected
                        </div>
                        <div style={{ fontSize: "10px", marginTop: "4px" }}>
                          Search and select a medicine above
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <p
                  className="result-meta"
                  style={{ marginTop: "24px", fontSize: "12px" }}
                >
                  Labels are print-ready. Optimized for 38×25mm thermal
                  stickers.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === "verify" && (
        <>
          <div className="scanner-view-card">
            <div className="camera-frame">
              <div className="scanner-laser-line" />
              <Scan size={48} color="var(--primary)" style={{ opacity: 0.5 }} />
              <span className="result-meta">Point camera at QR or barcode</span>
              <button
                className="pos-btn outline"
                style={{
                  position: "absolute",
                  bottom: "20px",
                  background: "rgba(0,0,0,0.5)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <Camera size={16} /> Use Rear Camera
              </button>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
                width: "100%",
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: "1px",
                  background: "var(--outline-variant)",
                }}
              />
              <span
                className="result-meta"
                style={{ fontSize: "11px", fontWeight: 800 }}
              >
                OR ENTER MANUALLY
              </span>
              <div
                style={{
                  flex: 1,
                  height: "1px",
                  background: "var(--outline-variant)",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: "12px", width: "100%" }}>
              <input
                className="pos-input"
                style={{ flex: 1 }}
                placeholder="Enter 13-digit barcode..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleVerify();
                }}
              />
              <button
                className="pos-btn teal"
                onClick={handleVerify}
                disabled={verifying}
              >
                {verifying ? (
                  <>
                    <Spinner size={16} /> Verifying...
                  </>
                ) : (
                  "Verify"
                )}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {verificationResult === "verified" && verifiedMedicine && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="verify-result-card"
                style={{ borderLeft: "4px solid var(--success)" }}
              >
                <div className="verify-result-header">
                  <CheckCircle2 size={24} color="var(--success)" />
                  <span
                    style={{
                      fontFamily: "Outfit",
                      fontWeight: 600,
                      fontSize: "15px",
                    }}
                  >
                    VERIFIED — Medicine Found
                  </span>
                </div>
                <div className="verify-result-body">
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "24px",
                    }}
                  >
                    <div>
                      <div className="p-label">NAME</div>
                      <div style={{ fontWeight: 700 }}>
                        {verifiedMedicine.name}
                      </div>
                    </div>
                    <div>
                      <div className="p-label">GENERIC</div>
                      <div style={{ fontWeight: 700 }}>
                        {verifiedMedicine.genericName || "—"}
                      </div>
                    </div>
                    <div>
                      <div className="p-label">BATCH / EXPIRY</div>
                      <div style={{ fontWeight: 700 }}>
                        {verifiedMedicine.batchNumber || "—"} /{" "}
                        {verifiedMedicine.expiryDate
                          ? new Date(
                              verifiedMedicine.expiryDate,
                            ).toLocaleDateString("en-IN", {
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </div>
                      {isExpiringSoon && (
                        <div
                          style={{
                            color: "var(--warning)",
                            fontSize: "12px",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            marginTop: "4px",
                          }}
                        >
                          <AlertTriangle size={12} /> Expiring soon
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="p-label">STOCK</div>
                      <div style={{ fontWeight: 700 }}>
                        {verifiedMedicine.stock || 0} units (MRP: ₹
                        {(verifiedMedicine.mrp || 0).toFixed(2)})
                      </div>
                    </div>
                  </div>
                  <div
                    style={{ display: "flex", gap: "12px", marginTop: "12px" }}
                  >
                    <button
                      className="pos-btn teal"
                      style={{ flex: 1 }}
                      onClick={() => navigate("/billing")}
                    >
                      Add to Bill →
                    </button>
                    <button className="pos-btn outline" style={{ flex: 1 }}>
                      View Full Details
                    </button>
                    <button className="pos-btn outline">
                      <Printer size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
            {verificationResult === "notfound" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="verify-result-card"
                style={{ borderLeft: "4px solid var(--danger)" }}
              >
                <div className="verify-result-header">
                  <XCircle size={24} color="var(--danger)" />
                  <span
                    style={{
                      fontFamily: "Outfit",
                      fontWeight: 600,
                      fontSize: "15px",
                    }}
                  >
                    NOT FOUND — Barcode not registered
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {activeTab === "settings" && (
        <div className="pos-card">
          <div className="pos-card-title">Scanner Settings</div>
          <div className="settings-control-grid" style={{ marginTop: "24px" }}>
            <div className="config-section">
              <div className="p-label">SCANNER TYPE</div>
              <div
                className="purchases-tabs"
                style={{ background: "none", border: "none", padding: 0 }}
              >
                {["USB", "Bluetooth", "Camera"].map((t) => (
                  <button
                    key={t}
                    className={`p-tab ${t === "USB" ? "active" : ""}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div
                className="pos-card"
                style={{ background: "var(--overlay-02)", marginTop: "20px" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        background: "var(--success)",
                        borderRadius: "50%",
                      }}
                    />
                    <span style={{ fontWeight: 700 }}>MAGTEC USB Scanner</span>
                  </div>
                  <button className="micro-btn">
                    <RefreshCw size={14} />
                  </button>
                </div>
                <div
                  className="result-meta"
                  style={{ marginTop: "12px", fontSize: "12px" }}
                >
                  Port: COM3 | Baud: 9600
                </div>
                <button
                  className="pos-btn outline"
                  style={{ width: "100%", marginTop: "16px", fontSize: "12px" }}
                  onClick={() => showToast("Scanner test initiated", "info")}
                >
                  Test Scanner
                </button>
              </div>
            </div>
            <div className="config-section">
              <div className="p-label">FORMATS & PREFIX</div>
              <div className="format-checkboxes">
                {[
                  "EAN-13",
                  "EAN-8",
                  "QR Code",
                  "Code 128",
                  "Code 39",
                  "UPC-A",
                ].map((f) => (
                  <label key={f} className="checkbox-item">
                    <input type="checkbox" defaultChecked /> {f}
                  </label>
                ))}
              </div>
              <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
                <div className="pos-input-group" style={{ flex: 1 }}>
                  <label className="p-label">PREFIX TO STRIP</label>
                  <input className="pos-input" placeholder="e.g. GS1" />
                </div>
                <div className="pos-input-group" style={{ flex: 1 }}>
                  <label className="p-label">SUFFIX TO STRIP</label>
                  <input className="pos-input" />
                </div>
              </div>
            </div>
          </div>
          <div
            className="config-section"
            style={{
              marginTop: "24px",
              borderTop: "1px solid var(--outline-variant)",
              paddingTop: "24px",
            }}
          >
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <label className="checkbox-item">
                <input type="checkbox" defaultChecked /> Auto-add scanned
                medicine to bill (in /billing screen)
              </label>
              <label className="checkbox-item">
                <input type="checkbox" defaultChecked /> Beep sound on
                successful scan
              </label>
              <label className="checkbox-item">
                <input type="checkbox" /> Vibrate (mobile only)
              </label>
            </div>
            <button
              className="pos-btn teal"
              style={{ marginTop: "24px" }}
              onClick={handleSaveScannerSettings}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Spinner size={16} /> Saving...
                </>
              ) : (
                "Save Scanner Settings"
              )}
            </button>
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className="purchase-table-card">
          <table className="purchase-table">
            <thead>
              <tr>
                <th>Date/Time</th>
                <th>Barcode</th>
                <th>Medicine Matched</th>
                <th>Action Taken</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {historyLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      textAlign: "center",
                      padding: "40px",
                      color: "var(--text-dim)",
                    }}
                  >
                    <Spinner size={20} /> Loading scan history...
                  </td>
                </tr>
              ) : scanHistory.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      textAlign: "center",
                      padding: "40px",
                      color: "var(--text-dim)",
                    }}
                  >
                    No scan history available
                  </td>
                </tr>
              ) : (
                scanHistory.map((h, i) => (
                  <tr key={h._id || i}>
                    <td>
                      {h.createdAt
                        ? new Date(h.createdAt).toLocaleString()
                        : "—"}
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      {h.barcode || h.code || "—"}
                    </td>
                    <td>{h.medicineName || "—"}</td>
                    <td>
                      <span
                        className={`p-status ${(h.action || "").includes("BILL") ? "paid" : ""}`}
                        style={{ fontSize: "10px" }}
                      >
                        {(h.action || "SCAN").toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`p-status ${h.verified ? "success" : "danger"}`}
                      >
                        {h.verified ? "VERIFIED" : "NOT FOUND"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div style={{ padding: "16px" }}>
            <button
              className="pos-btn outline"
              onClick={handleDownloadScanLog}
              disabled={isDownloading || scanHistory.length === 0}
            >
              {isDownloading ? (
                <>
                  <Spinner size={14} /> Downloading...
                </>
              ) : (
                <>
                  <Download size={16} /> Download Scan Log
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
