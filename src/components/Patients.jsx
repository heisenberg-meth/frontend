import { useState, useMemo, useEffect, useRef } from "react";
import api from "../api.js";
import { formatDate } from "../utils/format.js";
import { API_ROUTES } from "../constants/api.routes.js";
import {
  UserPlus,
  Search,
  Download,
  X,
  CheckCircle,
  ArrowRight,
  Phone,
  Gift,
  CreditCard,
  ChevronRight,
  Loader2,
  Upload,
} from "lucide-react";
import { AnimatePresence, m } from "framer-motion";
import { safeNumber } from "../utils/number.js";
function Spinner({ size = 14 }) {
  return <Loader2 size={size} className="spinner-icon" />;
}
function PatientsSection1({
  setShowDrawer,
  drawerTab,
  setDrawerTab,
  selectedPatient,
  showToast,
  prescriptionFileRef,
  showDrawer,
  isRelationLoading,
  loyaltyProfile,
  creditLedger,
}) {
  return (
    <AnimatePresence>
      {showDrawer && selectedPatient && (
        <>
          <m.div
            className="drawer-overlay"
            role="presentation"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            onClick={() => setShowDrawer(false)}
          />
          <m.div
            className="patient-drawer"
            initial={{
              x: "100%",
            }}
            animate={{
              x: 0,
            }}
            exit={{
              x: "100%",
            }}
          >
            <div className="drawer-header-v2">
              <div className="d-profile-summary">
                <div className="d-avatar">
                  {selectedPatient.fullName?.charAt(0)}
                </div>
                <div>
                  <h2>{selectedPatient.fullName}</h2>
                  <p>
                    {selectedPatient.phone} ·{" "}
                    {selectedPatient.email || "No Email"}
                  </p>
                </div>
              </div>
              <button
                aria-label="Close"
                className="micro-btn"
                onClick={() => setShowDrawer(false)}
              >
                <X size={24} />
              </button>
            </div>

            <div className="drawer-tabs">
              {["Overview", "Ledger", "Prescriptions"].map((t) => (
                <button
                  key={t}
                  className={`d-tab ${drawerTab === t.toLowerCase() ? "active" : ""}`}
                  onClick={() => setDrawerTab(t.toLowerCase())}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="drawer-body-v2">
              {isRelationLoading ? (
                <div
                  style={{
                    padding: 40,
                    textAlign: "center",
                  }}
                >
                  <Spinner />
                </div>
              ) : drawerTab === "overview" ? (
                <div className="d-overview-stack">
                  <div className="d-info-card">
                    <div className="d-card-lbl">
                      <Gift size={12} /> LOYALTY STATUS
                    </div>
                    <div className="d-loyalty-hero">
                      <div className="pts">
                        {loyaltyProfile?.availablePoints || 0}{" "}
                        <small>Points</small>
                      </div>
                      <div className="tier">
                        {loyaltyProfile?.loyaltyTier || "BRONZE"}
                      </div>
                    </div>
                  </div>

                  <div className="d-info-card">
                    <div className="d-card-lbl">
                      <CreditCard size={12} /> CREDIT ACCOUNT
                    </div>
                    <div className="d-credit-hero">
                      <div className="bal">
                        ₹
                        {safeNumber(
                          loyaltyProfile?.outstandingBalance || 0,
                        ).toFixed(2)}
                      </div>
                      <p>
                        Available Limit: ₹{loyaltyProfile?.creditLimit || 0}
                      </p>
                      <span
                        className={`p-status ${(loyaltyProfile?.accountStatus || "INACTIVE").toLowerCase()}`}
                      >
                        {loyaltyProfile?.accountStatus || "INACTIVE"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : drawerTab === "ledger" ? (
                <div className="ledger-stack">
                  {creditLedger.map((entry) => (
                    <div key={entry.type} className="ledger-entry">
                      <div
                        className="l-icon"
                        style={{
                          background:
                            entry.type === "CREDIT_ISSUED"
                              ? "rgba(239, 68, 68, 0.1)"
                              : "rgba(16, 185, 129, 0.1)",
                        }}
                      >
                        {entry.type === "CREDIT_ISSUED" ? (
                          <ArrowRight size={14} />
                        ) : (
                          <CheckCircle size={14} />
                        )}
                      </div>
                      <div className="l-main">
                        <b>{entry.type.replace(/_/g, " ")}</b>
                        <p>{entry.notes || "Manual Transaction"}</p>
                        <small>{formatDate(entry.createdAt)}</small>
                      </div>
                      <div
                        className="l-amt"
                        style={{
                          color:
                            entry.type === "CREDIT_ISSUED"
                              ? "var(--danger)"
                              : "var(--success)",
                        }}
                      >
                        {entry.type === "CREDIT_ISSUED" ? "-" : "+"} ₹
                        {safeNumber(
                          entry.debit > 0 ? entry.debit : entry.credit,
                        ).toFixed(2)}
                      </div>
                    </div>
                  ))}
                  {creditLedger.length === 0 && (
                    <p className="result-meta">
                      No financial transactions recorded.
                    </p>
                  )}
                </div>
              ) : (
                <div className="prescriptions-stack">
                  <input
                    aria-label="input field"
                    required
                    type="file"
                    ref={prescriptionFileRef}
                    accept="image/*,.pdf"
                    style={{
                      display: "none",
                    }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file || !selectedPatient) return;
                      try {
                        const formData = new FormData();
                        formData.append("file", file);
                        formData.append("patientId", selectedPatient.id);
                        await api.post("prescriptions", formData, {
                          headers: {
                            "Content-Type": "multipart/form-data",
                          },
                        });
                        showToast("Prescription uploaded", "success");
                      } catch (err) {
                        showToast(
                          err.response?.data?.error || "Upload failed",
                          "error",
                        );
                      }
                      e.target.value = "";
                    }}
                  />
                  <button
                    className="upload-btn-v2"
                    onClick={() => prescriptionFileRef.current?.click()}
                  >
                    <Upload size={14} /> Upload New Prescription
                  </button>
                  <p
                    className="result-meta"
                    style={{
                      marginTop: 20,
                    }}
                  >
                    No prescriptions archived for this patient.
                  </p>
                </div>
              )}
            </div>
          </m.div>
        </>
      )}
    </AnimatePresence>
  );
}
export default function Patients({ showToast }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const prescriptionFileRef = useRef(null);
  const [drawerTab, setDrawerTab] = useState("overview");
  const [setShowModal] = useState(false);
  const [setModalType] = useState("add");
  const [loyaltyProfile, setLoyaltyProfile] = useState(null);
  const [creditLedger, setCreditLedger] = useState([]);
  const [isRelationLoading, setIsRelationLoading] = useState(false);
  useEffect(() => {
    let mounted = true;
    const loadPatients = async () => {
      try {
        setLoading(true);
        const res = await api.get(API_ROUTES.PATIENTS);
        if (!mounted) return;
        setPatients(res.data?.patients || res.data?.data || res.data || []);
      } catch (err) {
        console.error(err);
        if (mounted) {
          showToast("Failed to fetch patients", "error");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    loadPatients();
    return () => {
      mounted = false;
    };
  }, [showToast]);
  const fetchRelationshipData = async (patientId) => {
    setIsRelationLoading(true);
    try {
      const [loyRes, ledgerRes] = await Promise.all([
        api.get(`${API_ROUTES.PATIENTS}/${patientId}/loyalty`),
        api.get(`${API_ROUTES.PATIENTS}/${patientId}/credit-ledger`),
      ]);
      setLoyaltyProfile(loyRes.data?.data);
      setCreditLedger(ledgerRes.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRelationLoading(false);
    }
  };
  const handleOpenPatient = (p) => {
    setSelectedPatient(p);
    setDrawerTab("overview");
    setShowDrawer(true);
    fetchRelationshipData(p.id);
  };
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const name = p.fullName || p.name || "";
      const phone = p.phone || "";
      return (
        name.toLowerCase().includes(search.toLowerCase()) ||
        phone.includes(search)
      );
    });
  }, [patients, search]);
  return (
    <div className="patients-container">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Patient Relationships</h1>
          <p className="page-subtitle">
            Manage medical history, loyalty rewards, and credit accounts.
          </p>
        </div>
        <div className="page-header-actions header-actions">
          <button className="pos-btn outline">
            <Download size={16} /> Export
          </button>
          <button
            className="pos-btn teal"
            onClick={() => {
              setModalType("add");
              setShowModal(true);
            }}
          >
            <UserPlus size={18} /> Add Patient
          </button>
        </div>
      </div>

      <div className="patient-filters-card">
        <div className="search-box-v2">
          <Search size={18} />
          <>
            <label htmlFor="field_ewlpdq" className="sr-only">
              Search by name, phone, or patient ID...
            </label>
            <input
              required
              placeholder="Search by name, phone, or patient ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id="field_ewlpdq"
            />
          </>
        </div>
      </div>

      {loading ? (
        <div
          style={{
            padding: "80px",
            textAlign: "center",
          }}
        >
          <Spinner size={32} />
        </div>
      ) : (
        <div className="patient-grid-v2">
          {filteredPatients.map((p) => (
            <m.div
              key={p.id}
              className="patient-card-v2"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleOpenPatient(p);
                }
              }}
              onClick={() => handleOpenPatient(p)}
              whileHover={{
                y: -4,
              }}
            >
              <div className="p-card-top">
                <div className="p-avatar-v2">
                  {p.fullName?.charAt(0) || "P"}
                </div>
                <div className="p-main-info">
                  <span className="p-name">{p.fullName || p.name}</span>
                  <span className="p-meta">
                    <Phone size={10} /> {p.phone}
                  </span>
                </div>
                <span className="p-action-btn">
                  <ChevronRight size={16} />
                </span>
              </div>
              <div className="p-stats-row">
                <div className="p-stat">
                  <div className="lbl">Rewards</div>
                  <div className="val">{p.loyaltyPoints || 0} Pts</div>
                </div>
                <div className="p-stat">
                  <div className="lbl">Dues</div>
                  <div
                    className="val"
                    style={{
                      color: p.creditUsed > 0 ? "var(--danger)" : "",
                    }}
                  >
                    ₹{safeNumber(p.creditUsed || 0).toFixed(0)}
                  </div>
                </div>
              </div>
            </m.div>
          ))}
        </div>
      )}

      {/* --- PATIENT DETAIL DRAWER --- */}
      <PatientsSection1
        setShowDrawer={setShowDrawer}
        drawerTab={drawerTab}
        setDrawerTab={setDrawerTab}
        selectedPatient={selectedPatient}
        showToast={showToast}
        prescriptionFileRef={prescriptionFileRef}
        showDrawer={showDrawer}
        isRelationLoading={isRelationLoading}
        loyaltyProfile={loyaltyProfile}
        creditLedger={creditLedger}
      />
    </div>
  );
}
