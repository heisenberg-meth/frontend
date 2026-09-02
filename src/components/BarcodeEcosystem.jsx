import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Printer, Scan } from "lucide-react";
import {
  searchByBarcode,
  getMedicines,
  generateBarcode,
} from "../services/inventory.service";
import { getBarcodes, verifyBarcode } from "../services/reports.service";
import "../styles/BarcodeEcosystem.css";
import {
  BarcodeEcosystemSection1,
  BarcodeEcosystemSection2,
} from "./Barcode/BarcodeEcosystem.jsx";
import {
  BarcodeEcosystemSection3,
  BarcodeEcosystemSection4,
  BarcodeEcosystemSection5,
} from "./Barcode/BarcodeEcoSystem1.jsx";
const LABEL_TEMPLATES = {
  Standard: {
    width: 100,
    height: 50,
    scale: 1,
    desc: "38×25mm — Thermal Sticker",
  },
  Large: {
    width: 130,
    height: 70,
    scale: 1.3,
    desc: "50×35mm — Large Label",
  },
  Strip: {
    width: 160,
    height: 28,
    scale: 0.85,
    desc: "Strip Label (16×28mm)",
  },
  Custom: {
    width: 100,
    height: 50,
    scale: 1,
    desc: "Custom Configuration",
  },
};

export default function BarcodeEcosystem({ showToast }) {
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
    getMedicines({
      limit: 100,
    })
      .then((res) => {
        const responseData = res.data?.data || res.data;
        const list =
          responseData?.items ||
          responseData?.medicines ||
          (Array.isArray(responseData) ? responseData : []) ||
          [];
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
        const res = await getBarcodes({
          limit: 50,
        });
        if (!mounted) return;
        const data = res.data.data || res.data;
        setScanHistory(Array.isArray(data) ? data : []);
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
      const templateInfo =
        LABEL_TEMPLATES[template] || LABEL_TEMPLATES.Standard;
      const labelItem = selectedMedicine;
      const expiryStr = labelItem.expiryDate
        ? new Date(labelItem.expiryDate).toLocaleDateString("en-IN", {
            month: "2-digit",
            year: "2-digit",
          })
        : "—";
      let barcodeDataUri = "";
      if (labelFields.barcode) {
        try {
          const barcodeText =
            labelItem.barcode ||
            labelItem.sku ||
            labelItem.batchNumber ||
            labelItem.id.substring(0, 8);
          const res = await generateBarcode(barcodeText);
          const blob = new Blob([res.data], {
            type: res.headers["content-type"] || "image/png",
          });
          barcodeDataUri = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
        } catch (err) {
          console.error("Barcode fetch failed:", err);
        }
      }
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        showToast("Pop-up blocked. Please allow pop-ups.", "error");
        setIsPrinting(false);
        return;
      }
      const printDocument = printWindow.document;
      printDocument.title = `Print Label — ${String(labelItem.name)}`;
      const style = printDocument.createElement("style");
      style.textContent = `
      @page {
        size: ${templateInfo.width}mm ${templateInfo.height}mm;
        margin: 0;
      }

      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      body {
        font-family: 'Courier New', monospace;
        background: white;
      }

      .label {
        width: ${templateInfo.width}mm;
        height: ${templateInfo.height}mm;
        padding: 4px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        position: relative;
        page-break-after: always;
        break-after: page;
      }

      .label:last-child {
        page-break-after: auto;
        break-after: auto;
      }

      .name {
        font-size: 11px;
        font-weight: bold;
      }

      .generic {
        font-size: 8px;
        color: #555;
      }

      .meta {
        font-size: 8px;
        display: flex;
        justify-content: space-between;
        margin-top: 2px;
      }

      .mrp {
        font-size: 9px;
        font-weight: bold;
        margin-top: 2px;
      }

      .barcode {
        margin-top: 2px;
        height: 18px;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .barcode img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }

      .qr-code {
        position: absolute;
        bottom: 2px;
        right: 2px;
        width: 18px;
        height: 18px;
        border: 1px solid black;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 6px;
      }
    `;
      printDocument.head.appendChild(style);
      const createTextElement = (tagName, text, className) => {
        const element = printDocument.createElement(tagName);
        if (className) {
          element.className = className;
        }
        element.textContent = String(text);
        return element;
      };
      const createLabel = () => {
        const label = printDocument.createElement("div");
        label.className = "label";
        if (labelFields.medName) {
          label.appendChild(createTextElement("div", labelItem.name, "name"));
        }
        if (labelFields.generic) {
          label.appendChild(
            createTextElement(
              "div",
              `(${labelItem.genericName || labelItem.name})`,
              "generic",
            ),
          );
        }
        if (labelFields.batch || labelFields.expiry) {
          const meta = printDocument.createElement("div");
          meta.className = "meta";
          if (labelFields.batch) {
            meta.appendChild(
              createTextElement(
                "span",
                `Batch: ${labelItem.batchNumber || "—"}`,
              ),
            );
          }
          if (labelFields.expiry) {
            meta.appendChild(createTextElement("span", `Exp: ${expiryStr}`));
          }
          label.appendChild(meta);
        }
        if (labelFields.mrp) {
          label.appendChild(
            createTextElement(
              "div",
              `MRP: ₹${(labelItem.mrp || 0).toFixed(2)}/tab`,
              "mrp",
            ),
          );
        }
        if (labelFields.barcode) {
          const barcode = printDocument.createElement("div");
          barcode.className = "barcode";
          if (barcodeDataUri) {
            const image = printDocument.createElement("img");
            image.src = barcodeDataUri;
            image.alt = "Barcode";
            barcode.appendChild(image);
          } else {
            barcode.textContent = "Barcode Error";
          }
          label.appendChild(barcode);
        }
        if (labelFields.qr) {
          label.appendChild(createTextElement("div", "QR", "qr-code"));
        }
        return label;
      };
      for (let index = 0; index < labelQty; index += 1) {
        printDocument.body.appendChild(createLabel());
      }
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
      showToast(`Print failed: ${err.message}`, "error");
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
      previewPanel.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
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
      localStorage.removeItem("barcode_scanner_settings");
      localStorage.setItem(
        "barcode_scanner_settings:v1",
        JSON.stringify(settings),
      );
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
            style={{
              fontFamily: "Outfit",
              fontSize: "28px",
              fontWeight: 700,
            }}
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

      <BarcodeEcosystemSection1
        setActiveTab={setActiveTab}
        scannerConnected={scannerConnected}
      />

      <BarcodeEcosystemSection2
        activeTab={activeTab}
        setShowMedDropdown={setShowMedDropdown}
        showMedDropdown={showMedDropdown}
        searchInputRef={searchInputRef}
        clearMedicine={clearMedicine}
        setMedicineSearch={setMedicineSearch}
        selectedMedicine={selectedMedicine}
        selectMedicine={selectMedicine}
        template={template}
        setTemplate={setTemplate}
        labelFields={labelFields}
        setLabelFields={setLabelFields}
        setLabelQty={setLabelQty}
        previewScale={previewScale}
        setPreviewScale={setPreviewScale}
        medicineSearch={medicineSearch}
        filteredMedicines={filteredMedicines}
        medicines={medicines}
        dropdownRef={dropdownRef}
        labelQty={labelQty}
        handlePreview={handlePreview}
        handlePrintLabels={handlePrintLabels}
        isPrinting={isPrinting}
      />

      <BarcodeEcosystemSection3
        setBarcodeInput={setBarcodeInput}
        handleVerify={handleVerify}
        navigate={navigate}
        activeTab={activeTab}
        barcodeInput={barcodeInput}
        verifying={verifying}
        verificationResult={verificationResult}
        verifiedMedicine={verifiedMedicine}
        isExpiringSoon={isExpiringSoon}
      />

      <BarcodeEcosystemSection4
        showToast={showToast}
        activeTab={activeTab}
        handleSaveScannerSettings={handleSaveScannerSettings}
        isSaving={isSaving}
      />

      <BarcodeEcosystemSection5
        activeTab={activeTab}
        historyLoading={historyLoading}
        scanHistory={scanHistory}
        handleDownloadScanLog={handleDownloadScanLog}
        isDownloading={isDownloading}
      />
    </div>
  );
}
