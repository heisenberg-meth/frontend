import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Printer, Download, MessageCircle } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import InvoicePreview from "../common/InvoicePreview";
import "../../styles/InvoiceModal.css";
import { safeNumber } from '../../utils/number.js';


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
  onNewBill,
  storeProfile,
}) {
  const [theme, setTheme] = useState(() =>
    typeof document !== "undefined"
      ? document.documentElement.getAttribute("data-theme") || "light"
      : "light",
  );

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
    storeProfile,
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
        const content = document.getElementById(
          "invoice-preview-capture",
        ).innerHTML;
        const printWindow = window.open("", "_blank");
        printWindow.document.write("<html><head><title>Print Invoice</title>");
        const styles = document.querySelectorAll(
          "style, link[rel='stylesheet']",
        );
        styles.forEach((s) => {
          printWindow.document.write(s.outerHTML);
        });
        printWindow.document.write(
          "</head><body class='invoice-overlay' data-theme='light' style='background: white; padding: 0;'>",
        );
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
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
        });
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
          `• ${it.name} ${it.qty > 1 ? `x${it.qty}` : ""} = ₹${safeNumber(it.price * it.qty).toFixed(2)}`,
      )
      .join("\n");

    const shopName =
      storeProfile?.shopName || storeProfile?.businessName || "VIYAN MEDASSIST";
    const text = `${shopName}\n\nInvoice: ${invNo}\nDate: ${dateStr}\nPatient: ${patName}\n\nMedicines:\n\n${itemsText}\n\nSubtotal: ₹${safeNumber(sale.subtotal || sale.total || 0).toFixed(2)}\nCGST: ₹${safeNumber(sale.cgst || sale.tax / 2 || 0).toFixed(2)}\nSGST: ₹${safeNumber(sale.sgst || sale.tax / 2 || 0).toFixed(2)}\nTOTAL: ₹${safeNumber(sale.total || 0).toFixed(2)}\n\nThank you for visiting ${shopName}!`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
    if (showToast) showToast("WhatsApp opened", "success");
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
            <div
              className="igm-preview-container"
              id="invoice-preview-capture"
              data-theme="light"
            >
              <InvoicePreview {...previewProps} />
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
              <button className="igm-btn primary" onClick={handlePrint}>
                <Printer size={18} /> Print Invoice
              </button>
              <button className="igm-btn secondary" onClick={handleDownloadPdf}>
                <Download size={18} /> Download PDF
              </button>
              <button className="igm-btn whatsapp" onClick={handleWhatsApp}>
                <MessageCircle size={18} /> WhatsApp
              </button>
            </div>

            <div
              className="igm-footer"
              style={{ display: "flex", gap: "12px" }}
            >
              <button
                className="igm-btn close"
                onClick={onClose}
                style={{ height: "48px", flex: 1, justifyContent: "center" }}
              >
                Close Preview
              </button>
              {onNewBill && (
                <button
                  className="igm-btn primary"
                  onClick={onNewBill}
                  style={{ height: "48px", flex: 1, justifyContent: "center" }}
                >
                  New Bill
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
