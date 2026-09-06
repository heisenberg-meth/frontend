import { useState, useEffect } from "react";
import { Loader2, AlertTriangle, Briefcase } from "lucide-react";
import api from "../../api.js";
import { API_ROUTES } from "../../constants/api.routes.js";
import { useNavigate } from "react-router-dom";
function PurchaseReportSection1({ comparisonData, navigate, supplierSpend }) {
  const activeComparisonData = comparisonData.filter(
    (d) => Number(d.amount || 0) > 0,
  );
  const maxPurchaseAmount = Math.max(
    ...activeComparisonData.map((d) => Number(d.amount || 0)),
    1,
  );

  return (
    <div className="report-charts-grid">
      <div className="pos-card">
        <div className="pos-card-title">
          Purchases Trend (last 4 active periods)
        </div>
        <div
          style={{
            height: "240px",
            marginTop: "32px",
            display: "flex",
            alignItems: "flex-end",
            gap: "18px",
            padding: "0 12px",
          }}
        >
          {activeComparisonData.length > 0 ? (
            activeComparisonData.map((item, index) => {
              const percentage = Math.max(
                8,
                Math.round(
                  (Number(item.amount || 0) / maxPurchaseAmount) * 100,
                ),
              );
              return (
                <div
                  key={`${item.period}-${index}`}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                      color: "var(--text-primary)",
                    }}
                  >
                    ₹{Number(item.amount || 0).toLocaleString()}
                  </span>

                  <div
                    style={{
                      width: "100%",
                      maxWidth: "70px",
                      height: `${percentage}%`,
                      minHeight: "8px",
                      background: "var(--info)",
                      borderRadius: "6px 6px 0 0",
                      transition: "height 0.35s ease",
                    }}
                  />

                  <span
                    style={{
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      whiteSpace: "nowrap",
                      textAlign: "center",
                    }}
                  >
                    {item.period}
                  </span>
                </div>
              );
            })
          ) : (
            <div
              style={{
                height: "240px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted)",
              }}
            >
              No purchase data available for this period
            </div>
          )}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "20px",
            marginTop: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "var(--info)",
              }}
            />{" "}
            Purchases
          </div>
        </div>
      </div>

      <div className="pos-card">
        <div className="pos-card-title">Supplier-wise Spend</div>
        <div
          style={{
            marginTop: "32px",
          }}
        >
          {supplierSpend.map((s) => (
            <div
              role="button"
              tabIndex={0}
              key={s.name}
              className="med-revenue-row"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.currentTarget.click();
                }
              }}
              onClick={() => navigate("/suppliers")}
            >
              <span className="med-name-label">{s.name}</span>
              <div className="med-bar-bg">
                <div
                  className="med-bar-fill"
                  style={{
                    width: `${s.percentage}%`,
                    background: "var(--info)",
                  }}
                />
              </div>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: "13px",
                  width: "80px",
                  textAlign: "right",
                }}
              >
                ₹{(s.amount || 0).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
export default function PurchaseReport({ from, to }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState(null);
  const [data, setData] = useState(null);
  useEffect(() => {
    let ignore = false;
    const fetchPurchases = async () => {
      setLoading(true);
      setErrorState(null);
      try {
        const res = await api.get(
          API_ROUTES.REPORTS_PURCHASES || "reports/purchases",
          {
            params: {
              from,
              to,
            },
          },
        );
        if (!ignore) {
          if (res.data && res.data.success) {
            setData(res.data.data);
          } else {
            setErrorState("Invalid API response format");
          }
        }
      } catch (err) {
        console.error("Purchase fetch error:", err);
        if (!ignore) {
          setErrorState(
            err.response?.data?.error ||
              err.message ||
              "Failed to load purchase report",
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };
    if (from && to) {
      fetchPurchases();
    }
    return () => {
      ignore = true;
    };
  }, [from, to]);
  if (loading) {
    return (
      <div
        className="reports-loading"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "300px",
          gap: "12px",
        }}
      >
        <Loader2 className="animate-spin" size={36} color="var(--primary)" />
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "14px",
          }}
        >
          Loading purchase intelligence data...
        </p>
      </div>
    );
  }
  if (errorState) {
    return (
      <div
        className="empty-state-card"
        style={{
          padding: "40px",
          textAlign: "center",
          border: "1px solid rgba(220,53,69,0.2)",
          background: "rgba(220,53,69,0.05)",
          borderRadius: "8px",
        }}
      >
        <AlertTriangle
          size={36}
          color="var(--danger)"
          style={{
            marginBottom: "12px",
          }}
        />
        <h4
          style={{
            fontWeight: 700,
            color: "var(--danger)",
          }}
        >
          Purchase Report Error
        </h4>
        <p
          style={{
            color: "var(--text-muted)",
            marginTop: "6px",
          }}
        >
          {errorState?.message || String(errorState)}
        </p>
      </div>
    );
  }
  if (!data || !data.supplierSpend.length) {
    return (
      <div
        className="empty-state-card"
        style={{
          padding: "60px 20px",
          textAlign: "center",
        }}
      >
        <Briefcase
          size={40}
          color="var(--text-muted)"
          style={{
            marginBottom: "12px",
          }}
        />
        <h4
          style={{
            fontWeight: 700,
          }}
        >
          No purchase data found
        </h4>
        <p
          style={{
            color: "var(--text-muted)",
            marginTop: "6px",
          }}
        >
          There are no purchase transactions recorded in the selected period.
        </p>
      </div>
    );
  }
  const { summary, comparisonData, supplierSpend } = data;
  return (
    <>
      <div className="reports-kpi-grid">
        <div className="report-kpi-card">
          <div className="stat-label">TOTAL PURCHASES</div>
          <div className="stat-value">
            ₹{(summary.totalAmount || 0).toLocaleString()}
          </div>
          <div className="result-meta">This Period</div>
        </div>
        <div className="report-kpi-card">
          <div className="stat-label">SUPPLIERS</div>
          <div className="stat-value">{summary.uniqueSuppliers || 0}</div>
          <div className="result-meta">Active this period</div>
        </div>
        <div className="report-kpi-card">
          <div className="stat-label">PENDING PAYMENTS</div>
          <div
            className="stat-value"
            style={{
              color: "var(--warning)",
            }}
          >
            ₹{(summary.pendingAmount || 0).toLocaleString()}
          </div>
          <div className="result-meta">
            Across {summary.pendingSuppliers || 0} suppliers
          </div>
        </div>
      </div>

      <PurchaseReportSection1
        comparisonData={comparisonData}
        navigate={navigate}
        supplierSpend={supplierSpend}
      />
    </>
  );
}
