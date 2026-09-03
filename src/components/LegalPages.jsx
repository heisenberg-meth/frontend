import { useState } from "react";
import { TableHeader } from "./common/TableHeader.jsx";
import {
  ArrowLeft,
  Shield,
  FileText,
  Scale,
  Cookie,
  CreditCard,
  Database,
  Lock,
  Server,
  Ban,
  Award,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../styles/LegalPages.css";

const EFFECTIVE_DATE = "01/07/2025";
const COMPANY = "Viyan Info";
const APP = "Viyan MedAssist";
const EMAIL = "support@viyaninfo.com";

const SECTIONS = [
  { id: "privacy", label: "Privacy Policy", icon: Shield },
  { id: "terms", label: "Terms of Service", icon: Scale },
  { id: "eula", label: "EULA", icon: FileText },
  { id: "cookie", label: "Cookie Policy", icon: Cookie },
  { id: "refund", label: "Refund Policy", icon: CreditCard },
  { id: "retention", label: "Data Retention", icon: Database },
  { id: "security", label: "Security Policy", icon: Lock },
  { id: "acceptable", label: "Acceptable Use", icon: Ban },
  { id: "sla", label: "SLA", icon: Server },
  { id: "dpa", label: "Data Processing", icon: Award },
];

function PrivacyPolicy() {
  return (
    <div className="legal-document">
      <h1>Privacy Policy</h1>
      <p className="legal-effective">Effective Date: {EFFECTIVE_DATE}</p>
      <p>
        Welcome to <strong>{APP}</strong> ("{APP}", "we", "our", or "us"). This
        Privacy Policy explains how we collect, use, store, and protect
        information when you use our pharmacy management software.
      </p>

      <h2>1. Information We Collect</h2>

      <h3>1.1 Business Information</h3>
      <ul>
        <li>Pharmacy name and branch details</li>
        <li>Business address, billing and shipping addresses</li>
        <li>GSTIN, Drug License Number, PAN (optional)</li>
      </ul>

      <h3>1.2 User Account Information</h3>
      <ul>
        <li>Full name, email address, mobile number</li>
        <li>
          Password (stored only as a secure hash — we never store plaintext
          passwords)
        </li>
        <li>User role and permissions</li>
        <li>Profile photo (optional)</li>
      </ul>

      <h3>1.3 Customer & Patient Information</h3>
      <p>Your organization may choose to store:</p>
      <ul>
        <li>Customer or patient name, mobile number, email address, address</li>
        <li>Date of birth (optional), gender (optional)</li>
        <li>Prescription details and prescription images</li>
        <li>Purchase history and loyalty points</li>
      </ul>

      <h3>1.4 Supplier Information</h3>
      <ul>
        <li>Supplier name, contact details, GSTIN, Drug License Number</li>
        <li>Address and email</li>
      </ul>

      <h3>1.5 Inventory & Product Information</h3>
      <ul>
        <li>Medicine details (name, manufacturer, HSN code)</li>
        <li>Batch numbers, expiry dates, stock quantities</li>
        <li>Purchase price, selling price, MRP, GST percentage</li>
      </ul>

      <h3>1.6 Billing & Financial Information</h3>
      <ul>
        <li>Sales invoices, purchase invoices, returns, credit notes</li>
        <li>
          Payment references (Payment ID, Order ID, Transaction ID, status)
        </li>
        <li>Subscription billing records</li>
      </ul>

      <h3>1.7 Technical Information</h3>
      <p>We automatically collect:</p>
      <ul>
        <li>IP address, browser type, device information, operating system</li>
        <li>Login history and session identifiers</li>
        <li>Audit logs and error logs</li>
        <li>Cookies required for authentication and security</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>Provide pharmacy management services</li>
        <li>Manage subscriptions and authenticate users</li>
        <li>Generate invoices, reports, and audit trails</li>
        <li>Improve application performance and detect fraud</li>
        <li>Provide customer support</li>
        <li>Comply with legal and regulatory obligations</li>
      </ul>

      <h2>3. Payment Information</h2>
      <p>
        Payments are processed through third-party payment providers. We do{" "}
        <strong>not</strong> store:
      </p>
      <ul>
        <li>Credit/debit card numbers</li>
        <li>CVV or UPI PINs</li>
        <li>Net banking credentials</li>
      </ul>
      <p>
        We store only payment reference identifiers (Payment ID, Order ID,
        Transaction ID, payment status, and gateway response metadata).
      </p>

      <h2>4. Data Security</h2>
      <p>
        We implement reasonable technical and organizational measures including:
      </p>
      <ul>
        <li>HTTPS/TLS encryption for all data in transit</li>
        <li>Bcrypt password hashing with appropriate salt rounds</li>
        <li>Role-based access control (RBAC)</li>
        <li>Comprehensive audit logging</li>
        <li>Regular automated backups</li>
        <li>Secure cloud infrastructure with network isolation</li>
      </ul>

      <h2>5. Data Retention</h2>
      <p>
        Business data is retained for as long as required to provide the service
        or comply with applicable legal obligations (including GST
        record-keeping requirements under Indian law). Deleted accounts may have
        data retained for backup, audit, or statutory purposes as detailed in
        our Data Retention Policy.
      </p>

      <h2>6. Your Rights</h2>
      <p>
        Subject to applicable law (including India's Digital Personal Data
        Protection Act, 2023), you may:
      </p>
      <ul>
        <li>Request access to your personal information</li>
        <li>Request correction of inaccurate data</li>
        <li>Request deletion of your personal data</li>
        <li>Withdraw consent where processing is based on consent</li>
      </ul>

      <h2>7. Third-Party Services</h2>
      <p>
        {APP} may integrate with payment gateways (e.g. Razorpay), email service
        providers, SMS providers, cloud hosting providers, and other third-party
        services. Each third-party service is governed by its own privacy
        policy.
      </p>

      <h2>8. Children's Privacy</h2>
      <p>
        {APP} is not intended for use by individuals under the age of 18 without
        the supervision of a legal guardian.
      </p>

      <h2>9. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will notify
        users of material changes via in-app notification or email. Continued
        use of the software after changes constitutes acceptance of the updated
        policy.
      </p>

      <h2>10. Contact</h2>
      <p>For privacy-related questions, contact:</p>
      <p>
        <strong>{COMPANY}</strong>
        <br />
        Email: {EMAIL}
      </p>
    </div>
  );
}

function TermsOfService() {
  return (
    <div className="legal-document">
      <h1>Terms of Service</h1>
      <p className="legal-effective">Effective Date: {EFFECTIVE_DATE}</p>
      <p>These Terms govern your use of {APP}.</p>

      <h2>1. Acceptance</h2>
      <p>
        By creating an account or using the software, you agree to these Terms.
        If you do not agree, you must not use {APP}.
      </p>

      <h2>2. Eligibility</h2>
      <p>
        You must be at least 18 years of age and legally authorized to enter
        into a binding agreement. If you are using {APP} on behalf of an
        organization, you represent that you have authority to bind that
        organization.
      </p>

      <h2>3. License</h2>
      <p>
        Subject to payment of applicable subscription fees, {COMPANY} grants you
        a limited, non-exclusive, non-transferable license to use {APP} for your
        internal business operations.
      </p>

      <h2>4. User Responsibilities</h2>
      <ul>
        <li>Provide accurate and current information</li>
        <li>Maintain the confidentiality of your login credentials</li>
        <li>Use the software only for lawful purposes</li>
        <li>Ensure that only authorized users access your account</li>
        <li>Comply with all applicable pharmacy regulations and laws</li>
      </ul>

      <h2>5. Prohibited Activities</h2>
      <ul>
        <li>Reverse engineer, decompile, or copy the software</li>
        <li>Sell, redistribute, or sublicense the software</li>
        <li>Share licenses outside your organization</li>
        <li>Attempt unauthorized access to our systems</li>
        <li>Upload malicious software or content</li>
        <li>Use the software for illegal pharmacy operations</li>
      </ul>

      <h2>6. Subscription & Payment</h2>
      <p>
        Access to premium features requires an active subscription. All fees are
        quoted in Indian Rupees (INR) and are inclusive of applicable GST unless
        stated otherwise. Failure to renew may result in suspension of access to
        premium features.
      </p>

      <h2>7. Data Ownership</h2>
      <p>
        You retain ownership of the business data you enter into {APP}.{" "}
        {COMPANY} owns all rights, title, and interest in the software,
        including its source code, design, user interface, database schema, and
        intellectual property.
      </p>

      <h2>8. Availability</h2>
      <p>
        While we strive for high availability, uninterrupted access cannot be
        guaranteed due to maintenance, updates, or circumstances beyond our
        control. Scheduled maintenance will be communicated in advance where
        possible.
      </p>

      <h2>9. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by applicable Indian law, {COMPANY}{" "}
        shall not be liable for indirect, incidental, special, or consequential
        damages arising from the use of the software. Our total liability shall
        not exceed the amount paid by you for the subscription during the
        preceding twelve (12) months.
      </p>

      <h2>10. Force Majeure</h2>
      <p>
        {COMPANY} shall not be liable for delays or failures in performance
        resulting from causes beyond its reasonable control, including natural
        disasters, acts of government, pandemics, power failures, or internet
        disruptions.
      </p>

      <h2>11. Termination</h2>
      <p>
        We may suspend or terminate accounts for non-payment, violation of these
        Terms, or fraudulent or unlawful activity. Upon termination, you must
        cease all use of the software.
      </p>

      <h2>12. Governing Law & Jurisdiction</h2>
      <p>
        These Terms are governed by the laws of India. Any disputes shall be
        subject to the exclusive jurisdiction of the competent courts where{" "}
        {COMPANY} is registered.
      </p>

      <h2>13. Updates to Terms</h2>
      <p>
        We may update these Terms from time to time. Material changes will be
        notified via email or in-app notification. Continued use after changes
        constitutes acceptance.
      </p>

      <h2>14. Contact</h2>
      <p>{EMAIL}</p>
    </div>
  );
}

function EULA() {
  return (
    <div className="legal-document">
      <h1>End User License Agreement (EULA)</h1>
      <p className="legal-effective">Effective Date: {EFFECTIVE_DATE}</p>
      <p>
        This software is licensed, not sold. By installing, accessing, or using{" "}
        {APP}, you agree to this Agreement.
      </p>

      <h2>1. License Grant</h2>
      <p>
        {COMPANY} grants you a limited, non-exclusive, revocable, and
        non-transferable license to use {APP} during your active subscription
        period, solely for your internal pharmacy management operations.
      </p>

      <h2>2. Ownership</h2>
      <p>
        All software, source code, user interface, databases, trademarks, logos,
        documentation, and related intellectual property remain the exclusive
        property of {COMPANY}. Nothing in this Agreement transfers any ownership
        rights to you.
      </p>

      <h2>3. Restrictions</h2>
      <p>You may not:</p>
      <ul>
        <li>Copy the software except for permitted backups</li>
        <li>Modify, adapt, or create derivative works</li>
        <li>Reverse engineer, decompile, or disassemble the software</li>
        <li>Remove or alter copyright notices or proprietary markings</li>
        <li>Rent, lease, sublicense, or resell the software</li>
        <li>Circumvent security or licensing mechanisms</li>
        <li>Share account credentials with unauthorized parties</li>
        <li>Use the software to build a competing product</li>
      </ul>

      <h2>4. Updates</h2>
      <p>
        Software updates, security patches, and new features may be delivered
        automatically or through scheduled releases. Updates are subject to the
        terms of this Agreement.
      </p>

      <h2>5. Support</h2>
      <p>
        Support is provided according to your purchased subscription plan and
        the applicable Service Level Agreement.
      </p>

      <h2>6. Termination</h2>
      <p>
        This license automatically terminates if your subscription expires
        without renewal, you breach this Agreement, or you use the software for
        unlawful purposes. Upon termination, you must immediately stop using the
        software.
      </p>

      <h2>7. Warranty Disclaimer</h2>
      <p>
        The software is provided on an "AS IS" and "AS AVAILABLE" basis without
        warranties of any kind, whether express, implied, or statutory, except
        where required by applicable Indian law.
      </p>

      <h2>8. Limitation of Liability</h2>
      <p>
        {COMPANY}'s total liability under this Agreement shall not exceed the
        amount paid by you for the subscription during the preceding twelve (12)
        months.
      </p>

      <h2>9. Contact</h2>
      <p>{EMAIL}</p>
    </div>
  );
}

function CookiePolicy() {
  return (
    <div className="legal-document">
      <h1>Cookie Policy</h1>
      <p className="legal-effective">Effective Date: {EFFECTIVE_DATE}</p>
      <p>
        {APP} uses cookies and similar technologies to ensure the secure and
        efficient operation of our software.
      </p>

      <h2>1. What Are Cookies</h2>
      <p>
        Cookies are small text files stored on your device when you use our
        application. They help us maintain your session, remember preferences,
        and ensure security.
      </p>

      <h2>2. Cookies We Use</h2>
      <h3>Essential / Authentication Cookies</h3>
      <p>
        Required for login, session management, and security. These cannot be
        disabled as they are necessary for the application to function.
      </p>
      <ul>
        <li>
          <strong>Session Token</strong> — Maintains your authenticated session
        </li>
        <li>
          <strong>Refresh Token</strong> — Enables seamless session renewal
        </li>
        <li>
          <strong>CSRF Token</strong> — Protects against cross-site request
          forgery
        </li>
      </ul>

      <h3>Security Cookies</h3>
      <p>
        Used for device fingerprinting, fraud detection, and brute-force
        protection.
      </p>

      <h3>Preference Cookies</h3>
      <p>
        Store your display preferences such as theme selection (dark/light mode)
        and interface settings.
      </p>

      <h2>3. Local Storage & Session Storage</h2>
      <p>
        We also use browser local storage and session storage for theme
        preferences, cached settings, and temporary application state. These are
        not transmitted to our servers automatically.
      </p>

      <h2>4. Third-Party Cookies</h2>
      <p>
        Our payment gateway provider may set their own cookies during the
        payment process. These are governed by their respective privacy
        policies.
      </p>

      <h2>5. Managing Cookies</h2>
      <p>
        You can manage cookies through your browser settings. However, disabling
        essential cookies will prevent you from using {APP}.
      </p>

      <h2>6. Contact</h2>
      <p>{EMAIL}</p>
    </div>
  );
}

function RefundPolicy() {
  return (
    <div className="legal-document">
      <h1>Refund & Cancellation Policy</h1>
      <p className="legal-effective">Effective Date: {EFFECTIVE_DATE}</p>

      <h2>1. Subscription Cancellation</h2>
      <p>
        You may cancel your subscription at any time from the Settings page.
        Upon cancellation, your access will continue until the end of the
        current billing period. No partial refunds are provided for unused
        portions of a billing period.
      </p>

      <h2>2. Refund Eligibility</h2>
      <ul>
        <li>
          <strong>Within 7 days of first purchase:</strong> Full refund if you
          are unsatisfied, provided no significant usage has occurred.
        </li>
        <li>
          <strong>After 7 days:</strong> Refunds are evaluated on a case-by-case
          basis.
        </li>
        <li>
          <strong>Service disruption:</strong> If {APP} experiences extended
          downtime exceeding SLA commitments, you may be eligible for service
          credit or pro-rata refund.
        </li>
      </ul>

      <h2>3. Non-Refundable Items</h2>
      <ul>
        <li>Add-on services or one-time setup fees</li>
        <li>
          Subscriptions cancelled after the 7-day window with significant usage
        </li>
        <li>Accounts terminated for Terms of Service violations</li>
      </ul>

      <h2>4. Trial Policy</h2>
      <p>
        Free trial periods do not require payment information. No charges will
        occur until you explicitly choose to upgrade to a paid plan.
      </p>

      <h2>5. Renewal</h2>
      <p>
        Subscriptions auto-renew at the end of each billing cycle unless
        cancelled. You will receive a reminder notification before renewal.
      </p>

      <h2>6. How to Request a Refund</h2>
      <p>
        Contact us at {EMAIL} with your account details and reason for the
        refund request. We aim to process all requests within 7–10 business
        days.
      </p>
    </div>
  );
}

function DataRetention() {
  return (
    <div className="legal-document">
      <h1>Data Retention Policy</h1>
      <p className="legal-effective">Effective Date: {EFFECTIVE_DATE}</p>
      <p>
        This policy describes how long we retain different categories of data.
      </p>

      <h2>Retention Schedule</h2>
      <table className="legal-table">
        <TableHeader columns={["Data Category", "Retention Period", "Basis"]} />
        <tbody>
          <tr>
            <td>Sales Invoices & Billing Records</td>
            <td>8 years after creation</td>
            <td>GST/Income Tax compliance</td>
          </tr>
          <tr>
            <td>Purchase Orders & GRN</td>
            <td>8 years after creation</td>
            <td>GST/Income Tax compliance</td>
          </tr>
          <tr>
            <td>Audit Logs</td>
            <td>5 years</td>
            <td>Regulatory & operational</td>
          </tr>
          <tr>
            <td>Customer/Patient Records</td>
            <td>Duration of account + 3 years</td>
            <td>Business & legal requirement</td>
          </tr>
          <tr>
            <td>User Account Data</td>
            <td>Duration of account + 1 year</td>
            <td>Operational</td>
          </tr>
          <tr>
            <td>Authentication Logs</td>
            <td>1 year</td>
            <td>Security</td>
          </tr>
          <tr>
            <td>Error/Crash Logs</td>
            <td>90 days</td>
            <td>Operational</td>
          </tr>
          <tr>
            <td>Backups</td>
            <td>90 days (rolling)</td>
            <td>Disaster recovery</td>
          </tr>
          <tr>
            <td>Deleted Account Data</td>
            <td>30 days after deletion, then purged</td>
            <td>Recovery window</td>
          </tr>
          <tr>
            <td>Expired Medicine Records</td>
            <td>5 years after disposal</td>
            <td>Drug regulatory compliance</td>
          </tr>
        </tbody>
      </table>

      <h2>Data Deletion</h2>
      <p>
        Upon account deletion, personal data is removed within 30 days. Data
        required for legal compliance (invoices, tax records) may be retained in
        anonymized or archived form as required by law.
      </p>

      <h2>Contact</h2>
      <p>{EMAIL}</p>
    </div>
  );
}

function SecurityPolicy() {
  return (
    <div className="legal-document">
      <h1>Security Policy</h1>
      <p className="legal-effective">Effective Date: {EFFECTIVE_DATE}</p>

      <h2>1. Encryption</h2>
      <ul>
        <li>
          <strong>In Transit:</strong> All data transmitted between your browser
          and our servers is encrypted using TLS 1.2+
        </li>
        <li>
          <strong>At Rest:</strong> Sensitive data is encrypted at the database
          level using AES-256
        </li>
      </ul>

      <h2>2. Authentication & Access Control</h2>
      <ul>
        <li>Passwords are hashed using bcrypt with appropriate cost factors</li>
        <li>
          Role-Based Access Control (RBAC) restricts access based on user roles
        </li>
        <li>Device fingerprinting and OTP verification for new devices</li>
        <li>Automatic session expiration and refresh token rotation</li>
      </ul>

      <h2>3. Audit & Monitoring</h2>
      <ul>
        <li>Comprehensive audit logs for all CRUD operations</li>
        <li>Failed login attempt tracking and brute-force protection</li>
        <li>API request logging and anomaly detection</li>
      </ul>

      <h2>4. Infrastructure</h2>
      <ul>
        <li>Hosted on secure cloud infrastructure with network isolation</li>
        <li>Regular automated backups with point-in-time recovery</li>
        <li>DDoS protection and web application firewall</li>
      </ul>

      <h2>5. Incident Response</h2>
      <p>
        In the event of a security breach, we will notify affected users within
        72 hours as required by applicable law and take immediate remedial
        action.
      </p>

      <h2>6. Vulnerability Reporting</h2>
      <p>
        If you discover a security vulnerability, please report it responsibly
        to {EMAIL}. We appreciate responsible disclosure and will acknowledge
        your contribution.
      </p>
    </div>
  );
}

function AcceptableUse() {
  return (
    <div className="legal-document">
      <h1>Acceptable Use Policy</h1>
      <p className="legal-effective">Effective Date: {EFFECTIVE_DATE}</p>
      <p>This policy outlines prohibited activities when using {APP}.</p>

      <h2>Prohibited Activities</h2>
      <ul>
        <li>
          Using {APP} for illegal pharmacy operations or selling controlled
          substances without proper authorization
        </li>
        <li>Sharing account credentials with unauthorized individuals</li>
        <li>Uploading malware, viruses, or malicious code</li>
        <li>
          Attempting unauthorized access to other users' data or our
          infrastructure
        </li>
        <li>Using {APP} to distribute spam or unsolicited communications</li>
        <li>Abusing APIs through excessive requests or scraping</li>
        <li>
          Circumventing security controls, licensing, or access restrictions
        </li>
        <li>Using the platform for money laundering or financial fraud</li>
        <li>Misrepresenting inventory, pricing, or regulatory information</li>
      </ul>

      <h2>Consequences</h2>
      <p>
        Violation of this policy may result in immediate suspension or
        termination of your account without refund, and may be reported to
        relevant law enforcement authorities.
      </p>

      <h2>Contact</h2>
      <p>{EMAIL}</p>
    </div>
  );
}

function SLAPolicy() {
  return (
    <div className="legal-document">
      <h1>Service Level Agreement (SLA)</h1>
      <p className="legal-effective">Effective Date: {EFFECTIVE_DATE}</p>

      <h2>1. Uptime Commitment</h2>
      <p>
        {COMPANY} commits to 99.9% monthly uptime for the {APP} platform,
        measured as total minutes minus downtime divided by total minutes in the
        calendar month.
      </p>

      <h2>2. Exclusions</h2>
      <p>The following are excluded from uptime calculations:</p>
      <ul>
        <li>Scheduled maintenance (communicated 48 hours in advance)</li>
        <li>Force majeure events</li>
        <li>Client-side connectivity issues</li>
        <li>Third-party service outages (payment gateways, SMS providers)</li>
      </ul>

      <h2>3. Support Response Times</h2>
      <table className="legal-table">
        <TableHeader
          columns={[
            "Priority",
            "Description",
            "Response Time",
            "Resolution Target",
          ]}
        />
        <tbody>
          <tr>
            <td>Critical</td>
            <td>Service completely unavailable</td>
            <td>1 hour</td>
            <td>4 hours</td>
          </tr>
          <tr>
            <td>High</td>
            <td>Major feature impaired</td>
            <td>4 hours</td>
            <td>24 hours</td>
          </tr>
          <tr>
            <td>Medium</td>
            <td>Minor feature issue</td>
            <td>8 hours</td>
            <td>72 hours</td>
          </tr>
          <tr>
            <td>Low</td>
            <td>General inquiry</td>
            <td>24 hours</td>
            <td>5 business days</td>
          </tr>
        </tbody>
      </table>

      <h2>4. Support Hours</h2>
      <p>
        Standard support: Monday to Saturday, 9:00 AM to 7:00 PM IST. Critical
        issues are monitored 24/7.
      </p>

      <h2>5. Backup & Recovery</h2>
      <ul>
        <li>Automated daily backups with 90-day retention</li>
        <li>Recovery Point Objective (RPO): 24 hours</li>
        <li>Recovery Time Objective (RTO): 4 hours</li>
      </ul>

      <h2>6. Maintenance Windows</h2>
      <p>
        Scheduled maintenance is performed during off-peak hours (typically
        Sunday 2:00 AM – 6:00 AM IST) with advance notification.
      </p>
    </div>
  );
}

function DPAPolicy() {
  return (
    <div className="legal-document">
      <h1>Data Processing Agreement (DPA)</h1>
      <p className="legal-effective">Effective Date: {EFFECTIVE_DATE}</p>

      <h2>1. Roles</h2>
      <p>
        When you use {APP}, your organization acts as the{" "}
        <strong>Data Controller</strong> (determining the purposes and means of
        processing personal data), and {COMPANY} acts as the{" "}
        <strong>Data Processor</strong> (processing data on your behalf to
        provide the service).
      </p>

      <h2>2. Processing Scope</h2>
      <p>
        {COMPANY} processes personal data only as necessary to provide the {APP}{" "}
        service, including storage, retrieval, backup, and display of data
        entered by your organization.
      </p>

      <h2>3. Security Measures</h2>
      <p>
        {COMPANY} implements appropriate technical and organizational measures
        as described in our Security Policy, including encryption, access
        controls, audit logging, and regular backups.
      </p>

      <h2>4. Sub-processors</h2>
      <p>
        {COMPANY} may engage sub-processors (cloud hosting, email delivery,
        payment processing) to assist in providing the service. A current list
        of sub-processors is available upon request.
      </p>

      <h2>5. Data Location</h2>
      <p>
        Data is primarily stored and processed within India. If any data is
        transferred outside India, appropriate safeguards will be implemented in
        compliance with the Digital Personal Data Protection Act, 2023.
      </p>

      <h2>6. Incident Notification</h2>
      <p>
        {COMPANY} will notify the Data Controller of any personal data breach
        without undue delay and no later than 72 hours after becoming aware of
        the breach.
      </p>

      <h2>7. Data Deletion</h2>
      <p>
        Upon termination of the service agreement, {COMPANY} will delete or
        return all personal data within 30 days, except where retention is
        required by applicable law.
      </p>

      <h2>8. Audit Rights</h2>
      <p>
        The Data Controller may request reasonable audit information to verify
        compliance with this DPA, subject to confidentiality obligations and
        reasonable advance notice.
      </p>

      <h2>9. DPDP Act Compliance</h2>
      <p>
        {COMPANY} commits to compliance with India's Digital Personal Data
        Protection Act, 2023, including implementing appropriate consent
        mechanisms, data minimization practices, and honoring data principal
        rights.
      </p>

      <h2>10. Contact</h2>
      <p>{EMAIL}</p>
    </div>
  );
}

const CONTENT_MAP = {
  privacy: PrivacyPolicy,
  terms: TermsOfService,
  eula: EULA,
  cookie: CookiePolicy,
  refund: RefundPolicy,
  retention: DataRetention,
  security: SecurityPolicy,
  acceptable: AcceptableUse,
  sla: SLAPolicy,
  dpa: DPAPolicy,
};

export default function LegalPages({ initialSection, showBackButton = true }) {
  const [active, setActive] = useState(initialSection || "privacy");
  const navigate = useNavigate();
  const Content = CONTENT_MAP[active];

  return (
    <div className="legal-container">
      {showBackButton && (
        <button className="legal-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back
        </button>
      )}

      <div className="legal-layout">
        <nav className="legal-sidebar" aria-label="Legal documents">
          <div className="legal-sidebar-title">Legal & Compliance</div>
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`legal-nav-btn ${active === id ? "active" : ""}`}
              onClick={() => setActive(id)}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <main className="legal-content">
          {Content && <Content />}

          <div className="legal-footer-notice">
            <p>
              © {new Date().getFullYear()} {COMPANY}. All rights reserved.
            </p>
            <p>
              These documents were last updated on {EFFECTIVE_DATE}. For
              questions, contact {EMAIL}.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
