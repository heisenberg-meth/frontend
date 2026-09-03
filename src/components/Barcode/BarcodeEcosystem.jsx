import {
  Printer,
  QrCode,
  ShieldCheck,
  Zap,
  Loader2,
  Search,
  X,
  ChevronDown,
} from "lucide-react";
import "../../styles/BarcodeEcosystem.css";

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
export function BarcodeEcosystemSection1({ setActiveTab, scannerConnected }) {
  return (
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
        <div
          style={{
            fontWeight: 700,
          }}
        >
          QR Verification
        </div>
        <p
          className="result-meta"
          style={{
            fontSize: "13px",
          }}
        >
          Scan any medicine QR to verify authenticity and view details.
        </p>
        <button
          className="pos-btn teal"
          style={{
            width: "100%",
          }}
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
        <div
          style={{
            fontWeight: 700,
          }}
        >
          Label Printing
        </div>
        <p
          className="result-meta"
          style={{
            fontSize: "13px",
          }}
        >
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
        <div
          style={{
            fontWeight: 700,
          }}
        >
          Scanner Status
        </div>
        <p
          className="result-meta"
          style={{
            fontSize: "13px",
          }}
        >
          {scannerConnected
            ? "USB Scanner Connected — Ready to use"
            : "No Scanner Detected — Connect device"}
        </p>
        <button
          className="pos-btn outline"
          style={{
            width: "100%",
          }}
          onClick={() => setActiveTab("settings")}
        >
          Configure Scanner
        </button>
      </div>
    </div>
  );
}
function LabelPreviewPanel({
  previewScale,
  setPreviewScale,
  selectedMedicine,
  labelFields,
}) {
  return (
    <div className="label-preview-panel">
      <div
        className="pos-card"
        style={{
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              fontWeight: 700,
            }}
          >
            Label Preview
          </div>
          <div
            style={{
              display: "flex",
              gap: "8px",
            }}
          >
            {[0.5, 0.75, 1].map((s) => (
              <button
                key={s}
                className={`micro-btn ${previewScale === s ? "active" : ""}`}
                style={{
                  fontSize: "10px",
                  padding: "4px 8px",
                }}
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
            transition: "transform 0.2s",
          }}
        >
          {selectedMedicine ? (
            <div className="label-preview-sticker">
              {labelFields.medName && (
                <div className="label-med-name">{selectedMedicine.name}</div>
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
                  <span
                    style={{
                      color: "var(--danger)",
                    }}
                  >
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
                    style={{
                      width: "100%",
                      height: "100%",
                    }}
                  >
                    {[...Array(30)].map((_, i) => (
                      <rect
                        key={`barcode-bar-${i}`}
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
                  style={{
                    border: "2px solid black",
                    padding: "2px",
                  }}
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
              <div
                style={{
                  textAlign: "center",
                }}
              >
                <Printer
                  size={28}
                  style={{
                    opacity: 0.3,
                    marginBottom: "8px",
                  }}
                />
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  No Medicine Selected
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    marginTop: "4px",
                  }}
                >
                  Search and select a medicine above
                </div>
              </div>
            </div>
          )}
        </div>
        <p
          className="result-meta"
          style={{
            marginTop: "24px",
            fontSize: "12px",
          }}
        >
          Labels are print-ready. Optimized for 38×25mm thermal stickers.
        </p>
      </div>
    </div>
  );
}

function MedicineSearchSelector({
  dropdownRef,
  selectedMedicine,
  showMedDropdown,
  setShowMedDropdown,
  searchInputRef,
  clearMedicine,
  medicineSearch,
  setMedicineSearch,
  filteredMedicines,
  medicines,
  selectMedicine,
}) {
  return (
    <div
      className="pos-input-group"
      style={{
        marginBottom: "20px",
      }}
      ref={dropdownRef}
    >
      <span className="p-label">SEARCH MEDICINE</span>
      <div
        style={{
          position: "relative",
        }}
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
            transition: "border-color 0.2s",
          }}
        >
          <Search
            size={16}
            style={{
              color: "var(--text-muted)",
              flexShrink: 0,
            }}
          />
          {selectedMedicine && !showMedDropdown ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setShowMedDropdown(!showMedDropdown);
                  if (!showMedDropdown) {
                    setTimeout(() => searchInputRef.current?.focus(), 50);
                  }
                }}
                style={{
                  flex: 1,
                  background: "none",
                  border: "none",
                  padding: 0,
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "14px",
                    lineHeight: 1.3,
                  }}
                >
                  {selectedMedicine.name}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    lineHeight: 1.2,
                  }}
                >
                  Batch: {selectedMedicine.batchNumber || "—"} · ₹
                  {(selectedMedicine.mrp || 0).toFixed(2)}
                </div>
              </button>
              <button
                aria-label="Clear selection"
                className="micro-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  clearMedicine();
                }}
                title="Clear selection"
                style={{
                  flexShrink: 0,
                  width: "24px",
                  height: "24px",
                }}
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <>
              <label htmlFor="field_x2961e" className="sr-only">
                Type to search medicines...
              </label>
              <input
                required
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
                id="field_x2961e"
              />
            </>
          )}
          <button
            type="button"
            aria-label="Toggle dropdown"
            onClick={() => {
              setShowMedDropdown(!showMedDropdown);
              if (!showMedDropdown) {
                setTimeout(() => searchInputRef.current?.focus(), 50);
              }
            }}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            <ChevronDown
              size={16}
              style={{
                color: "var(--text-muted)",
                flexShrink: 0,
                transform: showMedDropdown ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
              }}
            />
          </button>
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
                    role="button"
                    tabIndex={0}
                    key={m.id}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.currentTarget.click();
                      }
                    }}
                    onClick={() => selectMedicine(m)}
                    style={{
                      padding: "10px 14px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      borderBottom: "1px solid var(--overlay-05)",
                      background: isSelected
                        ? "rgba(79, 219, 200, 0.08)"
                        : "transparent",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected)
                        e.currentTarget.style.background = "var(--overlay-03)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected)
                        e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: "13px",
                        }}
                      >
                        {m.name}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "var(--text-muted)",
                        }}
                      >
                        Batch: {m.batchNumber || "—"} · ₹
                        {(m.mrp || 0).toFixed(2)} · {mfgName}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        textAlign: "right",
                      }}
                    >
                      <div>Qty: {m.stock ?? 0}</div>
                      {m.expiryDate && (
                        <div
                          style={{
                            color:
                              new Date(m.expiryDate) < new Date()
                                ? "var(--danger)"
                                : "inherit",
                          }}
                        >
                          Exp:{" "}
                          {new Date(m.expiryDate).toLocaleDateString("en-IN", {
                            month: "short",
                            year: "2-digit",
                          })}
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
  );
}

function LabelConfigPanel({
  dropdownRef,
  selectedMedicine,
  showMedDropdown,
  setShowMedDropdown,
  searchInputRef,
  clearMedicine,
  medicineSearch,
  setMedicineSearch,
  filteredMedicines,
  medicines,
  selectMedicine,
  template,
  setTemplate,
  labelFields,
  setLabelFields,
  labelQty,
  setLabelQty,
  handlePreview,
  handlePrintLabels,
  isPrinting,
}) {
  return (
    <div className="label-config-panel">
      <div className="pos-card">
        <div
          style={{
            fontWeight: 700,
            marginBottom: "16px",
          }}
        >
          Label Configuration
        </div>
        <MedicineSearchSelector
          dropdownRef={dropdownRef}
          selectedMedicine={selectedMedicine}
          showMedDropdown={showMedDropdown}
          setShowMedDropdown={setShowMedDropdown}
          searchInputRef={searchInputRef}
          clearMedicine={clearMedicine}
          medicineSearch={medicineSearch}
          setMedicineSearch={setMedicineSearch}
          filteredMedicines={filteredMedicines}
          medicines={medicines}
          selectMedicine={selectMedicine}
        />
        <div
          className="pos-input-group"
          style={{
            marginBottom: "20px",
          }}
        >
          <span className="p-label">TEMPLATE SELECTOR</span>
          <div
            className="purchases-tabs"
            style={{
              background: "none",
              border: "none",
              padding: 0,
            }}
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
            style={{
              fontSize: "11px",
              marginTop: "6px",
            }}
          >
            {LABEL_TEMPLATES[template]?.desc || "Standard template"}
          </div>
        </div>
        <div
          className="pos-input-group"
          style={{
            marginBottom: "20px",
          }}
        >
          <span className="p-label">CONTENT FIELDS</span>
          <div className="format-checkboxes">
            {Object.keys(labelFields).map((k) => (
              <label key={k} className="checkbox-item">
                <input
                  required
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
            <label htmlFor="field_682bxu" className="p-label">
              LABEL QUANTITY
            </label>
            <input
              id="field_682bxu"
              type="number"
              min="1"
              max="100"
              value={labelQty}
              onChange={(e) =>
                setLabelQty(Math.max(1, parseInt(e.target.value) || 1))
              }
              className="pos-input"
              style={{
                background: "var(--surface-container)",
                border: "1px solid var(--outline-variant)",
                borderRadius: "12px",
                padding: "8px 12px",
                color: "var(--text)",
                fontFamily: "'Outfit', sans-serif",
                fontSize: "14px",
                width: "100%",
              }}
            />
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "24px",
          }}
        >
          <button
            className="pos-btn outline"
            style={{
              flex: 1,
            }}
            onClick={handlePreview}
          >
            Preview
          </button>
          <button
            className="pos-btn teal"
            style={{
              flex: 2,
            }}
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
  );
}

export function BarcodeEcosystemSection2({
  activeTab,
  setShowMedDropdown,
  showMedDropdown,
  searchInputRef,
  clearMedicine,
  setMedicineSearch,
  selectedMedicine,
  selectMedicine,
  template,
  setTemplate,
  labelFields,
  setLabelFields,
  setLabelQty,
  previewScale,
  setPreviewScale,
  medicineSearch,
  filteredMedicines,
  medicines,
  dropdownRef,
  labelQty,
  handlePreview,
  handlePrintLabels,
  isPrinting,
}) {
  if (activeTab !== "labels") return null;
  return (
    <div className="label-print-panels">
      <LabelConfigPanel
        dropdownRef={dropdownRef}
        selectedMedicine={selectedMedicine}
        showMedDropdown={showMedDropdown}
        setShowMedDropdown={setShowMedDropdown}
        searchInputRef={searchInputRef}
        clearMedicine={clearMedicine}
        medicineSearch={medicineSearch}
        setMedicineSearch={setMedicineSearch}
        filteredMedicines={filteredMedicines}
        medicines={medicines}
        selectMedicine={selectMedicine}
        template={template}
        setTemplate={setTemplate}
        labelFields={labelFields}
        setLabelFields={setLabelFields}
        labelQty={labelQty}
        setLabelQty={setLabelQty}
        handlePreview={handlePreview}
        handlePrintLabels={handlePrintLabels}
        isPrinting={isPrinting}
      />
      <LabelPreviewPanel
        previewScale={previewScale}
        setPreviewScale={setPreviewScale}
        selectedMedicine={selectedMedicine}
        labelFields={labelFields}
      />
    </div>
  );
}
