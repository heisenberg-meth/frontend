import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LandingPage.css";
const SECTIONS = [
  {
    id: "cookie-policy-header",
    label: "Cookie Policy",
  },
  {
    id: "introduction",
    label: "1. Introduction",
  },
  {
    id: "what-are-cookies",
    label: "2. What Are Cookies?",
  },
  {
    id: "what-is-browser-storage",
    label: "3. What Is Browser Storage?",
  },
  {
    id: "why-we-use-cookies-storage",
    label: "4. Why We Use Cookies & Storage",
  },
  {
    id: "types-of-cookies-storage",
    label: "5. Types of Cookies and Storage",
  },
  {
    id: "cookie-inventory",
    label: "6. Cookie Inventory",
  },
  {
    id: "third-party-cookies",
    label: "7. Third-Party Cookies",
  },
  {
    id: "managing-cookies",
    label: "8. Managing Cookies",
  },
  {
    id: "what-happens-if-disabled",
    label: "9. What Happens If You Disable Cookies?",
  },
  {
    id: "data-security",
    label: "10. Data Security",
  },
  {
    id: "childrens-privacy",
    label: "11. Children's Privacy",
  },
  {
    id: "international-users",
    label: "12. International Users",
  },
  {
    id: "changes-to-policy",
    label: "13. Changes to This Policy",
  },
  {
    id: "contact-us",
    label: "14. Contact Us",
  },
  {
    id: "acceptance",
    label: "15. Acceptance",
  },
];
const handleScrollTo = (id) => {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    el.classList.add("section-flash-highlight");
    setTimeout(() => {
      el.classList.remove("section-flash-highlight");
    }, 1500);
  }
};
function CookiePolicyPageSection1({
  searchQuery,
  setSearchQuery,
  filteredSections,
  activeSection,
  contentRef,
}) {
  return (
    <div
      style={{
        paddingTop: "140px",
        paddingBottom: "40px",
        height: "100vh",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <div
        className="lp-container"
        style={{
          height: "100%",
        }}
      >
        <div className="legal-layout-container">
          {/* Sidebar Navigation */}
          <div className="legal-sidebar-wrapper">
            {/* Search Box */}
            <div className="legal-search-container">
              <span className="legal-search-icon">🔍</span>
              <>
                <label htmlFor="field_wy60x2" className="sr-only">
                  Search policy...
                </label>
                <input
                  type="text"
                  placeholder="Search policy..."
                  className="legal-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  id="field_wy60x2"
                />
              </>
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
            <h1 id="cookie-policy-header" className="legal-section">
              Cookie & Browser Storage Policy
            </h1>
            <p className="legal-hero-description">
              Understand how we use cookies, local storage, and secure
              credentials to keep your sessions safe and optimize performance.
            </p>

            <div className="privacy-meta-tags">
              <span className="privacy-meta-tag">Updated July 1, 2026</span>
              <span>•</span>
              <span>8 min read</span>
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

            <h2 id="introduction" className="legal-section">
              1. Introduction
            </h2>
            <p>
              This Cookie & Browser Storage Policy explains how{" "}
              <strong>VIYAN Infotech Private Limited</strong> ("Company",
              "MedAssist", "we", "our", or "us") uses cookies, browser storage,
              secure device storage, and similar technologies when you use the
              MedAssist platform.
            </p>
            <p>This policy applies to:</p>
            <ul>
              <li>MedAssist Web Application</li>
              <li>MedAssist Desktop Application (Windows, macOS, Linux)</li>
              <li>MedAssist Mobile Applications (Android & iOS)</li>
              <li>Official Website</li>
            </ul>
            <p>
              By using MedAssist, you agree to the use of cookies and browser
              storage technologies as described in this Policy.
            </p>

            <hr />

            <h2 id="what-are-cookies" className="legal-section">
              2. What Are Cookies?
            </h2>
            <p>
              Cookies are small text files stored on your browser or device that
              help websites remember information between visits.
            </p>
            <p>Cookies may be:</p>
            <ul>
              <li>Session Cookies (deleted when your browser closes)</li>
              <li>
                Persistent Cookies (remain until they expire or are deleted)
              </li>
            </ul>
            <p>
              Cookies help us provide secure authentication, remember
              preferences, and improve the user experience.
            </p>

            <hr />

            <h2 id="what-is-browser-storage" className="legal-section">
              3. What Is Browser Storage?
            </h2>
            <p>
              Modern applications also use browser storage technologies,
              including:
            </p>
            <ul>
              <li>Local Storage</li>
              <li>Session Storage</li>
              <li>Secure Device Storage</li>
            </ul>
            <p>
              Unlike cookies, information stored in Local Storage or Session
              Storage remains on your device and is not automatically sent with
              every request.
            </p>
            <p>
              Desktop and mobile applications may also use secure operating
              system storage such as:
            </p>
            <ul>
              <li>Windows Credential Manager</li>
              <li>macOS Keychain</li>
              <li>Linux Secure Storage</li>
              <li>Android Encrypted Storage</li>
              <li>iOS Keychain</li>
            </ul>
            <p>to securely store authentication credentials.</p>

            <hr />

            <h2 id="why-we-use-cookies-storage" className="legal-section">
              4. Why We Use Cookies & Storage
            </h2>
            <p>We use cookies and browser storage to:</p>
            <ul>
              <li>Authenticate users</li>
              <li>Maintain secure login sessions</li>
              <li>Protect against unauthorized access</li>
              <li>Prevent Cross-Site Request Forgery (CSRF)</li>
              <li>Remember user preferences</li>
              <li>Store interface settings</li>
              <li>Improve platform performance</li>
              <li>Process subscription payments</li>
              <li>Maintain secure application functionality</li>
            </ul>
            <p>We do not use cookies to sell your personal information.</p>

            <hr />

            <h2 id="types-of-cookies-storage" className="legal-section">
              5. Types of Cookies and Storage
            </h2>

            <h3>5.1 Essential Authentication Cookies</h3>
            <p>
              These cookies are required for MedAssist to function correctly.
            </p>
            <p>They help:</p>
            <ul>
              <li>Authenticate users</li>
              <li>Verify sessions</li>
              <li>Maintain login state</li>
              <li>Protect user accounts</li>
              <li>Secure API requests</li>
            </ul>
            <p>Without these cookies, MedAssist cannot operate properly.</p>
            <p>Examples include:</p>
            <ul>
              <li>Authentication Tokens</li>
              <li>Refresh Tokens</li>
              <li>CSRF Protection Tokens</li>
              <li>Session Identifiers</li>
            </ul>

            <hr />

            <h3>5.2 Functional Storage</h3>
            <p>Functional storage remembers your application preferences.</p>
            <p>Examples include:</p>
            <ul>
              <li>Theme Preference (Light/Dark)</li>
              <li>Sidebar State</li>
              <li>Dashboard Layout</li>
              <li>Language Preference</li>
              <li>User Interface Settings</li>
            </ul>
            <p>
              Deleting this storage resets the application to its default
              appearance.
            </p>

            <hr />

            <h3>5.3 Secure Device Storage</h3>
            <p>
              Desktop and mobile applications securely store authentication
              information using operating system security features whenever
              available.
            </p>
            <p>This helps protect user sessions against unauthorized access.</p>

            <hr />

            <h3>5.4 Payment Cookies</h3>
            <p>
              When purchasing a subscription, our payment provider may use
              cookies to:
            </p>
            <ul>
              <li>Process payments</li>
              <li>Prevent fraud</li>
              <li>Verify payment sessions</li>
              <li>Complete secure checkout</li>
            </ul>
            <p>
              These cookies are controlled by the payment provider according to
              its own privacy practices.
            </p>

            <hr />

            <h2 id="cookie-inventory" className="legal-section">
              6. Cookie Inventory
            </h2>
            <p>
              The following categories of cookies and storage technologies may
              be used by MedAssist.
            </p>
            <table className="legal-table">
              <thead>
                <tr>
                  <th>Name / Category</th>
                  <th>Purpose</th>
                  <th>Provider</th>
                  <th>Required</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Authentication Token</td>
                  <td>User authentication</td>
                  <td>MedAssist</td>
                  <td>Yes</td>
                </tr>
                <tr>
                  <td>Refresh Token</td>
                  <td>Session renewal</td>
                  <td>MedAssist</td>
                  <td>Yes</td>
                </tr>
                <tr>
                  <td>CSRF Token</td>
                  <td>Security protection</td>
                  <td>MedAssist</td>
                  <td>Yes</td>
                </tr>
                <tr>
                  <td>Theme Preference</td>
                  <td>Store UI theme</td>
                  <td>MedAssist</td>
                  <td>No</td>
                </tr>
                <tr>
                  <td>Layout Preferences</td>
                  <td>Store dashboard layout</td>
                  <td>MedAssist</td>
                  <td>No</td>
                </tr>
                <tr>
                  <td>Language Preference</td>
                  <td>Remember selected language</td>
                  <td>MedAssist</td>
                  <td>No</td>
                </tr>
                <tr>
                  <td>Payment Session</td>
                  <td>Subscription checkout</td>
                  <td>Razorpay</td>
                  <td>During payment only</td>
                </tr>
              </tbody>
            </table>
            <p>
              The exact names of cookies or storage keys may change as the
              platform evolves.
            </p>

            <hr />

            <h2 id="third-party-cookies" className="legal-section">
              7. Third-Party Cookies
            </h2>
            <p>
              Certain third-party services integrated with MedAssist may create
              cookies or similar storage technologies.
            </p>
            <p>Currently these include:</p>
            <ul>
              <li>Razorpay (Payment Processing)</li>
            </ul>
            <p>
              Future integrations may include additional providers as required
              to support MedAssist services.
            </p>
            <p>
              Any new third-party technologies will be disclosed through updates
              to this Policy.
            </p>

            <hr />

            <h2 id="managing-cookies" className="legal-section">
              8. Managing Cookies
            </h2>
            <p>Most browsers allow you to:</p>
            <ul>
              <li>View stored cookies</li>
              <li>Delete cookies</li>
              <li>Block cookies</li>
              <li>Restrict third-party cookies</li>
              <li>Clear Local Storage</li>
              <li>Clear Session Storage</li>
            </ul>
            <p>
              Browser settings can usually be found under the Privacy or
              Security section.
            </p>
            <p>
              Desktop and mobile application users can remove locally stored
              session information by signing out or uninstalling the
              application.
            </p>

            <hr />

            <h2 id="what-happens-if-disabled" className="legal-section">
              9. What Happens If You Disable Cookies?
            </h2>
            <p>If essential cookies are disabled:</p>
            <ul>
              <li>Login may not function.</li>
              <li>Secure sessions may not be maintained.</li>
              <li>Authentication may fail.</li>
              <li>Certain features may become unavailable.</li>
              <li>Subscription checkout may not work properly.</li>
            </ul>
            <p>
              Functional cookies are optional but improve your user experience.
            </p>

            <hr />

            <h2 id="data-security" className="legal-section">
              10. Data Security
            </h2>
            <p>
              Authentication cookies and browser storage are protected using
              industry-standard security measures where applicable.
            </p>
            <p>We implement safeguards including:</p>
            <ul>
              <li>HTTPS</li>
              <li>TLS Encryption</li>
              <li>Secure Session Management</li>
              <li>CSRF Protection</li>
              <li>Access Controls</li>
              <li>Secure Authentication Mechanisms</li>
            </ul>
            <p>
              Desktop and mobile applications also use secure operating system
              storage whenever supported.
            </p>

            <hr />

            <h2 id="childrens-privacy" className="legal-section">
              11. Children's Privacy
            </h2>
            <p>MedAssist is intended for business and professional use.</p>
            <p>
              We do not knowingly use cookies or browser storage technologies to
              collect information directly from children under 18 years of age.
            </p>

            <hr />

            <h2 id="international-users" className="legal-section">
              12. International Users
            </h2>
            <p>
              If you access MedAssist from outside India, cookies and browser
              storage technologies may operate according to applicable laws in
              your jurisdiction.
            </p>
            <p>
              By continuing to use the Services, you consent to the processing
              described in this Policy, subject to applicable legal
              requirements.
            </p>

            <hr />

            <h2 id="changes-to-policy" className="legal-section">
              13. Changes to This Policy
            </h2>
            <p>
              We may update this Cookie & Browser Storage Policy from time to
              time.
            </p>
            <p>When changes are made:</p>
            <ul>
              <li>The "Last Updated" date will be revised.</li>
              <li>The latest version will be published on our website.</li>
              <li>
                Material changes may also be communicated through the
                application or by email where appropriate.
              </li>
            </ul>
            <p>
              Your continued use of MedAssist after any changes become effective
              constitutes acceptance of the revised Policy.
            </p>

            <hr />

            <h2 id="contact-us" className="legal-section">
              14. Contact Us
            </h2>
            <p>
              If you have any questions regarding this Cookie & Browser Storage
              Policy, please contact:
            </p>
            <p>
              <strong>VIYAN Infotech Private Limited</strong>
              <br />
              <strong>MedAssist Privacy & Compliance Team</strong>
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
              15. Acceptance
            </h2>
            <p>
              By accessing or using MedAssist, you acknowledge that you have
              read, understood, and agreed to this Cookie & Browser Storage
              Policy.
            </p>
            <p>
              Thank you for choosing <strong>MedAssist</strong>, developed and
              maintained by <strong>VIYAN Infotech Private Limited</strong>.
            </p>
          </main>
        </div>
      </div>
    </div>
  );
}
export default function CookiePolicyPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("cookie-policy-header");
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
    return () => {
      sections.forEach((section) => observer.unobserve(section));
      observer.disconnect();
    };
  }, [contentElement]);
  const handleBackToTop = () => {
    if (contentElement) {
      contentElement.scrollTo({
        top: 0,
        behavior: "smooth",
      });
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
        style={{
          width: `${scrollProgress}%`,
        }}
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
            role="button"
            tabIndex={0}
            className="lp-logo"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.currentTarget.click();
              }
            }}
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
      <CookiePolicyPageSection1
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filteredSections={filteredSections}
        activeSection={activeSection}
        contentRef={contentRef}
      />
    </div>
  );
}
