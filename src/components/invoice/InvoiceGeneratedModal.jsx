import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Printer,
  Download,
  MessageCircle,
  X,
  Mail,
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import api from "../../api.js";
import InvoicePreviewPanel from "./InvoicePreviewPanel";
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

export default function InvoiceGeneratedModal({
  isOpen,
  onClose,
  invoice,
  showToast,
}) {
  const [theme, setTheme] = useState(() => 
    typeof document !== 'undefined' ? (document.documentElement.getAttribute("data-theme") || "light") : "light"
  );
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailAddress, setEmailAddress] = useState(
    invoice?.patientEmail || invoice?.patient?.email || ""
  );
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    document.body.classList.add("modal-open");

    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [isOpen]);

  if (!isOpen || !invoice) return null;

  // Map invoice data to InvoicePreviewPanel props
  const previewProps = {
    patient: {
      name:
        invoice.patientName ||
        invoice.patient?.fullName ||
        invoice.patient?.name,
      phone: invoice.patientPhone || invoice.patient?.phone,
    },
    doctorName: invoice.doctorName,
    prescriptionNo: invoice.prescriptionNo,
    address: invoice.address,
    gstNumber: invoice.gstNumber,
    paymentTerms:
      invoice.paymentMode || invoice.paymentTerms || invoice.payment,
    dueDate: invoice.dueDate,
    lineItems: (invoice.items || []).map((i) => ({
      name: i.medicine?.name || i.name,
      qty: i.quantity || i.qty,
      price: i.unitPrice || i.price,
      gst: i.gstPercentage || i.gst || 0,
      discount: i.discountPercentage || i.discount || 0,
      isNew: false,
      id: i.medicineId || i.id,
    })),
    subtotal: invoice.subTotal || invoice.totalAmount || invoice.total || 0,
    discountAmount: invoice.discountAmount || invoice.disc || 0,
    tax: invoice.taxAmount || invoice.gst || 0,
    grandTotal: invoice.totalAmount || invoice.total || 0,
    isWalkIn: invoice.patientId
      ? false
      : !invoice.patientName || invoice.patientName === "Walk-in Customer",
    invoiceNumber: invoice.invoiceNumber || invoice.id,
    invoiceDate: invoice.date || invoice.createdAt,
  };

  const getNormalizedSale = () => ({
    ...invoice,
    id: invoice.invoiceNumber || invoice.id,
    patient:
      invoice.patientName ||
      invoice.patient?.fullName ||
      invoice.patient?.name ||
      "Walk-in Customer",
    phone: invoice.patientPhone || invoice.patient?.phone || invoice.phone,
    date: invoice.date || new Date().toLocaleDateString(),
    time: invoice.time || new Date().toLocaleTimeString(),
    payment: invoice.paymentMode || invoice.paymentTerms || invoice.payment,
    total: invoice.totalAmount || invoice.total || 0,
    items: (invoice.items || []).map((i) => ({
      name: i.medicine?.name || i.name,
      qty: i.quantity || i.qty,
      price: i.unitPrice || i.price,
    })),
  });

  const exportAsLightMode = async (exportFn) => {
    const originalTheme = theme;
    if (theme === "dark") {
      setTheme("light");
      // Wait for React to apply classes and DOM to repaint
      await new Promise((resolve) => setTimeout(resolve, 150)); 
    }
    
    try {
      await exportFn();
    } finally {
      if (originalTheme === "dark") {
        setTheme("dark");
      }
    }
  };

  const handlePrint = () => {
    exportAsLightMode(() => {
      return new Promise((resolve) => {
        const content = document.getElementById("invoice-preview-capture").innerHTML;
        const printWindow = window.open("", "_blank");
        printWindow.document.write("<html><head><title>Print Invoice</title>");
        const styles = document.querySelectorAll("style, link[rel='stylesheet']");
        styles.forEach((s) => {
          printWindow.document.write(s.outerHTML);
        });
        printWindow.document.write("</head><body class='invoice-overlay' data-theme='light' style='background: white; padding: 0;'>");
        printWindow.document.write(content);
        printWindow.document.write("</body></html>");
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
          if (showToast) showToast("Sent to printer", "success");
          resolve();
        }, 500);
      });
    });
  };

  const handleDownloadPdf = () => {
    exportAsLightMode(async () => {
      try {
        const element = document.getElementById("invoice-preview-capture");
        const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`INV-${invoice.invoiceNumber || invoice.id}.pdf`);
        if (showToast) showToast("PDF downloaded", "success");
      } catch {
        if (showToast) showToast("Failed to generate PDF", "error");
      }
    });
  };

  const handleWhatsApp = () => {
    const sale = getNormalizedSale();
    const invNo = sale.id;
    const dateStr = sale.date;
    const patName = sale.patient;
    
    let itemsText = (sale.items || [])
      .map(
        (it) =>
          `• ${it.name} ${it.qty > 1 ? `x${it.qty}` : ''} = ₹${Number(it.price * it.qty).toFixed(2)}`
      )
      .join("\n");

    const text = `VIYAN MEDASSIST\n\nInvoice: ${invNo}\nDate: ${dateStr}\nPatient: ${patName}\n\nMedicines:\n\n${itemsText}\n\nSubtotal: ₹${Number(sale.subtotal || sale.total || 0).toFixed(2)}\nCGST: ₹${Number(sale.cgst || sale.tax / 2 || 0).toFixed(2)}\nSGST: ₹${Number(sale.sgst || sale.tax / 2 || 0).toFixed(2)}\nTOTAL: ₹${Number(sale.total || 0).toFixed(2)}\n\nThank you for visiting Viyan MedAssist!`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
    if (showToast) showToast("WhatsApp opened", "success");
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!emailAddress) return;
    setSendingEmail(true);
    try {
      await api.post(`billing/invoices/${invoice.id}/email`, { email: emailAddress });
      if (showToast) showToast("Email sent", "success");
      setShowEmailModal(false);
    } catch {
      if (showToast) showToast("Failed to send email", "error");
    } finally {
      setSendingEmail(false);
    }
  };

  return createPortal(
    <motion.div
      className="invoice-overlay"
      data-theme={theme}
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      style={{ zIndex: 10001 }}
    >
      <motion.div
        className="invoice-generated-modal"
        data-theme={theme}
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <div className="igm-layout">
          {/* Left Side: Preview (70%) */}
          <div className="igm-preview-pane">
            <div className="igm-preview-container" id="invoice-preview-capture" data-theme="light">
              <InvoicePreviewPanel {...previewProps} />
            </div>
          </div>

          {/* Right Side: Actions (30%) */}
          <div className="igm-actions-pane">
            <div className="igm-success-header">
              <div className="igm-success-icon-wrapper">
                <CheckCircle2 size={48} className="igm-success-icon" />
              </div>
              <h2 className="igm-success-title">
                Invoice Generated Successfully
              </h2>
              <div className="igm-invoice-no">
                Invoice #: {invoice.invoiceNumber || invoice.id || "N/A"}
              </div>
            </div>

            <div className="igm-actions-list">
              <button
                className="igm-btn primary"
                onClick={handlePrint}
              >
                <Printer size={18} /> Print Invoice
              </button>
              <button
                className="igm-btn secondary"
                onClick={handleDownloadPdf}
              >
                <Download size={18} /> Download PDF
              </button>
              <button
                className="igm-btn whatsapp"
                onClick={handleWhatsApp}
              >
                <MessageCircle size={18} /> WhatsApp
              </button>
              <button
                className="igm-btn secondary"
                onClick={() => setShowEmailModal(true)}
              >
                <Mail size={18} /> Send Email
              </button>
            </div>

            <div className="igm-footer">
              <button className="igm-btn close" onClick={onClose}>
                <X size={18} /> Close & New Bill
              </button>
            </div>
          </div>
        </div>

        {/* Email Modal */}
        <AnimatePresence>
          {showEmailModal && (
            <motion.div
              className="invoice-overlay"
              style={{ zIndex: 10002, background: "rgba(0,0,0,0.5)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="invoice-modal-container"
                style={{ maxWidth: 400, padding: 24 }}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
              >
                {/* <div className="modal-header">
                  <h3 className="modal-title">Send Email</h3>
                  <button className="close-btn" onClick={() => setShowEmailModal(false)}>
                    <X size={20} />
                  </button>
                </div> */}
                <form onSubmit={handleSendEmail} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      className="form-input"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      placeholder="patient@example.com"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Subject</label>
                    <input
                      type="text"
                      className="form-input"
                      value={`Invoice ${invoice.invoiceNumber || invoice.id}`}
                      readOnly
                    />
                  </div>
                  <div className="form-group">
                    <label>Message</label>
                    <textarea
                      className="form-input"
                      style={{ resize: 'none', height: 80 }}
                      value="Please find attached your invoice for your recent visit to Viyan MedAssist."
                      readOnly
                    />
                  </div>
                  <div className="form-row" style={{ marginTop: '8px' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowEmailModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={sendingEmail}>
                      {sendingEmail ? "Sending..." : "Send Email"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
