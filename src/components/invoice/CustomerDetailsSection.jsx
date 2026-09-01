import { useState } from "react";
import {
  User,
  Phone,
  Stethoscope,
  FileText,
  MapPin,
  Shield,
  CreditCard,
  Calendar,
  Check,
  Loader2,
} from "lucide-react";
import api from "../../api.js";
import { API_ROUTES } from "../../constants/api.routes.js";
import { normalizeArrayResponse } from "../../utils/apiNormalizer";
const termsOptions = ["Cash", "Credit", "UPI", "Card", "Bank Transfer"];
export default function CustomerDetailsSection({
  patient,
  setPatient,
  doctorName,
  setDoctorName,
  prescriptionNo,
  setPrescriptionNo,
  address,
  setAddress,
  gstNumber,
  setGstNumber,
  paymentTerms,
  setPaymentTerms,
  dueDate,
  setDueDate,
  isWalkIn,
  setIsWalkIn,
  showToast,
}) {
  const [loadingPatient, setLoadingPatient] = useState(false);
  const [patientResults, setPatientResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const handlePhoneChange = async (e) => {
    const phoneVal = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPatient((prev) => ({
      ...prev,
      phone: phoneVal,
    }));
    if (phoneVal.length === 10) {
      setLoadingPatient(true);
      try {
        const res = await api.get(API_ROUTES.PATIENTS, {
          params: {
            phone: phoneVal,
          },
        });
        const results = normalizeArrayResponse(res, "patients");
        if (results && results.length > 0) {
          setPatientResults(results);
          setShowDropdown(true);
        } else {
          setPatientResults([]);
          setShowDropdown(false);
          showToast(
            "New customer detected. Please enter customer name.",
            "info",
          );
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
      phone: p.phone,
    });
    if (p.address) {
      setAddress(p.address);
    }
    setShowDropdown(false);
    showToast(`Loaded customer details: ${p.fullName || p.name}`, "success");
  };
  return (
    <div className="invoice-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="card-header-icon-wrapper">
            <User size={14} className="stroke-[2.5]" />
          </div>
          <h3 className="card-header-title">Customer & Billing Details</h3>
        </div>
        <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-slate-500 hover:text-slate-800 transition-colors">
          <input
            required
            type="checkbox"
            checked={isWalkIn}
            onChange={(e) => {
              setIsWalkIn(e.target.checked);
              if (e.target.checked) {
                setPatient({
                  id: null,
                  name: "Walk-in Customer",
                  phone: "",
                });
                setAddress("");
                setGstNumber("");
              } else {
                setPatient({
                  id: null,
                  name: "",
                  phone: "",
                });
              }
            }}
            className="rounded border-slate-300 text-[#0d9488] focus:ring-[#0d9488]/20 w-3.5 h-3.5"
          />
          Walk-in Customer
        </label>
      </div>

      {/* 12-Column Billing Grid */}
      <div className="billing-grid">
        {/* Customer Name (col span 3) */}
        <div className="form-field billing-col-3">
          <label htmlFor="field_u82jqx">Customer Name</label>
          <div className="relative">
            <User className="form-field-icon" size={14} />
            <input
              id="field_u82jqx"
              required
              type="text"
              disabled={isWalkIn}
              value={isWalkIn ? "Walk-in Customer" : patient.name}
              onChange={(e) =>
                setPatient((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              placeholder="Patient full name"
              className="form-input form-input-has-icon disabled:opacity-40 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Phone Number (col span 3) */}
        <div className="form-field billing-col-3 relative">
          <label htmlFor="field_5hkfkd">Phone Number</label>
          <div className="relative">
            <Phone className="form-field-icon" size={14} />
            <input
              id="field_5hkfkd"
              required
              type="text"
              disabled={isWalkIn}
              value={isWalkIn ? "" : patient.phone}
              onChange={handlePhoneChange}
              placeholder="Mobile number"
              className="form-input form-input-has-icon disabled:opacity-40 disabled:cursor-not-allowed"
            />
            {loadingPatient && (
              <Loader2
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0d9488] animate-spin"
                size={14}
              />
            )}
          </div>

          {showDropdown && patientResults.length > 0 && (
            <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
              {patientResults.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => selectPatient(p)}
                  className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between transition-colors"
                >
                  <div>
                    <div className="font-semibold text-slate-800">
                      {p.fullName || p.name}
                    </div>
                    <div className="text-[10px] text-slate-500">{p.phone}</div>
                  </div>
                  <Check size={12} className="text-[#0d9488]" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Doctor Name (col span 3) */}
        <div className="form-field billing-col-3">
          <label htmlFor="field_9glqt0">Doctor Name</label>
          <div className="relative">
            <Stethoscope className="form-field-icon" size={14} />
            <input
              id="field_9glqt0"
              required
              type="text"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              placeholder="Prescrib..."
              className="form-input form-input-has-icon"
            />
          </div>
        </div>

        {/* Prescription No (col span 3) */}
        <div className="form-field billing-col-3">
          <label htmlFor="field_xwa2ge">Prescription No</label>
          <div className="relative">
            <FileText className="form-field-icon" size={14} />
            <input
              id="field_xwa2ge"
              required
              type="text"
              value={prescriptionNo}
              onChange={(e) => setPrescriptionNo(e.target.value)}
              placeholder="Rx number"
              className="form-input form-input-has-icon"
            />
          </div>
        </div>

        {/* Address (col span 5) */}
        <div className="form-field billing-col-5">
          <label htmlFor="field_oie7ea">Address</label>
          <div className="relative">
            <MapPin className="form-field-icon" size={14} />
            <input
              id="field_oie7ea"
              required
              type="text"
              disabled={isWalkIn}
              value={isWalkIn ? "" : address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Patient full home address"
              className="form-input form-input-has-icon disabled:opacity-40 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* GST Number (col span 2) */}
        <div className="form-field billing-col-2">
          <label htmlFor="field_umklzr">GST Number</label>
          <div className="relative">
            <Shield className="form-field-icon" size={14} />
            <input
              id="field_umklzr"
              required
              type="text"
              disabled={isWalkIn}
              value={isWalkIn ? "" : gstNumber}
              onChange={(e) => setGstNumber(e.target.value)}
              placeholder="GSTIN"
              className="form-input form-input-has-icon disabled:opacity-40 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Payment Terms (col span 2) */}
        <div className="form-field billing-col-2">
          <label htmlFor="field_ct10u6">Payment Terms</label>
          <div className="relative">
            <CreditCard className="form-field-icon" size={13} />
            <select
              id="field_ct10u6"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              className="form-input form-input-has-icon cursor-pointer"
            >
              {termsOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Due Date (col span 3) */}
        <div className="form-field billing-col-3">
          <label htmlFor="field_gkuctl">Due Date</label>
          <div className="relative">
            <Calendar className="form-field-icon" size={13} />
            <input
              id="field_gkuctl"
              required
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="form-input form-input-has-icon"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
