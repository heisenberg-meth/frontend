import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X, Receipt, Eye, EyeOff, FileText, FolderOpen } from "lucide-react";
import CustomerDetailsSection from "./CustomerDetailsSection";
import MedicineTableSection from "./MedicineTableSection";
import InvoicePreview from "../common/InvoicePreview";
import api from "../../api.js";
import { API_ROUTES } from "../../constants/api.routes.js";
import "../../styles/InvoiceModal.css";

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.98, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", duration: 0.35, bounce: 0.05 },
  },
  exit: { opacity: 0, scale: 0.98, y: 10, transition: { duration: 0.15 } },
};

export default function InvoiceModal({
  isOpen,
  onClose,
  onSaveSuccess,
  showToast,
  user,
}) {
  const [theme, setTheme] = useState("light");
  const [patient, setPatient] = useState({ id: null, name: "", phone: "" });
  const [doctorName, setDoctorName] = useState("");
  const [prescriptionNo, setPrescriptionNo] = useState("");
  const [address, setAddress] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("Cash");
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0]; // YYYY-MM-DD
  });
  const [lineItems, setLineItems] = useState([]);
  const [isWalkIn, setIsWalkIn] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  const [savingDraft, setSavingDraft] = useState(false);
  const [savingInvoice, setSavingInvoice] = useState(false);

  // Monitor theme changes on document.documentElement to adapt modal theme dynamically
  useEffect(() => {
    if (!isOpen) return;

    document.body.classList.add("modal-open");

    const updateTheme = () => {
      const currentTheme =
        document.documentElement.getAttribute("data-theme") || "light";
      setTheme(currentTheme);
    };

    updateTheme();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "data-theme"
        ) {
          updateTheme();
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });

    return () => {
      observer.disconnect();
      document.body.classList.remove("modal-open");
    };
  }, [isOpen]);

  // Calculations
  const subtotal = useMemo(() => {
    return lineItems.reduce((acc, item) => acc + item.price * item.qty, 0);
  }, [lineItems]);

  const discountAmount = useMemo(() => {
    return lineItems.reduce(
      (acc, item) => acc + item.price * item.qty * ((item.discount || 0) / 100),
      0,
    );
  }, [lineItems]);

  const tax = useMemo(() => {
    return lineItems.reduce((acc, item) => {
      const itemSub = item.price * item.qty;
      const itemDisc = itemSub * ((item.discount || 0) / 100);
      return acc + (itemSub - itemDisc) * ((item.gst || 0) / 100);
    }, 0);
  }, [lineItems]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal - discountAmount + tax);
  }, [subtotal, discountAmount, tax]);

  const resetForm = () => {
    setPatient({ id: null, name: "", phone: "" });
    setDoctorName("");
    setPrescriptionNo("");
    setAddress("");
    setGstNumber("");
    setPaymentTerms("Cash");
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setDueDate(d.toISOString().split("T")[0]);
    setLineItems([]);
    setIsWalkIn(false);
  };

  const hasValidItems = useMemo(() => {
    return lineItems.some((i) => !i.isNew && i.id);
  }, [lineItems]);

  const handleSaveDraft = async () => {
    if (!user?.branchId) {
      showToast("Branch context missing. Cannot create draft.", "error");
      return;
    }
    if (!hasValidItems) {
      showToast("Add at least one medicine to save draft", "error");
      return;
    }
    if (!isWalkIn && !patient.name) {
      showToast(
        "Please enter customer details or select Walk-in Customer",
        "error",
      );
      return;
    }

    setSavingDraft(true);
    try {
      const payload = {
        patientId: isWalkIn ? null : patient.id,
        patientName: isWalkIn ? "Walk-in Customer" : patient.name || "Walk-in",
        patientPhone: isWalkIn ? "" : patient.phone || "",
        doctorName: doctorName || null,
        prescriptionNo: prescriptionNo || null,
        address: address || null,
        gstNumber: gstNumber || null,
        paymentTerms: paymentTerms,
        dueDate: dueDate,
        items: lineItems
          .filter((i) => !i.isNew && i.id)
          .map((i) => ({
            medicineId: i.id,
            medicineName: i.name,
            quantity: i.qty,
            unitPrice: i.price,
            gstPercentage: i.gst || 0,
            discountPercentage: i.discount || 0,
            batchId: i.batchId || null,
          })),
        subtotal,
        cgst: tax / 2,
        sgst: tax / 2,
        discountPercentage:
          subtotal > 0 ? (discountAmount / subtotal) * 100 : 0,
        discountAmount: discountAmount,
        totalAmount: grandTotal,
        paymentMethod:
          paymentTerms === "Cash"
            ? "CASH"
            : paymentTerms === "Card"
              ? "CARD"
              : paymentTerms === "UPI"
                ? "UPI"
                : "BANK",
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
    if (!hasValidItems) {
      showToast("Add at least one medicine to generate invoice", "error");
      return;
    }
    if (!isWalkIn && !patient.name) {
      showToast(
        "Please enter customer details or select Walk-in Customer",
        "error",
      );
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
        patientName: isWalkIn
          ? "Walk-in Customer"
          : patient.name || "Walk-in Customer",
        patientPhone: isWalkIn ? null : patient.phone,
        doctorName: doctorName || null,
        prescriptionNo: prescriptionNo || null,
        address: address || null,
        gstNumber: gstNumber || null,
        paymentTerms: paymentTerms,
        dueDate: dueDate,
        items: lineItems
          .filter((it) => !it.isNew && it.id)
          .map((it) => ({
            medicineId: it.id,
            batchId: it.batchId,
            quantity: it.qty,
            unitPrice: it.price,
            gstPercentage: it.gst || 0,
            discountPercentage: it.discount || 0,
          })),
        paymentMode:
          paymentTerms === "Cash"
            ? "CASH"
            : paymentTerms === "Card"
              ? "CARD"
              : paymentTerms === "UPI"
                ? "UPI"
                : "BANK",
        discountPercentage:
          subtotal > 0 ? (discountAmount / subtotal) * 100 : 0,
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
      showToast(
        err.response?.data?.error || "Failed to generate invoice",
        "error",
      );
    } finally {
      setSavingInvoice(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <motion.div
      className="invoice-overlay"
      data-theme={theme}
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      <motion.div
        className={`invoice-modal ${showPreview ? "has-preview" : "no-preview"}`}
        data-theme={theme}
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* Header */}
        <div className="invoice-header flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#0d9488]/10 text-[#0d9488] rounded-lg border border-[#0d9488]/20 flex items-center justify-center">
              <Receipt className="text-[#0d9488]" size={16} />
            </div>
            <div>
              <h2
                className="text-base font-extrabold leading-none"
                style={{ color: theme === "dark" ? "#ffffff" : "#000000" }}
              >
                New Invoice
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="btn-toggle-preview flex items-center gap-1.5"
            >
              {showPreview ? (
                <EyeOff size={13} className="stroke-[2.5]" />
              ) : (
                <Eye size={13} className="stroke-[2.5]" />
              )}
              {showPreview
                ? "Hide Real-time Preview"
                : "Show Real-time Preview"}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-all focus:outline-none dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Workspace */}
        <div
          className={`invoice-content ${showPreview ? "has-preview" : "no-preview"}`}
        >
          {/* Left Panel */}
          <div className="invoice-left">
            {/* Scrollable Content Area */}
            <div className="invoice-left-scroll-content">
              <CustomerDetailsSection
                patient={patient}
                setPatient={setPatient}
                doctorName={doctorName}
                setDoctorName={setDoctorName}
                prescriptionNo={prescriptionNo}
                setPrescriptionNo={setPrescriptionNo}
                address={address}
                setAddress={setAddress}
                gstNumber={gstNumber}
                setGstNumber={setGstNumber}
                paymentTerms={paymentTerms}
                setPaymentTerms={setPaymentTerms}
                dueDate={dueDate}
                setDueDate={setDueDate}
                isWalkIn={isWalkIn}
                setIsWalkIn={setIsWalkIn}
                showToast={showToast}
              />

              <MedicineTableSection
                lineItems={lineItems}
                setLineItems={setLineItems}
                showToast={showToast}
                theme={theme}
              />
            </div>

            {/* Sticky Bottom Actions and Totals Panel */}
            <div className="invoice-bottom-panel">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={!hasValidItems || savingDraft || savingInvoice}
                  className="btn-save-draft"
                >
                  <FolderOpen size={14} className="stroke-[2.5]" /> Save Draft
                </button>
                <button
                  type="button"
                  onClick={handleGenerateInvoice}
                  disabled={!hasValidItems || savingDraft || savingInvoice}
                  className="btn-generate-invoice"
                >
                  <FileText size={14} className="stroke-[2.5]" /> Generate
                  Invoice
                </button>
              </div>

              <div className="invoice-totals-box">
                <div className="totals-row">
                  <span>Subtotal</span>
                  <span className="val-dark">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="totals-row">
                  <span>Discount</span>
                  <span className="val-green">
                    -₹{discountAmount.toFixed(2)}
                  </span>
                </div>
                <div className="totals-row">
                  <span>GST Taxes</span>
                  <span className="val-dark">₹{tax.toFixed(2)}</span>
                </div>
                <div className="totals-row grand-total">
                  <span>Total Amount</span>
                  <span className="val-teal">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          {showPreview && (
            <div className="invoice-right">
              <InvoicePreview
                patient={patient}
                doctorName={doctorName}
                prescriptionNo={prescriptionNo}
                address={address}
                gstNumber={gstNumber}
                paymentTerms={paymentTerms}
                dueDate={dueDate}
                lineItems={lineItems}
                subtotal={subtotal}
                discountAmount={discountAmount}
                tax={tax}
                grandTotal={grandTotal}
                isWalkIn={isWalkIn}
              />
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
