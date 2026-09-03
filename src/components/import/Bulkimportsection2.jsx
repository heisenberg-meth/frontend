import { X } from "lucide-react";
import { AnimatePresence, m } from "framer-motion";

export function BulkImportSection2({
  setShowHistoryDrawer,
  handleViewImport,
  handleDownloadImport,
  showToast,
  importHistory,
  historyLoading,
  showHistoryDrawer,
}) {
  return (
    <AnimatePresence>
      {showHistoryDrawer && (
        <>
          <button
            type="button"
            className="drawer-overlay"
            aria-label="Close history drawer"
            onClick={() => setShowHistoryDrawer(false)}
          />
          <m.div
            initial={{
              x: "100%",
            }}
            animate={{
              x: 0,
            }}
            exit={{
              x: "100%",
            }}
            className="import-history-drawer"
          >
            <div className="drawer-header">
              <h3>Import History</h3>
              <button aria-label="Close" type="button" onClick={() => setShowHistoryDrawer(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="drawer-quick-stats">
              <span>Total imported</span>
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
                      {item.records ??
                        item.extractedData?.summary?.importedCount ??
                        0}{" "}
                      records imported
                    </div>
                    <div className="tags-row">
                      <span className="tag supplier">
                        {item.supplier ||
                          item.extractedData?.supplier ||
                          "General / CSV"}
                      </span>
                      <span className="tag type">
                        {item.type || item.importType || "BULK"}
                      </span>
                      <span className="tag ai">
                        {item.strategy
                          ? `Strategy: ${item.strategy}`
                          : "AI Mapping"}
                      </span>
                    </div>
                    <div className="footer-row">
                      <span
                        className={`status-badge ${String(item.status || item.importStatus || "").toLowerCase()}`}
                      >
                        {item.status || item.importStatus}
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
          </m.div>
        </>
      )}
    </AnimatePresence>
  );
}
export function BulkImportSection3({
  setShowAddSupplierModal,
  setSupplierForm,
  supplierForm,
  saveSupplier,
  showAddSupplierModal,
}) {
  return (
    showAddSupplierModal && (
      <div className="modal-overlay-v2">
        <div className="modal-content-v2">
          <div className="modal-header">
            <div>
              <h3>Add New Supplier</h3>
              <p>Quickly add a supplier for this import.</p>
            </div>
            <button aria-label="Close"
              type="button"
              onClick={() => setShowAddSupplierModal(false)}
            >
              <X size={20} />
            </button>
          </div>
          <div className="modal-body">
            <div className="p-form-grid">
              <div className="pos-input-group">
                <label htmlFor="field_iggj8m" className="p-label">
                  SUPPLIER NAME*
                </label>
                <input
                  id="field_iggj8m"
                  required
                  className="pos-input"
                  placeholder="e.g. Cipla Ltd"
                  value={supplierForm.name}
                  onChange={(e) =>
                    setSupplierForm({
                      ...supplierForm,
                      name: e.target.value,
                    })
                  }
                />
              </div>
              <div className="pos-input-group">
                <label htmlFor="field_rj59f5" className="p-label">
                  CONTACT PERSON
                </label>
                <input
                  id="field_rj59f5"
                  required
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
                <label htmlFor="field_kx3d43" className="p-label">
                  PHONE
                </label>
                <input
                  id="field_kx3d43"
                  required
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
                <label htmlFor="field_pq7nvt" className="p-label">
                  EMAIL
                </label>
                <input
                  id="field_pq7nvt"
                  required
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
                <label htmlFor="field_xkpgsj" className="p-label">
                  GST NUMBER
                </label>
                <input
                  id="field_xkpgsj"
                  required
                  className="pos-input"
                  placeholder="29AAB..."
                  value={supplierForm.gst}
                  onChange={(e) =>
                    setSupplierForm({
                      ...supplierForm,
                      gst: e.target.value,
                    })
                  }
                />
              </div>
              <div className="pos-input-group">
                <label htmlFor="field_6384ac" className="p-label">
                  LEAD TIME (DAYS)
                </label>
                <input
                  id="field_6384ac"
                  required
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
              <label htmlFor="field_0dkque" className="p-label">
                PAYMENT TERMS
              </label>
              <select
                id="field_0dkque"
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
    )
  );
}
