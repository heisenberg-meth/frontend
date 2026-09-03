import { useNavigate } from "react-router-dom";

export default function LegalHeaderNav() {
  const navigate = useNavigate();
  return (
    <nav className="lp-nav lp-nav--scrolled">
      <div className="lp-nav-inner">
        <button
          type="button"
          className="lp-logo"
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
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
        </button>
        <div className="lp-nav-actions">
          <button
            type="button"
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
  );
}
