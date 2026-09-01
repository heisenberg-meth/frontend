import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Package,
  Receipt,
  BarChart2,
  ScanBarcode,
  Truck,
  CalendarClock,
  ArrowRight,
  Building2,
  Store,
  Pill,
  BoxesIcon,
  Hospital,
  Globe,
} from "lucide-react";
import "../styles/LandingPage.css";
const FEATURES = [
  {
    Icon: Package,
    title: "Smart Inventory",
    tag: "INVENTORY",
    desc: "Monitor inventory, receive low-stock alerts, track medicine batches, and prevent stock shortages.",
    colorA: "#6c63ff",
    colorB: "#3ecfcf",
  },
  {
    Icon: Receipt,
    title: "Billing & POS",
    tag: "SALES",
    desc: "Generate GST invoices, process payments, print receipts, and complete sales in seconds.",
    colorA: "#f093fb",
    colorB: "#f5576c",
  },
  {
    Icon: BarChart2,
    title: "Analytics Hub",
    tag: "ANALYTICS",
    desc: "Gain insights into sales, purchases, profits, inventory trends, and business performance.",
    colorA: "#4facfe",
    colorB: "#00f2fe",
  },
  {
    Icon: ScanBarcode,
    title: "Barcode Management",
    tag: "BARCODES",
    desc: "Scan, generate, and print barcode labels for faster billing and accurate inventory management.",
    colorA: "#fa709a",
    colorB: "#fee140",
  },
  {
    Icon: Truck,
    title: "Supplier Management",
    tag: "PURCHASES",
    desc: "Manage suppliers, purchase orders, returns, and procurement from a centralized dashboard.",
    colorA: "#a18cd1",
    colorB: "#fbc2eb",
  },
  {
    Icon: CalendarClock,
    title: "Expiry Intelligence",
    tag: "EXPIRY",
    desc: "Track medicine batches, receive expiry alerts, and manage disposals before products expire.",
    colorA: "#a1c4fd",
    colorB: "#c2e9fb",
  },
];
const STATS = [
  {
    value: "15+",
    label: "Business Modules",
  },
  {
    value: "100%",
    label: "GST Ready",
  },
  {
    value: "Desktop + Mobile",
    label: "Cross-Platform",
  },
  {
    value: "Enterprise",
    label: "Security Grade",
  },
];
const STEPS = [
  {
    num: "01",
    title: "Create Your Pharmacy",
    desc: "Register your pharmacy, configure business details, and GST settings.",
  },
  {
    num: "02",
    title: "Import Medicines & Inventory",
    desc: "Import medicines using CSV or add them manually to quickly build your inventory and start managing stock.",
  },
  {
    num: "03",
    title: "Start Billing & Manage Sales",
    desc: "Generate GST-compliant invoices, manage inventory in real time, and process sales with an integrated POS.",
  },
  {
    num: "04",
    title: "Monitor Business Performance",
    desc: "Track sales, inventory, purchases, expiry alerts, and reports from a centralized dashboard.",
  },
];
const PLANS = [
  {
    name: "Free Trial",
    price: "₹0",
    duration: "28 Days Free",
    sub: "Full access to all features. No payment required.",
    highlight: false,
    cta: "Start Free Trial",
    features: [
      "28 Days Free Access",
      "Full Platform Access",
      "Inventory Management",
      "Billing & POS",
      "Reports & Analytics",
      "Barcode & QR",
      "Email Support",
      "Up to 5 Users",
    ],
  },
  {
    name: "Professional",
    price: "₹599",
    duration: "/month",
    sub: "For growing pharmacies that need more power.",
    highlight: true,
    cta: "Choose Professional",
    features: [
      "Everything in Free Trial",
      "Up to 10 Users",
      "5 Branches",
      "50,000 Batch Records",
      "Excel & PDF Reports",
      "Premium Analytics",
      "Priority Support",
    ],
  },
];
const PHARMACY_TYPES = [
  {
    Icon: Building2,
    label: "Independent Pharmacies",
    desc: "Solo-run medical shops that need a simple, powerful system.",
    color: "#6c63ff",
  },
  {
    Icon: Store,
    label: "Retail Pharmacy Chains",
    desc: "Multi-outlet chains with centralized billing and reporting.",
    color: "#3ecfcf",
  },
  {
    Icon: Pill,
    label: "Medical Stores",
    desc: "High-volume dispensing with fast POS and barcode scanning.",
    color: "#f093fb",
  },
  {
    Icon: BoxesIcon,
    label: "Wholesale Distributors",
    desc: "Bulk inventory management, supplier tracking, and purchase orders.",
    color: "#4facfe",
  },
  {
    Icon: Hospital,
    label: "Hospital Pharmacies",
    desc: "Integrated prescription workflow with patient and expiry tracking.",
    color: "#43e97b",
  },
  {
    Icon: Globe,
    label: "Multi-Branch Networks",
    desc: "Unified dashboard across locations with role-based team access.",
    color: "#fa709a",
  },
];
function useVisible(ref) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setVisible(true);
      },
      {
        threshold: 0.12,
      },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref]);
  return visible;
}
function AnimSection({ children, className = "" }) {
  const ref = useRef(null);
  const visible = useVisible(ref);
  return (
    <div
      ref={ref}
      className={`lp-anim-section ${visible ? "lp-visible" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
function CountUp({ target }) {
  const isNumber = !isNaN(parseFloat(target.replace(/[^0-9.]/g, "")));
  const [val, setVal] = useState(isNumber ? "0" : target);
  const ref = useRef(null);
  const visible = useVisible(ref);
  useEffect(() => {
    if (!visible || !isNumber) return;
    const num = parseFloat(target.replace(/[^0-9.]/g, ""));
    let cur = 0;
    const step = num / 60;
    const t = setInterval(() => {
      cur += step;
      if (cur >= num) {
        setVal(target);
        clearInterval(t);
      } else {
        setVal(
          Math.floor(cur).toLocaleString("en-IN") +
            target.replace(/[0-9.,]/g, ""),
        );
      }
    }, 18);
    return () => clearInterval(t);
  }, [visible, target, isNumber]);
  return <span ref={ref}>{val}</span>;
}
function LandingPageSection1({
  scrolled,
  downloadOpen,
  downloadRef,
  scrollTo,
  setDownloadOpen,
  navigate,
  setMenuOpen,
  menuOpen,
}) {
  return (
    <nav className={`lp-nav ${scrolled ? "lp-nav--scrolled" : ""}`}>
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
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: "smooth",
            })
          }
        >
          <img
            src="/viyan_logo_new.webp"
            className="lp-logo-img"
            alt="MedAssist Logo"
          />
          <span className="lp-logo-text">MedAssist</span>
        </div>
        <div className={`lp-nav-links ${menuOpen ? "lp-nav-links--open" : ""}`}>
          <button className="lp-nav-link" onClick={() => scrollTo("features")}>
            Features
          </button>
          <button
            className="lp-nav-link"
            onClick={() => scrollTo("how-it-works")}
          >
            How It Works
          </button>
          <button className="lp-nav-link" onClick={() => scrollTo("pricing")}>
            Pricing
          </button>

          {/* Download Dropdown */}
          <div
            className="lp-download-dropdown-wrapper"
            ref={downloadRef}
            onMouseEnter={() => setDownloadOpen(true)}
            onMouseLeave={() => setDownloadOpen(false)}
          >
            <button
              type="button"
              className={`lp-nav-link lp-download-btn ${downloadOpen ? "active" : ""}`}
            >
              Download <span className="lp-dropdown-arrow">▼</span>
            </button>

            {downloadOpen && (
              <div className="lp-download-dropdown-menu">
                <button
                  type="button"
                  className="lp-dropdown-item"
                  onClick={() => setDownloadOpen(false)}
                >
                  <span>⬇</span> Desktop for Windows (.exe)
                </button>
                <button
                  type="button"
                  className="lp-dropdown-item"
                  onClick={() => setDownloadOpen(false)}
                >
                  <span>⬇</span> Desktop for macOS (.dmg)
                </button>
                <button
                  type="button"
                  className="lp-dropdown-item"
                  onClick={() => setDownloadOpen(false)}
                >
                  <span>⬇</span> Desktop for Linux (.AppImage)
                </button>
                <button
                  type="button"
                  className="lp-dropdown-item"
                  onClick={() => setDownloadOpen(false)}
                >
                  <span>🤖</span> Android
                </button>
              </div>
            )}
          </div>

          <button className="lp-nav-link" onClick={() => scrollTo("contact")}>
            Contact
          </button>
        </div>
        <div className="lp-nav-actions">
          <button
            className="lp-btn-ghost"
            id="nav-login-btn"
            onClick={() => navigate("/login")}
          >
            Log In
          </button>
          <button
            className="lp-btn-primary"
            id="nav-get-started-btn"
            onClick={() => navigate("/pricing")}
          >
            Start Free Trial <span className="lp-btn-arrow">→</span>
          </button>
        </div>
        <button
          className="lp-hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="menu"
        >
          <span className={menuOpen ? "open" : ""} />
          <span className={menuOpen ? "open" : ""} />
          <span className={menuOpen ? "open" : ""} />
        </button>
      </div>
    </nav>
  );
}
function LandingPageSection2({ navigate, scrollTo }) {
  return (
    <section className="lp-hero" id="hero">
      <div className="lp-hero-bg">
        <div className="lp-hero-grid" />
        <div className="lp-orb lp-orb-1" />
        <div className="lp-orb lp-orb-2" />
        <div className="lp-orb lp-orb-3" />
        <div className="lp-orb lp-orb-4" />
      </div>

      <div className="lp-hero-content">
        <div className="lp-hero-badge">
          <span className="lp-badge-dot" />
          All-in-One Pharmacy
        </div>
        <h1 className="lp-hero-title">
          The <span className="lp-gradient-text">Complete Platform</span>
          <br />
          for Modern Pharmacy
        </h1>
        <p className="lp-hero-subtitle">
          Manage inventory, billing, POS, purchases, suppliers, GST, reports,
          barcode scanning, expiry tracking, and business analytics — all from
          one modern cloud platform.
        </p>
        <div className="lp-hero-cta">
          <button
            className="lp-btn-primary lp-btn-lg"
            id="hero-start-btn"
            onClick={() => navigate("/pricing")}
          >
            Start Free Trial <span className="lp-btn-arrow">→</span>
          </button>
          <button
            className="lp-btn-outline lp-btn-lg"
            id="hero-demo-btn"
            onClick={() => scrollTo("how-it-works")}
          >
            See How It Works
          </button>
        </div>
        <div className="lp-hero-trust">
          <div className="lp-trust-avatars">
            {["👨‍⚕️", "👩‍⚕️", "🧑‍⚕️", "👩‍💼"].map((e) => (
              <div key={e} className="lp-trust-avatar">
                {e}
              </div>
            ))}
          </div>
          <span>Built for pharmacists &amp; pharmacy owners</span>
        </div>
      </div>

      {/* Dashboard Mockup */}
      <div className="lp-hero-mockup">
        <div className="lp-mockup-window">
          <div className="lp-mockup-bar">
            <span className="lp-dot lp-dot--red" />
            <span className="lp-dot lp-dot--yellow" />
            <span className="lp-dot lp-dot--green" />
            <span className="lp-mockup-url">medassist.com / dashboard</span>
          </div>
          <div className="lp-mockup-body">
            <div className="lp-mock-sidebar">
              {[
                {
                  Icon: BarChart2,
                  name: "barchart",
                },
                {
                  Icon: Package,
                  name: "package",
                },
                {
                  Icon: Receipt,
                  name: "receipt",
                },
                {
                  Icon: ScanBarcode,
                  name: "barcode",
                },
                {
                  Icon: Truck,
                  name: "truck",
                },
                {
                  Icon: CalendarClock,
                  name: "clock",
                },
              ].map((item, i) => (
                <div
                  key={item.name}
                  className={`lp-mock-sidebar-item ${i === 0 ? "active" : ""}`}
                >
                  <item.Icon size={16} />
                </div>
              ))}
            </div>
            <div className="lp-mock-content">
              <div className="lp-mock-header">
                <span className="lp-mock-title">Dashboard Overview</span>
                <span className="lp-mock-live">● LIVE</span>
              </div>
              <div className="lp-mock-stats">
                {[
                  {
                    label: "Total Stock",
                    val: "2,847",
                    trend: "+12%",
                  },
                  {
                    label: "Today Sales",
                    val: "₹18,430",
                    trend: "+8%",
                  },
                  {
                    label: "Low Stock",
                    val: "23",
                    trend: "⚠ Alert",
                  },
                  {
                    label: "Expiring Soon",
                    val: "7",
                    trend: "🔔 Soon",
                  },
                ].map((s) => (
                  <div key={s.label} className="lp-mock-stat-card">
                    <div className="lp-mock-stat-val">{s.val}</div>
                    <div className="lp-mock-stat-label">{s.label}</div>
                    <div className="lp-mock-stat-trend">{s.trend}</div>
                  </div>
                ))}
              </div>
              <div className="lp-mock-chart">
                {[40, 65, 45, 80, 60, 90, 70, 85, 55, 75, 95, 68].map(
                  (h, i) => (
                    <div
                      key={i}
                      className="lp-mock-bar"
                      style={{
                        height: `${h}%`,
                        animationDelay: `${i * 0.05}s`,
                      }}
                    />
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
function LandingPageSection3({ scrollTo, navigate }) {
  return (
    <footer className="lp-footer">
      <div className="lp-container">
        <div className="lp-footer-top">
          <div className="lp-footer-brand">
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
              onClick={() =>
                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                })
              }
            >
              <img
                src="/viyan_logo_new.webp"
                className="lp-logo-img"
                alt="MedAssist Logo"
              />
              <span className="lp-logo-text">MedAssist</span>
            </div>
            <p className="lp-footer-tagline">
              Helping pharmacies simplify inventory, billing, purchases, GST,
              reports, and daily operations with one intelligent cloud platform.
            </p>
            <div className="lp-footer-socials">
              <a
                href="https://www.linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="lp-social-link"
              >
                in
              </a>
            </div>
          </div>
          <div className="lp-footer-links">
            <div className="lp-footer-col">
              <div className="lp-footer-col-title">Product</div>
              <a
                href="#features"
                className="lp-footer-link"
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo("features");
                }}
              >
                Features
              </a>
              <a
                href="#pricing"
                className="lp-footer-link"
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo("pricing");
                }}
              >
                Pricing
              </a>
              <a
                href="#desktop-app"
                className="lp-footer-link"
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo("desktop-app");
                }}
              >
                Desktop App
              </a>
              <a
                href="#mobile-app"
                className="lp-footer-link"
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo("mobile-app");
                }}
              >
                Mobile App
              </a>
              <a
                href="#documentation"
                className="lp-footer-link"
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo("documentation");
                }}
              >
                Documentation
              </a>
            </div>
            <div className="lp-footer-col">
              <div className="lp-footer-col-title">Company</div>
              <a
                href="https://www.viyaninfo.com/about"
                target="_blank"
                rel="noopener noreferrer"
                className="lp-footer-link"
              >
                About Us
              </a>
              <a
                href="https://www.viyaninfo.com/contact"
                target="_blank"
                rel="noopener noreferrer"
                className="lp-footer-link"
              >
                Contact
              </a>
            </div>
            <div className="lp-footer-col">
              <div className="lp-footer-col-title">Legal</div>
              <a
                href="/privacy-policy"
                className="lp-footer-link"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/privacy-policy");
                  window.scrollTo(0, 0);
                }}
              >
                Privacy Policy
              </a>
              <a
                href="/terms-of-service"
                className="lp-footer-link"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/terms-of-service");
                  window.scrollTo(0, 0);
                }}
              >
                Terms of Service
              </a>
              <a
                href="/cookie-policy"
                className="lp-footer-link"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/cookie-policy");
                  window.scrollTo(0, 0);
                }}
              >
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
        <div className="lp-footer-bottom">
          <span>© 2026 MedAssist. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
export default function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const downloadRef = useRef(null);
  useEffect(() => {
    let timerId;
    if (location.state?.scrollToSection) {
      const sectionId = location.state.scrollToSection;
      navigate("/", {
        replace: true,
        state: {},
      });
      timerId = setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({
          behavior: "smooth",
        });
      }, 200);
    }
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [location.pathname, location.state, navigate]);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (downloadRef.current && !downloadRef.current.contains(e.target)) {
        setDownloadOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);
  const scrollTo = (id) => {
    setMenuOpen(false);
    setDownloadOpen(false);
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
    });
  };
  return (
    <div className="lp-root">
      {/* ── NAV ── */}
      <LandingPageSection1
        scrolled={scrolled}
        downloadOpen={downloadOpen}
        downloadRef={downloadRef}
        scrollTo={scrollTo}
        setDownloadOpen={setDownloadOpen}
        navigate={navigate}
        setMenuOpen={setMenuOpen}
        menuOpen={menuOpen}
      />

      {/* ── HERO ── */}
      <LandingPageSection2 navigate={navigate} scrollTo={scrollTo} />

      {/* ── STATS ── */}
      <section className="lp-stats-bar">
        <div className="lp-container">
          {STATS.map((s) => (
            <div key={s.label} className="lp-stat-item">
              <div className="lp-stat-value">
                <CountUp target={s.value} />
              </div>
              <div className="lp-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="lp-section" id="features">
        <div className="lp-container">
          <AnimSection>
            <div className="lp-section-tag">Everything You Need</div>
            <h2 className="lp-section-title">
              Manage Every Pharmacy Operation{" "}
              <span className="lp-gradient-text">from One Place</span>
            </h2>
            <p className="lp-section-sub">
              Built to help pharmacies operate faster, reduce errors, stay
              compliant, and make smarter business decisions — all from one
              platform.
            </p>
          </AnimSection>
          <div className="lp-features-grid">
            {FEATURES.map((f, i) => (
              <AnimSection key={f.title}>
                <div
                  className="lp-feature-card"
                  style={{
                    "--card-color-a": f.colorA,
                    "--card-color-b": f.colorB,
                    animationDelay: `${i * 0.07}s`,
                  }}
                >
                  <div className="lp-feature-icon-wrap">
                    <f.Icon size={22} className="lp-feature-icon-svg" />
                  </div>
                  <div className="lp-feature-tag">{f.tag}</div>
                  <h3 className="lp-feature-title">{f.title}</h3>
                  <p className="lp-feature-desc">{f.desc}</p>
                  <div className="lp-feature-arrow">
                    <ArrowRight size={15} />
                  </div>
                </div>
              </AnimSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── PHARMACY TYPES ── */}
      <section className="lp-section lp-pharma-types-section">
        <div className="lp-container">
          <AnimSection>
            <div className="lp-section-tag">Who It’s For</div>
            <h2 className="lp-section-title">
              Built for Every{" "}
              <span className="lp-gradient-text">Pharmacy Business</span>
            </h2>
            <p className="lp-section-sub">
              Whether you run a single store or a nationwide chain, MedAssist
              adapts to how your business works.
            </p>
          </AnimSection>
          <div className="lp-pharma-types-grid">
            {PHARMACY_TYPES.map((pt, i) => (
              <AnimSection key={pt.label}>
                <div
                  className="lp-pharma-type-card"
                  style={{
                    "--pt-color": pt.color,
                    animationDelay: `${i * 0.07}s`,
                  }}
                >
                  <div className="lp-pharma-type-icon">
                    <pt.Icon size={20} className="lp-pharma-type-icon-svg" />
                  </div>
                  <div className="lp-pharma-type-body">
                    <div className="lp-pharma-type-label">{pt.label}</div>
                    <div className="lp-pharma-type-desc">{pt.desc}</div>
                  </div>
                </div>
              </AnimSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="lp-section lp-section--alt" id="how-it-works">
        <div className="lp-container">
          <AnimSection>
            <div className="lp-section-tag">How It Works</div>
            <h2 className="lp-section-title">
              Set Up Your Pharmacy{" "}
              <span className="lp-gradient-text">with Ease</span>
            </h2>
            <p className="lp-section-sub">
              Create your pharmacy, import your inventory, start billing, and
              manage your business — all from one intuitive platform.
            </p>
          </AnimSection>
          <div className="lp-steps">
            {STEPS.map((s, i) => (
              <AnimSection key={s.num}>
                <div
                  className="lp-step"
                  style={{
                    animationDelay: `${i * 0.12}s`,
                  }}
                >
                  <div className="lp-step-num">{s.num}</div>
                  <h3 className="lp-step-title">{s.title}</h3>
                  <p className="lp-step-desc">{s.desc}</p>
                </div>
              </AnimSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="lp-section" id="pricing">
        <div className="lp-container">
          <AnimSection>
            <div className="lp-section-tag">Pricing</div>
            <h2 className="lp-section-title">
              Choose the Right Plan{" "}
              <span className="lp-gradient-text-2">for Your Pharmacy</span>
            </h2>
            <p className="lp-section-sub">
              Flexible plans designed for independent pharmacies and growing
              pharmacy businesses.
            </p>
          </AnimSection>
          <div className="lp-plans">
            {PLANS.map((plan) => (
              <AnimSection key={plan.name}>
                <div
                  className={`lp-plan-card ${plan.highlight ? "lp-plan-card--highlight" : ""}`}
                >
                  {plan.highlight && (
                    <div className="lp-plan-popular">Most Popular ⭐</div>
                  )}
                  <div className="lp-plan-name">{plan.name}</div>
                  <div className="lp-plan-sub-desc">{plan.sub}</div>
                  <div className="lp-plan-price">
                    {plan.price}
                    <span
                      className={
                        plan.duration.startsWith("/")
                          ? "lp-plan-dur"
                          : "lp-plan-dur-badge"
                      }
                    >
                      {plan.duration}
                    </span>
                  </div>
                  <ul className="lp-plan-features">
                    {plan.features.map((f, i) => (
                      <li key={`${plan.name}-feat-${i}`}>
                        <span className="lp-check">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    className={
                      plan.highlight
                        ? "lp-btn-primary lp-btn-full"
                        : "lp-btn-outline lp-btn-full"
                    }
                    id={`plan-${plan.name.toLowerCase()}-btn`}
                    onClick={() => navigate("/pricing")}
                  >
                    {plan.cta}
                  </button>
                </div>
              </AnimSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="lp-cta-banner" id="contact">
        <div className="lp-cta-orb lp-cta-orb--1" />
        <div className="lp-cta-orb lp-cta-orb--2" />
        <AnimSection>
          <div className="lp-cta-content">
            <h2 className="lp-cta-title">
              Ready to Uplift
              <br />
              <span className="lp-gradient-text">Your Pharmacy?</span>
            </h2>
            <p className="lp-cta-sub">
              Simplify inventory, billing, purchases, GST, reports, and daily
              operations with one modern pharmacy management platform.
            </p>
            <div className="lp-cta-actions">
              <button
                className="lp-btn-primary lp-btn-lg"
                id="cta-start-btn"
                onClick={() => navigate("/pricing")}
              >
                View Plans & Start Free <span className="lp-btn-arrow">→</span>
              </button>
            </div>
          </div>
        </AnimSection>
      </section>

      {/* ── MISSING LINK TARGETS (React Doctor) ── */}
      <div id="desktop-app" aria-hidden="true" />
      <div id="mobile-app" aria-hidden="true" />
      <div id="documentation" aria-hidden="true" />

      {/* ── FOOTER ── */}
      <LandingPageSection3 scrollTo={scrollTo} navigate={navigate} />
    </div>
  );
}
