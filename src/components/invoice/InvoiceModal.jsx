import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X, Receipt, Eye, EyeOff } from "lucide-react";
import CustomerDetailsSection from "./CustomerDetailsSection";
import MedicineTableSection from "./MedicineTableSection";
import InvoiceSummaryCard from "./InvoiceSummaryCard";
import InvoicePreviewPanel from "./InvoicePreviewPanel";
import InvoiceFooterActions from "./InvoiceFooterActions";
import api from "../../api.js";
import { API_ROUTES } from "../../constants/api.routes.js";
import "../../styles/InvoiceModal.css";

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", duration: 0.4, bounce: 0.1 } },
  exit: { opacity: 0, scale: 0.95, y: 15, transition: { duration: 0.2 } }
};

export default function InvoiceModal({ isOpen, onClose, onSaveSuccess, showToast, user }) {
  const [patient, setPatient] = useState({ id: null, name: "", phone: "" });
  const [doctorName, setDoctorName] = useState("");
  const [lineItems, setLineItems] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [isWalkIn, setIsWalkIn] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  const [savingDraft, setSavingDraft] = useState(false);
  const [savingInvoice, setSavingInvoice] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [isOpen]);

  // Calculations
  const subtotal = useMemo(() => {
    return lineItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
  }, [lineItems]);

  const tax = useMemo(() => {
    return lineItems.reduce((acc, item) => acc + (item.price * item.qty * (item.gst / 100)), 0);
  }, [lineItems]);

  const discountAmount = useMemo(() => {
    return subtotal * (discount / 100);
  }, [subtotal, discount]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal + tax - discountAmount);
  }, [subtotal, tax, discountAmount]);

  const resetForm = () => {
    setPatient({ id: null, name: "", phone: "" });
    setDoctorName("");
    setLineItems([]);
    setDiscount(0);
    setPaymentMode("CASH");
    setIsWalkIn(false);
  };

  const handleSaveDraft = async () => {
    if (!user?.branchId) {
      showToast("Branch context missing. Cannot create draft.", "error");
      return;
    }
    if (lineItems.length === 0) {
      showToast("Add at least one medicine to save draft", "error");
      return;
    }
    if (!isWalkIn && !patient.name) {
      showToast("Please enter customer details or select Walk-in Customer", "error");
      return;
    }

    setSavingDraft(true);
    try {
      const payload = {
        patientId: isWalkIn ? null : patient.id,
        patientName: isWalkIn ? "Walk-in Customer" : patient.name || "Walk-in",
        patientPhone: isWalkIn ? "" : patient.phone || "",
        doctorName: doctorName || null,
        items: lineItems.map((i) => ({
          medicineId: i.id,
          medicineName: i.name,
          quantity: i.qty,
          unitPrice: i.price,
          gstPercentage: i.gst || 0,
          batchId: i.batchId || null,
        })),
        subtotal,
        cgst: tax / 2,
        sgst: tax / 2,
        discountPercentage: discount,
        discountAmount: discountAmount,
        totalAmount: grandTotal,
        paymentMethod: paymentMode,
        isDraft: true,
        branchId: user.branchId,
      };

      const res = await api.post("billing/invoices/draft", payload);
      const saved = res.data?.data || res.data;
      showToast(`Draft saved successfully`, "success");
      onSaveSuccess(saved);
      resetForm();
      onClose();
    } catch (err) {
      console.error("[DRAFT] Failed:", err);
      showToast(err.response?.data?.error || "Failed to save draft", "error");
    } finally {
      setSavingDraft(false);
    }
  };

  const handleGenerateInvoice = async () => {
    if (!user?.branchId) {
      showToast("Branch context missing. Cannot generate invoice.", "error");
      return;
    }
    if (lineItems.length === 0) {
      showToast("Add at least one medicine to generate invoice", "error");
      return;
    }
    if (!isWalkIn && !patient.name) {
      showToast("Please enter customer details or select Walk-in Customer", "error");
      return;
    }
    if (Number.isNaN(grandTotal) || grandTotal <= 0) {
      showToast("Invalid total amount calculation", "error");
      return;
    }

    setSavingInvoice(true);
    try {
      const payload = {
        patientId: isWalkIn ? null : patient.id,
        patientName: isWalkIn ? "Walk-in Customer" : patient.name || "Walk-in Customer",
        patientPhone: isWalkIn ? null : patient.phone,
        doctorName: doctorName || null,
        items: lineItems.map((it) => ({
          medicineId: it.id,
          batchId: it.batchId,
          quantity: it.qty,
          unitPrice: it.price,
          gstPercentage: it.gst || 0,
        })),
        paymentMode: paymentMode,
        discountPercentage: discount,
        discountAmount: discountAmount,
        branchId: user.branchId,
      };

      const res = await api.post(API_ROUTES.BILLING_INVOICES, payload);
      const rawInv = res.data?.data || res.data;
      showToast(`Invoice generated successfully`, "success");
      
      onSaveSuccess(rawInv);
      resetForm();
      onClose();
    } catch (err) {
      console.error("[INVOICE] Generation failed:", err);
      showToast(err.response?.data?.error || "Failed to generate invoice", "error");
    } finally {
      setSavingInvoice(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <motion.div
      className="invoice-overlay"
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      <motion.div
        className={`invoice-modal ${showPreview ? "has-preview" : "no-preview"}`}
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* Header */}
        <div className="invoice-header flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#4fdbc8]/15 rounded-lg border border-[#4fdbc8]/20">
              <Receipt className="text-[#4fdbc8]" size={16} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">New Invoice</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-[11px] text-slate-300 font-semibold flex items-center gap-1.5 transition-all hover:text-white"
            >
              {showPreview ? <EyeOff size={13} /> : <Eye size={13} />}
              {showPreview ? "Hide Real-time Preview" : "Live Preview Mode"}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all focus:outline-none"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Workspace */}
        <div className={`invoice-content ${showPreview ? "has-preview" : "no-preview"}`}>
          
          {/* Left Panel */}
          <div className="invoice-left">
            <CustomerDetailsSection
              patient={patient}
              setPatient={setPatient}
              doctorName={doctorName}
              setDoctorName={setDoctorName}
              paymentMode={paymentMode}
              setPaymentMode={setPaymentMode}
              isWalkIn={isWalkIn}
              setIsWalkIn={setIsWalkIn}
              showToast={showToast}
            />

            <MedicineTableSection
              lineItems={lineItems}
              setLineItems={setLineItems}
              showToast={showToast}
            />
          </div>

          {/* Right Panel */}
          {showPreview && (
            <div className="invoice-right">
              <InvoiceSummaryCard
                subtotal={subtotal}
                discount={discount}
                setDiscount={setDiscount}
                tax={tax}
                grandTotal={grandTotal}
              />

              <InvoicePreviewPanel
                patient={patient}
                doctorName={doctorName}
                lineItems={lineItems}
                subtotal={subtotal}
                discount={discount}
                tax={tax}
                grandTotal={grandTotal}
                paymentMode={paymentMode}
                isWalkIn={isWalkIn}
              />
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <InvoiceFooterActions
          onCancel={onClose}
          onSaveDraft={handleSaveDraft}
          onGenerate={handleGenerateInvoice}
          savingDraft={savingDraft}
          savingInvoice={savingInvoice}
          disabled={lineItems.length === 0}
        />

      </motion.div>
    </motion.div>,
    document.body
  );
}
