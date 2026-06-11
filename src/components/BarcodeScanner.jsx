import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { ScanLine, X, Search, Package, AlertTriangle } from "lucide-react";
import api from "../api";
import { API_ROUTES } from "../constants/api.routes.js";

export default function BarcodeScanner({ onResult, onClose, showToast }) {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [manualCode, setManualCode] = useState("");
  const [lookupResult, setLookupResult] = useState(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const startScanner = async () => {
    try {
      setScanning(true);
      const scanner = new Html5Qrcode("barcode-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 150 }, aspectRatio: 1.777 },
        (decodedText) => {
          setResult(decodedText);
          scanner.stop().catch(() => {});
          setScanning(false);
          handleLookup(decodedText);
        },
        () => {},
      );
    } catch {
      setScanning(false);
      showToast?.("Camera access denied or unavailable", "error");
    }
  };

  const handleLookup = async (code) => {
    try {
      const res = await api.get(API_ROUTES.INVENTORY_SEARCH, {
        params: { q: code },
      });
      const medicines = res.data.medicines || res.data;
      if (medicines.length > 0) {
        setLookupResult({ found: true, medicine: medicines[0] });
      } else {
        setLookupResult({ found: false, code });
      }
    } catch {
      setLookupResult({ found: false, code });
    }
  };

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      setResult(manualCode.trim());
      handleLookup(manualCode.trim());
    }
  };

  return (
    <div className="clinical-modal-overlay" style={{ zIndex: 9999 }}>
      <div
        className="clinical-modal-box"
        style={{ maxWidth: 520, width: "95%" }}
      >
        <div className="modal-header-flex">
          <div className="title-area">
            <ScanLine size={24} style={{ color: "var(--primary)" }} />
            <div>
              <h4>Barcode / QR Scanner</h4>
              <p>Scan medicine barcode or enter code manually</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body-clinical" style={{ padding: "16px 0" }}>
          {/* Scanner Area */}
          <div
            id="barcode-reader"
            style={{
              width: "100%",
              minHeight: scanning ? 280 : 0,
              borderRadius: 12,
              overflow: "hidden",
              marginBottom: 16,
              background: "var(--bg-dark)",
              transition: "all 0.3s",
            }}
          />

          {!scanning && !result && (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <button
                onClick={startScanner}
                style={{
                  background: "var(--primary-glow)",
                  border: "1px solid rgba(79, 219, 200, 0.3)",
                  color: "var(--primary)",
                  padding: "14px 28px",
                  borderRadius: 12,
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  margin: "0 auto",
                }}
              >
                <ScanLine size={20} /> Launch Camera Scanner
              </button>

              <div
                style={{
                  margin: "20px 0",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    background: "var(--outline-variant)",
                  }}
                />
                <span
                  style={{
                    color: "var(--text-muted)",
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  OR ENTER MANUALLY
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    background: "var(--outline-variant)",
                  }}
                />
              </div>

              <form
                onSubmit={handleManualSearch}
                style={{ display: "flex", gap: 8 }}
              >
                <input
                  required
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Enter barcode, SKU, or batch number..."
                  style={{
                    flex: 1,
                    background: "var(--surface)",
                    border: "1px solid var(--outline-variant)",
                    borderRadius: 10,
                    padding: "12px 16px",
                    color: "var(--text)",
                    fontSize: 14,
                  }}
                />
                <button
                  type="submit"
                  style={{
                    background: "var(--primary)",
                    color: "var(--bg-dark)",
                    border: "none",
                    borderRadius: 10,
                    padding: "12px 20px",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  <Search size={18} />
                </button>
              </form>
            </div>
          )}

          {/* Lookup Result */}
          {lookupResult && (
            <div
              style={{
                marginTop: 16,
                padding: 20,
                borderRadius: 14,
                background: lookupResult.found
                  ? "rgba(79, 219, 200, 0.05)"
                  : "rgba(255, 180, 171, 0.05)",
                border: `1px solid ${lookupResult.found ? "var(--primary-glow)" : "rgba(255, 180, 171, 0.2)"}`,
              }}
            >
              {lookupResult.found ? (
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 12,
                    }}
                  >
                    <Package size={20} style={{ color: "var(--primary)" }} />
                    <span
                      style={{
                        fontWeight: 800,
                        color: "var(--text)",
                        fontSize: 16,
                      }}
                    >
                      Medicine Found!
                    </span>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                    }}
                  >
                    {[
                      ["Name", lookupResult.medicine.name],
                      ["Stock", `${lookupResult.medicine.quantity} units`],
                      ["Batch", lookupResult.medicine.batchNumber],
                      ["Expiry", lookupResult.medicine.expiry],
                      ["Price", `₹${lookupResult.medicine.price}`],
                      ["Supplier", lookupResult.medicine.supplier],
                    ].map(([label, val]) => (
                      <div key={label}>
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            color: "var(--text-muted)",
                            textTransform: "uppercase",
                          }}
                        >
                          {label}
                        </div>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: "var(--text)",
                          }}
                        >
                          {val || "N/A"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <AlertTriangle size={20} style={{ color: "var(--danger)" }} />
                  <div>
                    <p
                      style={{
                        fontWeight: 700,
                        color: "var(--text)",
                        margin: 0,
                      }}
                    >
                      No match found
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: "var(--text-muted)",
                        margin: 0,
                      }}
                    >
                      Code "{result}" not in inventory. Add it as a new item?
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer-flex">
          <button
            className="modal-btn-cancel"
            onClick={() => {
              setResult(null);
              setLookupResult(null);
            }}
          >
            Reset
          </button>
          {lookupResult?.found && (
            <button
              className="modal-btn-confirm"
              onClick={() => {
                onResult?.(lookupResult.medicine);
                onClose();
              }}
            >
              Select Medicine
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
