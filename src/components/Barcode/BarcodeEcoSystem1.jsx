import {
  Printer,
  Scan,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Camera,
  Download,
} from "lucide-react";
import { AnimatePresence, m } from "framer-motion";
import { TableHeader } from "../common/TableHeader.jsx";
import "../../styles/BarcodeEcosystem.css";

function Spinner({ size = 14 }) {
  return (
    <Loader2
      size={size}
      style={{
        animation: "spin 0.8s linear infinite",
      }}
    />
  );
}

export function BarcodeEcosystemSection3({
  setBarcodeInput,
  handleVerify,
  navigate,
  activeTab,
  barcodeInput,
  verifying,
  verificationResult,
  verifiedMedicine,
  isExpiringSoon,
}) {
  return (
    activeTab === "verify" && (
      <>
        <div className="scanner-view-card">
          <div className="camera-frame">
            <div className="scanner-laser-line" />
            <Scan
              size={48}
              color="var(--primary)"
              style={{
                opacity: 0.5,
              }}
            />
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
              style={{
                fontSize: "11px",
                fontWeight: 800,
              }}
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
          <div
            style={{
              display: "flex",
              gap: "12px",
              width: "100%",
            }}
          >
            <>
              <label htmlFor="field_y9av72" className="sr-only">
                Enter 13-digit barcode...
              </label>
              <input
                required
                className="pos-input"
                style={{
                  flex: 1,
                }}
                placeholder="Enter 13-digit barcode..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleVerify();
                }}
                id="field_y9av72"
              />
            </>
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
            <m.div
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="verify-result-card"
              style={{
                borderLeft: "4px solid var(--success)",
              }}
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
                    <div
                      style={{
                        fontWeight: 700,
                      }}
                    >
                      {verifiedMedicine.name}
                    </div>
                  </div>
                  <div>
                    <div className="p-label">GENERIC</div>
                    <div
                      style={{
                        fontWeight: 700,
                      }}
                    >
                      {verifiedMedicine.genericName || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="p-label">BATCH / EXPIRY</div>
                    <div
                      style={{
                        fontWeight: 700,
                      }}
                    >
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
                    <div
                      style={{
                        fontWeight: 700,
                      }}
                    >
                      {verifiedMedicine.stock || 0} units (MRP: ₹
                      {(verifiedMedicine.mrp || 0).toFixed(2)})
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    marginTop: "12px",
                  }}
                >
                  <button
                    className="pos-btn teal"
                    style={{
                      flex: 1,
                    }}
                    onClick={() => navigate("/billing")}
                  >
                    Add to Bill →
                  </button>
                  <button
                    className="pos-btn outline"
                    style={{
                      flex: 1,
                    }}
                  >
                    View Full Details
                  </button>
                  <button className="pos-btn outline" aria-label="Print label">
                    <Printer size={16} />
                  </button>
                </div>
              </div>
            </m.div>
          )}
          {verificationResult === "notfound" && (
            <m.div
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="verify-result-card"
              style={{
                borderLeft: "4px solid var(--danger)",
              }}
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
            </m.div>
          )}
        </AnimatePresence>
      </>
    )
  );
}
export function BarcodeEcosystemSection4({
  showToast,
  activeTab,
  handleSaveScannerSettings,
  isSaving,
}) {
  return (
    activeTab === "settings" && (
      <div className="pos-card">
        <div className="pos-card-title">Scanner Settings</div>
        <div
          className="settings-control-grid"
          style={{
            marginTop: "24px",
          }}
        >
          <div className="config-section">
            <div className="p-label">SCANNER TYPE</div>
            <div
              className="purchases-tabs"
              style={{
                background: "none",
                border: "none",
                padding: 0,
              }}
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
              style={{
                background: "var(--overlay-02)",
                marginTop: "20px",
              }}
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
                  <span
                    style={{
                      fontWeight: 700,
                    }}
                  >
                    MAGTEC USB Scanner
                  </span>
                </div>
                <button
                  className="micro-btn"
                  aria-label="Refresh scanner connection"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
              <div
                className="result-meta"
                style={{
                  marginTop: "12px",
                  fontSize: "12px",
                }}
              >
                Port: COM3 | Baud: 9600
              </div>
              <button
                className="pos-btn outline"
                style={{
                  width: "100%",
                  marginTop: "16px",
                  fontSize: "12px",
                }}
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
                  <input required type="checkbox" defaultChecked /> {f}
                </label>
              ))}
            </div>
            <div
              style={{
                display: "flex",
                gap: "12px",
                marginTop: "20px",
              }}
            >
              <div
                className="pos-input-group"
                style={{
                  flex: 1,
                }}
              >
                <label htmlFor="field_kbgipa" className="p-label">
                  PREFIX TO STRIP
                </label>
                <input
                  id="field_kbgipa"
                  required
                  className="pos-input"
                  placeholder="e.g. GS1"
                />
              </div>
              <div
                className="pos-input-group"
                style={{
                  flex: 1,
                }}
              >
                <label htmlFor="field_53p36d" className="p-label">
                  SUFFIX TO STRIP
                </label>
                <input id="field_53p36d" required className="pos-input" />
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
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <label className="checkbox-item">
              <input required type="checkbox" defaultChecked /> Auto-add scanned
              medicine to bill (in /billing screen)
            </label>
            <label className="checkbox-item">
              <input required type="checkbox" defaultChecked /> Beep sound on
              successful scan
            </label>
            <label className="checkbox-item">
              <input required type="checkbox" /> Vibrate (mobile only)
            </label>
          </div>
          <button
            className="pos-btn teal"
            style={{
              marginTop: "24px",
            }}
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
    )
  );
}
export function BarcodeEcosystemSection5({
  activeTab,
  historyLoading,
  scanHistory,
  handleDownloadScanLog,
  isDownloading,
}) {
  return (
    activeTab === "history" && (
      <div className="purchase-table-card">
        <table className="purchase-table">
          <TableHeader
            columns={[
              "Date/Time",
              "Barcode",
              "Medicine Matched",
              "Action Taken",
              "Result",
            ]}
          />
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
              scanHistory.map((h) => (
                <tr key={h.id || h._id}>
                  <td>
                    {h.createdAt ? new Date(h.createdAt).toLocaleString() : "—"}
                  </td>
                  <td
                    style={{
                      fontWeight: 700,
                    }}
                  >
                    {h.barcode || h.code || "—"}
                  </td>
                  <td>{h.medicineName || "—"}</td>
                  <td>
                    <span
                      className={`p-status ${(h.action || "").startsWith("BILL") ? "paid" : ""}`}
                      style={{
                        fontSize: "10px",
                      }}
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
        <div
          style={{
            padding: "16px",
          }}
        >
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
    )
  );
}
