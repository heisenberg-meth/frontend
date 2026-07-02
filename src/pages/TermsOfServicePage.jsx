import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LandingPage.css";

const SECTIONS = [
  { id: "terms-of-service-header", label: "Terms of Service" },
  { id: "acceptance-of-terms", label: "1. Acceptance of Terms" },
  { id: "definitions", label: "2. Definitions" },
  { id: "eligibility", label: "3. Eligibility" },
  { id: "user-accounts", label: "4. User Accounts" },
  { id: "subscription-plans", label: "5. Subscription Plans" },
  { id: "payments", label: "6. Payments" },
  { id: "taxes", label: "7. Taxes" },
  { id: "free-trial", label: "8. Free Trial" },
  { id: "acceptable-use", label: "9. Acceptable Use" },
  { id: "customer-responsibilities", label: "10. Customer Responsibilities" },
  { id: "intellectual-property", label: "11. Intellectual Property" },
  { id: "customer-data", label: "12. Customer Data" },
  { id: "privacy", label: "13. Privacy" },
  { id: "availability-of-service", label: "14. Availability of Service" },
  { id: "updates", label: "15. Updates" },
  { id: "suspension-termination", label: "16. Suspension and Termination" },
  { id: "data-export", label: "17. Data Export" },
  { id: "disclaimer-warranties", label: "18. Disclaimer of Warranties" },
  { id: "limitation-liability", label: "19. Limitation of Liability" },
  { id: "indemnification", label: "20. Indemnification" },
  { id: "force-majeure", label: "21. Force Majeure" },
  { id: "governing-law", label: "22. Governing Law" },
  { id: "jurisdiction", label: "23. Jurisdiction" },
  { id: "changes-to-terms", label: "24. Changes to These Terms" },
  { id: "severability", label: "25. Severability" },
  { id: "entire-agreement", label: "26. Entire Agreement" },
  { id: "contact-us", label: "27. Contact Us" },
  { id: "acceptance", label: "28. Acceptance" },
];

export default function TermsOfServicePage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("terms-of-service-header");
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [contentElement, setContentElement] = useState(null);

  const contentRef = (node) => {
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
      const totalHeight =
        contentElement.scrollHeight - contentElement.clientHeight;
      if (totalHeight > 0) {
        setScrollProgress((contentElement.scrollTop / totalHeight) * 100);
      }
      setShowBackToTop(contentElement.scrollTop > 400);
    };

    contentElement.addEventListener("scroll", handleScroll);
    return () => contentElement.removeEventListener("scroll", handleScroll);
  }, [contentElement]);

  useEffect(() => {
    if (!contentElement) return;
    const sections = document.querySelectorAll(".legal-section");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        root: contentElement,
        rootMargin: "-20px 0px -60% 0px",
      },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [contentElement]);

  const handleScrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      el.classList.add("section-flash-highlight");
      setTimeout(() => {
        el.classList.remove("section-flash-highlight");
      }, 1500);
    }
  };

  const handleBackToTop = () => {
    if (contentElement) {
      contentElement.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const filteredSections = SECTIONS.filter((sec) =>
    sec.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="lp-root privacy-page-container">
      {/* Reading Progress Bar */}
      <div
        className="reading-progress-bar"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          className="back-to-top"
          onClick={handleBackToTop}
          aria-label="Back to top"
        >
          ↑
        </button>
      )}

      {/* Simplified Nav */}
      <nav className="lp-nav lp-nav--scrolled">
        <div className="lp-nav-inner">
          <div
            className="lp-logo"
            onClick={() => {
              navigate("/");
            }}
          >
            <img
              src="/viyan_logo_new.webp"
              className="lp-logo-img"
              alt="MedAssist Logo"
            />
            <span className="lp-logo-text">MedAssist</span>
          </div>
          <div className="lp-nav-actions">
            <button
              className="lp-btn-ghost"
              onClick={() => {
                navigate("/");
              }}
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </nav>

      {/* Content Layout */}
      <div
        style={{
          paddingTop: "140px",
          paddingBottom: "40px",
          height: "100vh",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        <div className="lp-container" style={{ height: "100%" }}>
          <div className="legal-layout-container">
            {/* Sidebar Navigation */}
            <div className="legal-sidebar-wrapper">
              {/* Search Box */}
              <div className="legal-search-container">
                <span className="legal-search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search terms..."
                  className="legal-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <aside className="legal-sidebar">
                {filteredSections.map((sec) => (
                  <button
                    key={sec.id}
                    className={`legal-sidebar-link ${activeSection === sec.id ? "active" : ""}`}
                    onClick={() => handleScrollTo(sec.id)}
                  >
                    {sec.label}
                  </button>
                ))}
                {filteredSections.length === 0 && (
                  <div
                    style={{
                      padding: "8px 12px",
                      color: "#9ca3af",
                      fontSize: "0.85rem",
                    }}
                  >
                    No matching sections
                  </div>
                )}
              </aside>
            </div>

            {/* Document Content */}
            <main ref={contentRef} className="legal-document-content">
              <h1 id="terms-of-service-header" className="legal-section">
                Terms of Service
              </h1>
              <p className="legal-hero-description">
                Review the terms, rules, and guidelines governing your use of
                the MedAssist platform.
              </p>

              <div className="privacy-meta-tags">
                <span className="privacy-meta-tag">Updated July 1, 2026</span>
                <span>•</span>
                <span>10 min read</span>
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
                  <strong>Company:</strong> VIYAN Infotech Private Limited
                </p>
                <p>
                  <strong>Website:</strong>{" "}
                  <a
                    href="https://medassist.viyaninfo.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    https://medassist.viyaninfo.com/
                  </a>
                </p>
                <p>
                  <strong>Contact Email:</strong>{" "}
                  <a href="mailto:viyanninfo@gmail.com">viyanninfo@gmail.com</a>
                </p>
              </div>

              <hr />

              <h2 id="acceptance-of-terms" className="legal-section">
                1. Acceptance of Terms
              </h2>
              <p>
                Welcome to <strong>MedAssist</strong>, a cloud-based
                Software-as-a-Service (SaaS) platform owned and operated by{" "}
                <strong>VIYAN Infotech Private Limited</strong>.
              </p>
              <p>
                These Terms of Service ("Terms") govern your access to and use
                of MedAssist, including our:
              </p>
              <ul>
                <li>Web Application</li>
                <li>Desktop Applications (Windows, macOS, Linux)</li>
                <li>Mobile Applications (Android & iOS)</li>
                <li>APIs</li>
                <li>Website</li>
                <li>Customer Support Services</li>
              </ul>
              <p>
                By creating an account, accessing, downloading, installing, or
                using MedAssist, you agree to be legally bound by these Terms.
              </p>
              <p>
                If you do not agree with these Terms, you must not access or use
                the Services.
              </p>
              <p>
                If you use MedAssist on behalf of a company, pharmacy, hospital,
                clinic, or other organization, you represent that you have the
                authority to bind that organization to these Terms.
              </p>

              <hr />

              <h2 id="definitions" className="legal-section">
                2. Definitions
              </h2>
              <p>
                <strong>Company</strong> means{" "}
                <strong>VIYAN Infotech Private Limited</strong>.
              </p>
              <p>
                <strong>MedAssist</strong> means the pharmacy management
                software platform operated by the Company.
              </p>
              <p>
                <strong>Customer</strong> means the business or organization
                that purchases or subscribes to MedAssist.
              </p>
              <p>
                <strong>Authorized User</strong> means an employee,
                administrator, pharmacist, cashier, manager, or other individual
                authorized by the Customer to access the Services.
              </p>
              <p>
                <strong>Services</strong> means all software, applications,
                APIs, websites, and support services provided by MedAssist.
              </p>
              <p>
                <strong>Subscription</strong> means a paid or free plan that
                grants access to the Services.
              </p>
              <p>
                <strong>User Content</strong> means any data uploaded, entered,
                stored, or processed through MedAssist, including inventory,
                invoices, supplier information, patient records, reports, and
                documents.
              </p>

              <hr />

              <h2 id="eligibility" className="legal-section">
                3. Eligibility
              </h2>
              <p>You may use MedAssist only if:</p>
              <ul>
                <li>You are at least 18 years old.</li>
                <li>You have the legal authority to enter into these Terms.</li>
                <li>
                  Your business complies with applicable laws and regulations.
                </li>
                <li>
                  You possess all licenses and registrations required to operate
                  your pharmacy or healthcare business.
                </li>
              </ul>

              <hr />

              <h2 id="user-accounts" className="legal-section">
                4. User Accounts
              </h2>
              <p>To access certain features, you must create an account.</p>
              <p>You agree to:</p>
              <ul>
                <li>Provide accurate and complete information.</li>
                <li>Keep your account information up to date.</li>
                <li>Maintain the confidentiality of your login credentials.</li>
                <li>
                  Notify us immediately if you suspect unauthorized access.
                </li>
              </ul>
              <p>
                You are responsible for all activities performed using your
                account.
              </p>

              <hr />

              <h2 id="subscription-plans" className="legal-section">
                5. Subscription Plans
              </h2>
              <p>MedAssist may offer:</p>
              <ul>
                <li>Free Trial</li>
                <li>Free Plan (if available)</li>
                <li>Monthly Subscription</li>
                <li>Annual Subscription</li>
              </ul>
              <p>
                Available features depend on your selected subscription plan.
              </p>
              <p>
                We reserve the right to modify subscription plans, pricing, and
                available features at any time. Changes will not affect your
                current billing period unless otherwise required by law.
              </p>

              <hr />

              <h2 id="payments" className="legal-section">
                6. Payments
              </h2>
              <p>
                Paid subscriptions are billed in{" "}
                <strong>Indian Rupees (INR)</strong>.
              </p>
              <p>
                Payments are securely processed through{" "}
                <strong>Razorpay</strong> or other authorized payment providers.
              </p>
              <p>We do not store:</p>
              <ul>
                <li>Credit Card Numbers</li>
                <li>Debit Card Numbers</li>
                <li>CVV</li>
                <li>UPI PIN</li>
                <li>Net Banking Passwords</li>
              </ul>
              <p>
                You authorize us to charge the applicable subscription fees and
                taxes for your selected plan.
              </p>
              <p>
                Failure to complete payment may result in suspension or
                termination of access to premium features.
              </p>

              <hr />

              <h2 id="taxes" className="legal-section">
                7. Taxes
              </h2>
              <p>
                All applicable taxes, including Goods and Services Tax (GST),
                will be charged in accordance with Indian law unless otherwise
                stated.
              </p>

              <hr />

              <h2 id="free-trial" className="legal-section">
                8. Free Trial
              </h2>
              <p>We may provide a free trial for eligible users.</p>
              <p>At the end of the trial:</p>
              <ul>
                <li>
                  Premium features may become unavailable unless a paid
                  subscription is purchased.
                </li>
                <li>
                  We reserve the right to modify or discontinue free trials at
                  any time.
                </li>
              </ul>

              <hr />

              <h2 id="acceptable-use" className="legal-section">
                9. Acceptable Use
              </h2>
              <p>You agree not to:</p>
              <ul>
                <li>Use MedAssist for unlawful purposes.</li>
                <li>Upload malicious software or harmful code.</li>
                <li>Attempt unauthorized access to our systems.</li>
                <li>
                  Reverse engineer, decompile, or disassemble the software.
                </li>
                <li>Circumvent security mechanisms.</li>
                <li>Share accounts with unauthorized users.</li>
                <li>Use MedAssist to build or support a competing product.</li>
                <li>
                  Violate applicable pharmacy, healthcare, tax, or data
                  protection laws.
                </li>
              </ul>

              <hr />

              <h2 id="customer-responsibilities" className="legal-section">
                10. Customer Responsibilities
              </h2>
              <p>You are responsible for:</p>
              <ul>
                <li>The accuracy of all data entered into MedAssist.</li>
                <li>Maintaining backups where appropriate.</li>
                <li>Compliance with pharmacy regulations.</li>
                <li>Obtaining patient consent where required.</li>
                <li>Managing employee access permissions.</li>
                <li>Protecting your account credentials.</li>
              </ul>

              <hr />

              <h2 id="intellectual-property" className="legal-section">
                11. Intellectual Property
              </h2>
              <p>All intellectual property rights in MedAssist, including:</p>
              <ul>
                <li>Software</li>
                <li>Source Code</li>
                <li>APIs</li>
                <li>Logos</li>
                <li>Branding</li>
                <li>Documentation</li>
                <li>User Interface</li>
                <li>Designs</li>
                <li>Trademarks</li>
              </ul>
              <p>
                remain the exclusive property of{" "}
                <strong>VIYAN Infotech Private Limited</strong>.
              </p>
              <p>
                Nothing in these Terms transfers ownership of our intellectual
                property to you.
              </p>

              <hr />

              <h2 id="customer-data" className="legal-section">
                12. Customer Data
              </h2>
              <p>
                You retain ownership of all data you upload or create using
                MedAssist.
              </p>
              <p>
                You grant us a limited, non-exclusive license to process your
                data solely for the purpose of:
              </p>
              <ul>
                <li>Providing the Services</li>
                <li>Maintaining platform security</li>
                <li>Performing backups</li>
                <li>Troubleshooting</li>
                <li>Improving platform reliability</li>
                <li>Complying with legal obligations</li>
              </ul>
              <p>We do not sell your business or customer data.</p>

              <hr />

              <h2 id="privacy" className="legal-section">
                13. Privacy
              </h2>
              <p>
                Our collection and use of personal information are governed by
                our Privacy Policy.
              </p>
              <p>
                By using MedAssist, you acknowledge that you have read and
                understood our Privacy Policy.
              </p>

              <hr />

              <h2 id="availability-of-service" className="legal-section">
                14. Availability of Service
              </h2>
              <p>We strive to maintain reliable and secure Services.</p>
              <p>However, access may occasionally be interrupted due to:</p>
              <ul>
                <li>Maintenance</li>
                <li>Updates</li>
                <li>Security incidents</li>
                <li>Internet outages</li>
                <li>Third-party provider failures</li>
                <li>Circumstances beyond our reasonable control</li>
              </ul>
              <p>We do not guarantee uninterrupted or error-free operation.</p>

              <hr />

              <h2 id="updates" className="legal-section">
                15. Updates
              </h2>
              <p>We may release:</p>
              <ul>
                <li>Software updates</li>
                <li>Security patches</li>
                <li>Feature improvements</li>
                <li>Bug fixes</li>
              </ul>
              <p>
                Some updates may be mandatory for continued use of the Services.
              </p>

              <hr />

              <h2 id="suspension-termination" className="legal-section">
                16. Suspension and Termination
              </h2>
              <p>We may suspend or terminate access if:</p>
              <ul>
                <li>Subscription fees remain unpaid.</li>
                <li>These Terms are violated.</li>
                <li>Fraudulent or illegal activity is suspected.</li>
                <li>Continued access poses a security risk.</li>
                <li>Required by law.</li>
              </ul>
              <p>You may stop using MedAssist at any time.</p>
              <p>
                Upon termination, access to your account may be suspended or
                removed in accordance with our data retention practices.
              </p>

              <hr />

              <h2 id="data-export" className="legal-section">
                17. Data Export
              </h2>
              <p>
                Where technically available, customers may export their data
                before account termination.
              </p>
              <p>
                After applicable retention and recovery periods, deleted account
                data may be permanently removed from our systems, except where
                retention is required by law.
              </p>

              <hr />

              <h2 id="disclaimer-warranties" className="legal-section">
                18. Disclaimer of Warranties
              </h2>
              <p>
                MedAssist is provided on an <strong>"AS IS"</strong> and{" "}
                <strong>"AS AVAILABLE"</strong> basis.
              </p>
              <p>
                To the maximum extent permitted by law, VIYAN Infotech Private
                Limited disclaims all warranties, whether express, implied,
                statutory, or otherwise, including warranties of
                merchantability, fitness for a particular purpose,
                non-infringement, and uninterrupted availability.
              </p>

              <hr />

              <h2 id="limitation-liability" className="legal-section">
                19. Limitation of Liability
              </h2>
              <p>To the fullest extent permitted by law:</p>
              <p>VIYAN Infotech Private Limited shall not be liable for:</p>
              <ul>
                <li>Loss of profits</li>
                <li>Loss of business</li>
                <li>Loss of goodwill</li>
                <li>Loss of revenue</li>
                <li>Loss of data</li>
                <li>Business interruption</li>
                <li>
                  Indirect, incidental, consequential, punitive, or special
                  damages
                </li>
              </ul>
              <p>
                Our total liability arising out of or relating to the Services
                shall not exceed the subscription fees actually paid by you
                during the twelve (12) months immediately preceding the event
                giving rise to the claim.
              </p>

              <hr />

              <h2 id="indemnification" className="legal-section">
                20. Indemnification
              </h2>
              <p>
                You agree to indemnify and hold harmless VIYAN Infotech Private
                Limited, its directors, employees, officers, affiliates, and
                partners from any claims, damages, liabilities, costs, or
                expenses arising from:
              </p>
              <ul>
                <li>Your misuse of the Services.</li>
                <li>Your violation of these Terms.</li>
                <li>Your violation of applicable laws.</li>
                <li>Data uploaded or processed by you through MedAssist.</li>
              </ul>

              <hr />

              <h2 id="force-majeure" className="legal-section">
                21. Force Majeure
              </h2>
              <p>
                We shall not be liable for delays or failures caused by events
                beyond our reasonable control, including natural disasters, war,
                terrorism, labor disputes, internet outages, government actions,
                cyberattacks, pandemics, or failures of third-party
                infrastructure.
              </p>

              <hr />

              <h2 id="governing-law" className="legal-section">
                22. Governing Law
              </h2>
              <p>
                These Terms shall be governed by and interpreted in accordance
                with the laws of <strong>India</strong>, without regard to
                conflict of law principles.
              </p>

              <hr />

              <h2 id="jurisdiction" className="legal-section">
                23. Jurisdiction
              </h2>
              <p>
                Any dispute arising out of or relating to these Terms shall be
                subject to the exclusive jurisdiction of the competent courts
                where <strong>VIYAN Infotech Private Limited</strong> has its
                registered office.
              </p>

              <hr />

              <h2 id="changes-to-terms" className="legal-section">
                24. Changes to These Terms
              </h2>
              <p>We may modify these Terms from time to time.</p>
              <p>When significant changes are made, we will:</p>
              <ul>
                <li>Update the "Last Updated" date.</li>
                <li>Publish the revised Terms on our website.</li>
                <li>
                  Notify users through the application or by email where
                  required.
                </li>
              </ul>
              <p>
                Continued use of MedAssist after changes become effective
                constitutes acceptance of the revised Terms.
              </p>

              <hr />

              <h2 id="severability" className="legal-section">
                25. Severability
              </h2>
              <p>
                If any provision of these Terms is held to be invalid or
                unenforceable, the remaining provisions shall remain in full
                force and effect.
              </p>

              <hr />

              <h2 id="entire-agreement" className="legal-section">
                26. Entire Agreement
              </h2>
              <p>
                These Terms, together with our Privacy Policy and any additional
                policies expressly incorporated by reference, constitute the
                entire agreement between you and VIYAN Infotech Private Limited
                regarding your use of MedAssist.
              </p>

              <hr />

              <h2 id="contact-us" className="legal-section">
                27. Contact Us
              </h2>
              <p>
                If you have any questions regarding these Terms, please contact:
              </p>
              <p>
                <strong>VIYAN Infotech Private Limited</strong>
                <br />
                <strong>MedAssist Legal Team</strong>
              </p>
              <p>
                Website:
                <br />
                <a
                  href="https://medassist.viyaninfo.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://medassist.viyaninfo.com/
                </a>
              </p>
              <p>
                Email:
                <br />
                <a href="mailto:viyanninfo@gmail.com">viyanninfo@gmail.com</a>
              </p>

              <hr />

              <h2 id="acceptance" className="legal-section">
                28. Acceptance
              </h2>
              <p>
                By creating an account, accessing, downloading, installing, or
                using MedAssist, you acknowledge that you have read, understood,
                and agree to be bound by these Terms of Service.
              </p>
              <p>
                Thank you for choosing <strong>MedAssist</strong>, developed and
                maintained by <strong>VIYAN Infotech Private Limited</strong>.
              </p>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
