import { useState } from "react";
import { User, Phone, Clipboard, Calendar, CreditCard, Banknote, Smartphone, Check, Loader2 } from "lucide-react";
import api from "../../api.js";
import { API_ROUTES } from "../../constants/api.routes.js";
import { normalizeArrayResponse } from "../../utils/apiNormalizer";

export default function CustomerDetailsSection({
  patient,
  setPatient,
  doctorName,
  setDoctorName,
  paymentMode,
  setPaymentMode,
  isWalkIn,
  setIsWalkIn,
  showToast
}) {
  const [loadingPatient, setLoadingPatient] = useState(false);
  const [patientResults, setPatientResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const handlePhoneChange = async (e) => {
    const phoneVal = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPatient(prev => ({ ...prev, phone: phoneVal }));

    if (phoneVal.length === 10) {
      setLoadingPatient(true);
      try {
        const res = await api.get(API_ROUTES.PATIENTS, {
          params: { phone: phoneVal }
        });
        const results = normalizeArrayResponse(res, "patients");
        if (results && results.length > 0) {
          setPatientResults(results);
          setShowDropdown(true);
        } else {
          setPatientResults([]);
          setShowDropdown(false);
          showToast("New customer detected. Please enter customer name.", "info");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingPatient(false);
      }
    } else {
      setPatientResults([]);
      setShowDropdown(false);
    }
  };

  const selectPatient = (p) => {
    setPatient({
      id: p.id,
      name: p.fullName || p.name,
      phone: p.phone
    });
    setShowDropdown(false);
    showToast(`Loaded customer details: ${p.fullName || p.name}`, "success");
  };

  const todayStr = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

  const paymentModes = [
    { id: "CASH", label: "Cash", icon: Banknote },
    { id: "UPI", label: "UPI", icon: Smartphone },
    { id: "CARD", label: "Card", icon: CreditCard }
  ];

  return (
    <div className="customer-section">
      <div className="flex items-center justify-between pb-1.5 border-b border-white/5 mb-1">
        <h3 className="text-sm font-bold text-slate-300 flex items-center gap-1.5">
          <User size={15} className="text-[#4fdbc8]" /> Customer Details
        </h3>
        <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-400">
          <input
            type="checkbox"
            checked={isWalkIn}
            onChange={(e) => {
              setIsWalkIn(e.target.checked);
              if (e.target.checked) {
                setPatient({ id: null, name: "Walk-in Customer", phone: "" });
              } else {
                setPatient({ id: null, name: "", phone: "" });
              }
            }}
            className="rounded border-white/10 bg-slate-800 text-[#4fdbc8] focus:ring-0 w-3 h-3"
          />
          Walk-in Customer
        </label>
      </div>

      <div className="customer-grid">
        {/* Mobile Number */}
        <div className="form-field relative">
          <label>Mobile Number</label>
          <div className="relative">
            <input
              type="text"
              disabled={isWalkIn}
              value={isWalkIn ? "" : patient.phone}
              onChange={handlePhoneChange}
              placeholder={isWalkIn ? "N/A" : "Enter 10-digit mobile"}
              className="w-full form-input disabled:opacity-40 disabled:cursor-not-allowed"
            />
            {loadingPatient && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4fdbc8] animate-spin" size={14} />
            )}
          </div>

          {showDropdown && patientResults.length > 0 && (
            <div className="absolute z-20 left-0 right-0 mt-1 bg-slate-900 border border-white/10 rounded-lg shadow-xl max-h-48 overflow-y-auto">
              {patientResults.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => selectPatient(p)}
                  className="w-full px-3 py-1.5 text-left text-xs text-slate-300 hover:bg-[#4fdbc8]/10 hover:text-white flex items-center justify-between transition-colors border-b border-white/5 last:border-0"
                >
                  <div>
                    <div className="font-medium">{p.fullName || p.name}</div>
                    <div className="text-[10px] text-slate-500">{p.phone}</div>
                  </div>
                  <Check size={12} className="text-[#4fdbc8] opacity-0 hover:opacity-100" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Customer Name */}
        <div className="form-field">
          <label>Customer Name</label>
          <div className="relative">
            <input
              type="text"
              disabled={isWalkIn}
              value={isWalkIn ? "Walk-in Customer" : patient.name}
              onChange={(e) => setPatient(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter customer name"
              className="w-full form-input disabled:opacity-40 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Doctor Name */}
        <div className="form-field">
          <label>Doctor Name (Optional)</label>
          <div className="relative">
            <input
              type="text"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              placeholder="Enter prescriber's name"
              className="w-full form-input"
            />
          </div>
        </div>

        {/* Invoice Date */}
        <div className="form-field">
          <label>Invoice Date</label>
          <div className="relative">
            <input
              type="text"
              readOnly
              disabled
              value={todayStr}
              className="w-full form-input select-none cursor-not-allowed opacity-60"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-white/5 pt-3 mt-1">
        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Payment Method</label>
        <div className="payment-grid">
          {paymentModes.map((mode) => {
            const IconComponent = mode.icon;
            const isActive = paymentMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setPaymentMode(mode.id)}
                className={`payment-card ${
                  isActive
                    ? "bg-[#4fdbc8]/10 border-[#4fdbc8] text-[#4fdbc8] shadow-[0_0_10px_rgba(79,219,200,0.2)] scale-[1.01]"
                    : "text-slate-400 hover:border-white/10 hover:text-slate-200 hover:bg-slate-900/60"
                }`}
              >
                <IconComponent size={15} />
                <span className="text-[11px] font-semibold">{mode.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
