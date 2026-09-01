import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LandingPage.css";
const SECTIONS = [{
  id: "privacy-policy-header",
  label: "Privacy Policy"
}, {
  id: "introduction",
  label: "1. Introduction"
}, {
  id: "about-us",
  label: "2. About Us"
}, {
  id: "scope",
  label: "3. Scope"
}, {
  id: "information-we-collect",
  label: "4. Information We Collect"
}, {
  id: "information-we-do-not-collect",
  label: "5. Information We Do Not Collect"
}, {
  id: "cookies-local-storage",
  label: "6. Cookies & Local Storage"
}, {
  id: "how-we-use-your-information",
  label: "7. How We Use Your Information"
}, {
  id: "legal-basis-for-processing",
  label: "8. Legal Basis for Processing"
}, {
  id: "payment-processing",
  label: "9. Payment Processing"
}, {
  id: "third-party-services",
  label: "10. Third-Party Services"
}, {
  id: "sharing-of-information",
  label: "11. Sharing of Information"
}, {
  id: "data-security",
  label: "12. Data Security"
}, {
  id: "data-retention",
  label: "13. Data Retention"
}, {
  id: "your-rights",
  label: "14. Your Rights"
}, {
  id: "india-dpdp",
  label: "15. India (DPDP Act, 2023)"
}, {
  id: "gdpr",
  label: "16. GDPR"
}, {
  id: "california-privacy",
  label: "17. California Privacy Rights"
}, {
  id: "childrens-privacy",
  label: "18. Children's Privacy"
}, {
  id: "international-data-transfers",
  label: "19. International Data Transfers"
}, {
  id: "data-controller-processor",
  label: "20. Data Controller & Data Processor"
}, {
  id: "account-deletion",
  label: "21. Account Deletion"
}, {
  id: "security-incident-response",
  label: "22. Security Incident Response"
}, {
  id: "changes-to-policy",
  label: "23. Changes to This Privacy Policy"
}, {
  id: "contact-us",
  label: "24. Contact Us"
}, {
  id: "acceptance-of-policy",
  label: "25. Acceptance of This Privacy Policy"
}];
const handleScrollTo = id => {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
    el.classList.add("section-flash-highlight");
    setTimeout(() => {
      el.classList.remove("section-flash-highlight");
    }, 1500);
  }
};
function PrivacyPolicyPageSection1({
  setSearchQuery,
  activeSection,
  sec
}) {
  return <div style={{
    paddingTop: "140px",
    paddingBottom: "40px",
    height: "100vh",
    boxSizing: "border-box",
    overflow: "hidden"
  }}>
        <div className="lp-container" style={{
      height: "100%"
    }}>
          <div className="legal-layout-container">
            {/* Sidebar Navigation */}
            <div className="legal-sidebar-wrapper">
              {/* Search Box */}
              <div className="legal-search-container">
                <span className="legal-search-icon">🔍</span>
                <><label htmlFor="field_4yns67" className="sr-only">Search policy...</label><input type="text" placeholder="Search policy..." className="legal-search-input" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} id="field_4yns67" /></>
              </div>

              <aside className="legal-sidebar">
                {filteredSections.map(sec => <button key={sec.id} className={`legal-sidebar-link ${activeSection === sec.id ? "active" : ""}`} onClick={() => handleScrollTo(sec.id)}>
                    {sec.label}
                  </button>)}
                {filteredSections.length === 0 && <div style={{
              padding: "8px 12px",
              color: "#9ca3af",
              fontSize: "0.85rem"
            }}>
                    No matching sections
                  </div>}
              </aside>
            </div>

            {/* Document Content */}
            <main ref={contentRef} className="legal-document-content">
              <h1 id="privacy-policy-header" className="legal-section">
                Privacy Policy
              </h1>
              <p className="legal-hero-description">
                Learn how MedAssist collects, uses, stores, and protects your
                business and personal information.
              </p>

              <div className="privacy-meta-tags">
                <span className="privacy-meta-tag">Updated July 1, 2026</span>
                <span>•</span>
                <span>12 min read</span>
              </div>

              <div className="privacy-meta">
                <p>
                  <strong>Effective Date:</strong> July 1, 2026
                </p>
                <p>
                  <strong>Last Updated:</strong> July 1, 2026
                </p>
                <p>
                  <strong>Application:</strong> MedAssist
                </p>
                <p>
                  <strong>Company:</strong>{" "}
                  <strong>VIYAN Infotech Private Limited</strong>
                </p>
                <p>
                  <strong>Website:</strong>{" "}
                  <a href="https://medassist.viyaninfo.com/" target="_blank" rel="noopener noreferrer">
                    https://medassist.viyaninfo.com/
                  </a>
                </p>
                <p>
                  <strong>Contact Email:</strong>{" "}
                  <a href="mailto:viyanninfo@gmail.com">viyanninfo@gmail.com</a>
                </p>
              </div>

              <hr />

              <h2 id="introduction" className="legal-section">
                1. Introduction
              </h2>
              <p>
                Welcome to <strong>MedAssist</strong> ("MedAssist", "we", "our",
                or "us"), a cloud-based Software-as-a-Service (SaaS) platform
                developed and operated by{" "}
                <strong>VIYAN Infotech Private Limited</strong>.
              </p>
              <p>
                MedAssist is designed to help pharmacies, medical stores,
                healthcare organizations, and businesses efficiently manage
                inventory, billing, purchases, GST compliance, barcode tracking,
                customer records, suppliers, reporting, and day-to-day business
                operations.
              </p>
              <p>
                This Privacy Policy explains how we collect, use, process,
                disclose, store, and protect your information when you use:
              </p>
              <ul>
                <li>MedAssist Web Application</li>
                <li>MedAssist Desktop Application (Windows, macOS, Linux)</li>
                <li>MedAssist Mobile Applications (Android & iOS)</li>
                <li>MedAssist APIs</li>
                <li>Customer Support Services</li>
                <li>Official Website</li>
              </ul>
              <p>
                By creating an account or using our services, you agree to the
                practices described in this Privacy Policy.
              </p>

              <hr />

              <h2 id="about-us" className="legal-section">
                2. About Us
              </h2>
              <p>MedAssist is owned and operated by:</p>
              <p>
                <strong>VIYAN Infotech Private Limited</strong>
              </p>
              <p>
                Website:
                <br />
                <a href="https://medassist.viyaninfo.com/" target="_blank" rel="noopener noreferrer">
                  https://medassist.viyaninfo.com/
                </a>
              </p>
              <p>
                Email:
                <br />
                <a href="mailto:viyanninfo@gmail.com">viyanninfo@gmail.com</a>
              </p>
              <p>
                Throughout this policy, "Company", "MedAssist", "we", "our", and
                "us" refer to VIYAN Infotech Private Limited.
              </p>

              <hr />

              <h2 id="scope" className="legal-section">
                3. Scope
              </h2>
              <p>
                This Privacy Policy applies to all users of MedAssist,
                including:
              </p>
              <ul>
                <li>Pharmacy Owners</li>
                <li>Business Owners</li>
                <li>Store Administrators</li>
                <li>Managers</li>
                <li>Employees</li>
                <li>Cashiers</li>
                <li>Pharmacists</li>
                <li>Suppliers</li>
                <li>Customers</li>
                <li>Patients</li>
                <li>Trial Users</li>
                <li>Paid Subscribers</li>
                <li>Website Visitors</li>
              </ul>
              <p>
                This Privacy Policy also applies to all data collected through
                our desktop, mobile, web, and API services.
              </p>

              <hr />

              <h2 id="information-we-collect" className="legal-section">
                4. Information We Collect
              </h2>
              <p>
                We collect only the information necessary to provide our
                services, maintain security, comply with legal obligations, and
                improve our platform.
              </p>

              <h3>4.1 Business Information</h3>
              <p>We may collect:</p>
              <ul>
                <li>Pharmacy Name</li>
                <li>Business Name</li>
                <li>Branch Name</li>
                <li>Branch Address</li>
                <li>GSTIN</li>
                <li>Drug License Number</li>
                <li>PAN</li>
                <li>Business Contact Number</li>
                <li>Business Email</li>
                <li>Business Logo</li>
                <li>Time Zone</li>
                <li>Currency</li>
                <li>Business Settings</li>
              </ul>

              <hr />

              <h3>4.2 User Account Information</h3>
              <p>We may collect:</p>
              <ul>
                <li>Full Name</li>
                <li>Email Address</li>
                <li>Mobile Number</li>
                <li>Username</li>
                <li>Password (stored only as a secure bcrypt hash)</li>
                <li>Profile Photo (optional)</li>
                <li>Job Role</li>
                <li>Permissions</li>
                <li>Last Login Time</li>
                <li>Login History</li>
                <li>Account Status</li>
              </ul>
              <p>We never store plaintext passwords.</p>

              <hr />

              <h3>4.3 Patient & Customer Information</h3>
              <p>Your organization may choose to store:</p>
              <ul>
                <li>Name</li>
                <li>Mobile Number</li>
                <li>Email Address</li>
                <li>Physical Address</li>
                <li>Gender</li>
                <li>Date of Birth</li>
                <li>Prescription Information</li>
                <li>Prescription Images</li>
                <li>Doctor Information</li>
                <li>Medical Purchase History</li>
                <li>Loyalty Points</li>
                <li>Outstanding Balance</li>
                <li>Invoice History</li>
              </ul>
              <p>The pharmacy or business controls this information.</p>

              <hr />

              <h3>4.4 Supplier Information</h3>
              <p>We may store:</p>
              <ul>
                <li>Supplier Name</li>
                <li>Company Name</li>
                <li>Contact Person</li>
                <li>Mobile Number</li>
                <li>Email Address</li>
                <li>GSTIN</li>
                <li>Drug License Number</li>
                <li>Address</li>
                <li>Purchase History</li>
                <li>Payment Information</li>
              </ul>

              <hr />

              <h3>4.5 Product & Inventory Information</h3>
              <p>This includes:</p>
              <ul>
                <li>Medicine Name</li>
                <li>Manufacturer</li>
                <li>Category</li>
                <li>Brand</li>
                <li>HSN Code</li>
                <li>Barcode</li>
                <li>Batch Number</li>
                <li>Manufacturing Date</li>
                <li>Expiry Date</li>
                <li>Purchase Price</li>
                <li>Selling Price</li>
                <li>MRP</li>
                <li>GST Percentage</li>
                <li>Current Stock</li>
                <li>Reorder Level</li>
                <li>Warehouse Information</li>
              </ul>

              <hr />

              <h3>4.6 Billing & Financial Information</h3>
              <p>We may store:</p>
              <ul>
                <li>Sales Invoices</li>
                <li>Purchase Orders</li>
                <li>Purchase Bills</li>
                <li>Goods Receipt Notes (GRN)</li>
                <li>Credit Notes</li>
                <li>Debit Notes</li>
                <li>Payment References</li>
                <li>Transaction IDs</li>
                <li>Invoice Numbers</li>
                <li>GST Details</li>
                <li>Tax Calculations</li>
                <li>Subscription Billing History</li>
              </ul>

              <hr />

              <h3>4.7 Technical Information</h3>
              <p>Automatically collected information includes:</p>
              <ul>
                <li>IP Address</li>
                <li>Browser Type</li>
                <li>Browser Version</li>
                <li>Operating System</li>
                <li>Device Information</li>
                <li>Session Tokens</li>
                <li>Refresh Tokens</li>
                <li>Login Time</li>
                <li>Logout Time</li>
                <li>Device Identifier</li>
                <li>API Usage Logs</li>
                <li>Crash Reports</li>
                <li>Performance Logs</li>
                <li>Error Logs</li>
                <li>Audit Logs</li>
              </ul>

              <hr />

              <h2 id="information-we-do-not-collect" className="legal-section">
                5. Information We Do NOT Collect
              </h2>
              <p>MedAssist does not collect or store:</p>
              <ul>
                <li>Credit Card Numbers</li>
                <li>Debit Card Numbers</li>
                <li>CVV Numbers</li>
                <li>UPI PIN</li>
                <li>ATM PIN</li>
                <li>Net Banking Passwords</li>
                <li>OTPs</li>
                <li>Aadhaar Numbers</li>
                <li>Passport Numbers</li>
                <li>Biometric Information</li>
                <li>Fingerprints</li>
                <li>Face Recognition Data</li>
                <li>Voice Prints</li>
              </ul>
              <p>Payment information is securely handled by Razorpay.</p>

              <hr />

              <h2 id="cookies-local-storage" className="legal-section">
                6. Cookies & Local Storage
              </h2>
              <p>
                We use cookies and local storage technologies to provide secure
                and efficient services.
              </p>

              <h3>Authentication Cookies</h3>
              <p>Used to:</p>
              <ul>
                <li>Keep users logged in</li>
                <li>Verify sessions</li>
                <li>Refresh authentication tokens</li>
                <li>Protect against CSRF attacks</li>
              </ul>
              <p>Examples include:</p>
              <ul>
                <li>accessToken</li>
                <li>refreshToken</li>
                <li>csrfToken</li>
              </ul>

              <hr />

              <h3>Local Storage</h3>
              <p>Used for:</p>
              <ul>
                <li>Theme Preference</li>
                <li>Language Preference</li>
                <li>Dashboard Layout</li>
                <li>UI Preferences</li>
                <li>Recently Used Settings</li>
              </ul>

              <hr />

              <h3>Payment Cookies</h3>
              <p>
                Payment-related cookies may be created by Razorpay during
                checkout.
              </p>

              <hr />

              <h2 id="how-we-use-your-information" className="legal-section">
                7. How We Use Your Information
              </h2>
              <p>We use information for:</p>
              <ul>
                <li>Creating user accounts</li>
                <li>User authentication</li>
                <li>Subscription management</li>
                <li>Pharmacy management</li>
                <li>Inventory management</li>
                <li>Barcode generation</li>
                <li>Billing</li>
                <li>GST calculations</li>
                <li>Purchase management</li>
                <li>Supplier management</li>
                <li>Customer management</li>
                <li>Patient management</li>
                <li>Team management</li>
                <li>Report generation</li>
                <li>Customer support</li>
                <li>Fraud prevention</li>
                <li>Security monitoring</li>
                <li>Audit logging</li>
                <li>Performance optimization</li>
                <li>Bug fixing</li>
                <li>Feature improvements</li>
                <li>Legal compliance</li>
              </ul>

              <hr />

              <h2 id="legal-basis-for-processing" className="legal-section">
                8. Legal Basis for Processing
              </h2>
              <p>Where applicable, we process personal information based on:</p>
              <ul>
                <li>User Consent</li>
                <li>Contractual Necessity</li>
                <li>Legal Obligations</li>
                <li>Legitimate Business Interests</li>
              </ul>

              <hr />

              <h2 id="payment-processing" className="legal-section">
                9. Payment Processing
              </h2>
              <p>
                All premium subscription payments are processed securely through
                Razorpay.
              </p>
              <p>We never receive or store:</p>
              <ul>
                <li>Credit Card Numbers</li>
                <li>Debit Card Numbers</li>
                <li>CVV</li>
                <li>UPI PIN</li>
                <li>Internet Banking Credentials</li>
              </ul>
              <p>We only receive:</p>
              <ul>
                <li>Razorpay Order ID</li>
                <li>Razorpay Payment ID</li>
                <li>Razorpay Signature</li>
                <li>Payment Status</li>
                <li>Subscription Status</li>
              </ul>

              <hr />

              <h2 id="third-party-services" className="legal-section">
                10. Third-Party Services
              </h2>
              <p>MedAssist may use the following third-party services:</p>
              <ul>
                <li>Razorpay (Payment Processing)</li>
                <li>Google Fonts (PDF generation)</li>
                <li>Cloud Hosting Providers</li>
                <li>Email Service Providers</li>
                <li>Domain & DNS Providers</li>
                <li>SSL Certificate Providers</li>
              </ul>
              <p>
                Additional services may be introduced in the future. This
                Privacy Policy will be updated accordingly.
              </p>

              <hr />

              <h2 id="sharing-of-information" className="legal-section">
                11. Sharing of Information
              </h2>
              <p>We do not sell, rent, or trade your personal information.</p>
              <p>Information may be shared only:</p>
              <ul>
                <li>With payment providers</li>
                <li>With cloud infrastructure providers</li>
                <li>With government authorities when legally required</li>
                <li>With auditors</li>
                <li>During mergers, acquisitions, or business restructuring</li>
                <li>When required to protect legal rights or prevent fraud</li>
              </ul>

              <hr />

              <h2 id="data-security" className="legal-section">
                12. Data Security
              </h2>
              <p>We use industry-standard security measures including:</p>
              <ul>
                <li>HTTPS</li>
                <li>TLS 1.2+</li>
                <li>Secure Authentication</li>
                <li>bcrypt Password Hashing</li>
                <li>Role-Based Access Control (RBAC)</li>
                <li>Secure API Authentication</li>
                <li>CSRF Protection</li>
                <li>Access Logging</li>
                <li>Audit Trails</li>
                <li>Database Backups</li>
                <li>Firewall Protection</li>
                <li>Server Monitoring</li>
                <li>Session Management</li>
                <li>Principle of Least Privilege</li>
              </ul>
              <p>
                While we strive to protect your information, no system can
                guarantee absolute security.
              </p>

              <hr />

              <h2 id="data-retention" className="legal-section">
                13. Data Retention
              </h2>
              <p>We retain information only as long as necessary.</p>
              <table className="legal-table">
                <thead>
                  <tr>
                    <th>Data Type</th>
                    <th>Retention Period</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>GST Records</td>
                    <td>8 Years</td>
                  </tr>
                  <tr>
                    <td>Sales Invoices</td>
                    <td>8 Years</td>
                  </tr>
                  <tr>
                    <td>Purchase Records</td>
                    <td>8 Years</td>
                  </tr>
                  <tr>
                    <td>Audit Logs</td>
                    <td>5 Years</td>
                  </tr>
                  <tr>
                    <td>Error Logs</td>
                    <td>90 Days</td>
                  </tr>
                  <tr>
                    <td>System Logs</td>
                    <td>90 Days</td>
                  </tr>
                  <tr>
                    <td>Backups</td>
                    <td>90-Day Rolling Backup</td>
                  </tr>
                  <tr>
                    <td>Subscription Records</td>
                    <td>Account Lifetime + 1 Year</td>
                  </tr>
                  <tr>
                    <td>Deleted Accounts</td>
                    <td>30-Day Recovery Period</td>
                  </tr>
                </tbody>
              </table>
              <p>Legal obligations may require longer retention.</p>

              <hr />

              <h2 id="your-rights" className="legal-section">
                14. Your Rights
              </h2>
              <p>Depending on applicable laws, you may have the right to:</p>
              <ul>
                <li>Access your information</li>
                <li>Correct inaccurate information</li>
                <li>Update your information</li>
                <li>Request deletion</li>
                <li>Withdraw consent</li>
                <li>Restrict processing</li>
                <li>Request data portability</li>
                <li>Object to processing</li>
                <li>Lodge complaints with regulators</li>
              </ul>
              <p>
                Requests may be submitted via:
                <br />
                Email:{" "}
                <a href="mailto:viyanninfo@gmail.com">viyanninfo@gmail.com</a>
              </p>

              <hr />

              <h2 id="india-dpdp" className="legal-section">
                15. India (Digital Personal Data Protection Act, 2023)
              </h2>
              <p>
                Users in India have rights under the Digital Personal Data
                Protection Act, 2023, including:
              </p>
              <ul>
                <li>Right to access personal data</li>
                <li>Right to correction</li>
                <li>Right to deletion (subject to legal obligations)</li>
                <li>Right to grievance redressal</li>
                <li>
                  Right to nominate another person as provided under applicable
                  law
                </li>
              </ul>

              <hr />

              <h2 id="gdpr" className="legal-section">
                16. GDPR (European Union & United Kingdom)
              </h2>
              <p>
                For customers located in the European Union or United Kingdom:
              </p>
              <ul>
                <li>
                  The subscribing pharmacy/business acts as the{" "}
                  <strong>Data Controller</strong>.
                </li>
                <li>
                  MedAssist acts as the <strong>Data Processor</strong> on
                  behalf of the subscribing organization.
                </li>
              </ul>
              <p>
                Users may exercise applicable GDPR rights through their
                organization or by contacting us where appropriate.
              </p>

              <hr />

              <h2 id="california-privacy" className="legal-section">
                17. California Privacy Rights (CCPA/CPRA)
              </h2>
              <p>
                Where applicable, California residents may have the right to:
              </p>
              <ul>
                <li>Know what personal information is collected</li>
                <li>Request deletion</li>
                <li>Correct inaccurate information</li>
                <li>Access collected information</li>
                <li>Limit certain uses of sensitive personal information</li>
              </ul>
              <p>MedAssist does not sell personal information.</p>

              <hr />

              <h2 id="childrens-privacy" className="legal-section">
                18. Children's Privacy
              </h2>
              <p>
                MedAssist is designed for businesses and professional users.
              </p>
              <p>
                Our services are not intended for children under the age of 18,
                and we do not knowingly collect personal information directly
                from children.
              </p>

              <hr />

              <h2 id="international-data-transfers" className="legal-section">
                19. International Data Transfers
              </h2>
              <p>Our services are primarily hosted in India.</p>
              <p>
                If information is transferred to another country, we will
                implement appropriate safeguards as required by applicable law.
              </p>

              <hr />

              <h2 id="data-controller-processor" className="legal-section">
                20. Data Controller & Data Processor
              </h2>
              <p>For customer and patient information:</p>
              <ul>
                <li>
                  The subscribing pharmacy or business is the{" "}
                  <strong>Data Controller</strong>.
                </li>
                <li>
                  VIYAN Infotech Private Limited acts as the{" "}
                  <strong>Data Processor</strong> for information processed
                  through MedAssist.
                </li>
              </ul>
              <p>
                The customer organization determines what information is
                collected, entered, and retained within the platform.
              </p>

              <hr />

              <h2 id="account-deletion" className="legal-section">
                21. Account Deletion
              </h2>
              <p>Users may request account deletion by contacting us.</p>
              <p>
                Certain information, including invoices, tax records, and
                legally required business records, may be retained for the
                period required by applicable laws.
              </p>
              <p>
                Deleted accounts remain recoverable for up to{" "}
                <strong>30 days</strong>, after which they are permanently
                removed, except where retention is required by law.
              </p>

              <hr />

              <h2 id="security-incident-response" className="legal-section">
                22. Security Incident Response
              </h2>
              <p>
                If a security incident or data breach affecting personal
                information is identified, we will investigate the incident
                promptly and take appropriate measures to contain, assess, and
                remediate the issue. Where required by applicable law, affected
                customers and relevant authorities will be notified within the
                legally prescribed timelines.
              </p>

              <hr />

              <h2 id="changes-to-policy" className="legal-section">
                23. Changes to This Privacy Policy
              </h2>
              <p>We may update this Privacy Policy periodically.</p>
              <p>When significant changes are made, we will:</p>
              <ul>
                <li>Update the "Last Updated" date.</li>
                <li>Publish the revised Privacy Policy on our website.</li>
                <li>
                  Notify users through the application or by email where
                  required.
                </li>
              </ul>
              <p>
                Your continued use of MedAssist after changes become effective
                constitutes acceptance of the updated Privacy Policy.
              </p>

              <hr />

              <h2 id="contact-us" className="legal-section">
                24. Contact Us
              </h2>
              <p>
                If you have questions, concerns, or requests regarding this
                Privacy Policy, please contact:
              </p>
              <p>
                <strong>VIYAN Infotech Private Limited</strong>
                <br />
                <strong>MedAssist Privacy & Compliance Team</strong>
              </p>
              <p>
                Website:
                <br />
                <a href="https://medassist.viyaninfo.com/" target="_blank" rel="noopener noreferrer">
                  https://medassist.viyaninfo.com/
                </a>
              </p>
              <p>
                Email:
                <br />
                <a href="mailto:viyanninfo@gmail.com">viyanninfo@gmail.com</a>
              </p>
              <p>
                We will respond to legitimate requests within a reasonable
                timeframe and in accordance with applicable laws.
              </p>

              <hr />

              <h2 id="acceptance-of-policy" className="legal-section">
                25. Acceptance of This Privacy Policy
              </h2>
              <p>
                By accessing or using MedAssist, you acknowledge that you have
                read, understood, and agreed to this Privacy Policy.
              </p>
              <p>
                If you do not agree with this Privacy Policy, you should
                discontinue use of the Services.
              </p>
              <p>
                Thank you for trusting <strong>MedAssist</strong>, developed by{" "}
                <strong>VIYAN Infotech Private Limited</strong>, to support your
                business operations securely and responsibly.
              </p>
            </main>
          </div>
        </div>
      </div>;
}
export default function PrivacyPolicyPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("privacy-policy-header");
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [contentElement, setContentElement] = useState(null);
  const contentRef = node => {
    if (node !== null) {
      setContentElement(node);
    }
  };
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  useEffect(() => {
    if (!contentElement) return;
    const handleScroll = () => {
      const totalHeight = contentElement.scrollHeight - contentElement.clientHeight;
      if (totalHeight > 0) {
        setScrollProgress(contentElement.scrollTop / totalHeight * 100);
      }
      setShowBackToTop(contentElement.scrollTop > 400);
    };
    contentElement.addEventListener("scroll", handleScroll);
    return () => contentElement.removeEventListener("scroll", handleScroll);
  }, [contentElement]);
  useEffect(() => {
    if (contentElement) {
      const sections = document.querySelectorAll(".legal-section");
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      }, {
        root: contentElement,
        rootMargin: "-20px 0px -60% 0px"
      });
      sections.forEach(section => observer.observe(section));
      return () => {
        sections.forEach(section => observer.unobserve(section));
        observer.disconnect();
      };
    }
  }, [contentElement]);
  const handleBackToTop = () => {
    if (contentElement) {
      contentElement.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }
  };
  const filteredSections = SECTIONS.filter(sec => sec.label.toLowerCase().includes(searchQuery.toLowerCase()));
  return <div className="lp-root privacy-page-container">
      {/* Reading Progress Bar */}
      <div className="reading-progress-bar" style={{
      width: `${scrollProgress}%`
    }} />

      {/* Back to Top Button */}
      {showBackToTop && <button className="back-to-top" onClick={handleBackToTop} aria-label="Back to top">
          ↑
        </button>}

      {/* Simplified Nav */}
      <nav className="lp-nav lp-nav--scrolled">
        <div className="lp-nav-inner">
          <div role="button" tabIndex={0} className="lp-logo" onKeyDown={e => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.currentTarget.click();
          }
        }} onClick={() => {
          navigate("/");
        }}>
            <img src="/viyan_logo_new.webp" className="lp-logo-img" alt="MedAssist Logo" />
            <span className="lp-logo-text">MedAssist</span>
          </div>
          <div className="lp-nav-actions">
            <button className="lp-btn-ghost" onClick={() => {
            navigate("/");
          }}>
              ← Back to Home
            </button>
          </div>
        </div>
      </nav>

      {/* Content Layout */}
      <PrivacyPolicyPageSection1 setSearchQuery={setSearchQuery} activeSection={activeSection} sec={sec} />
    </div>;
}