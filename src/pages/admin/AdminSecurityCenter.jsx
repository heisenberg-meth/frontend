import { useState, useEffect } from "react";
import { adminApi } from "../../services/admin.service";
import {
  ShieldCheck, ShieldAlert, LogIn, AlertTriangle,
  Ban, Fingerprint, Globe, Users, Clock,
} from "lucide-react";

export default function AdminSecurityCenter() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getSecurityOverview()
      .then((res) => { if (res.success) setOverview(res.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-loading-inline">Loading security data...</div>;
  if (!overview) return <div className="admin-loading-inline">Failed to load</div>;

  const cards = [
    { label: "Active Admins", value: overview.activeAdmins, icon: Users, color: "#3b82f6" },
    { label: "Total Logins", value: overview.loginAttempts.total, icon: LogIn, color: "#6366f1" },
    { label: "Failed Today", value: overview.loginAttempts.failed24h, icon: ShieldAlert, color: "#ef4444" },
    { label: "Success Today", value: overview.loginAttempts.success24h, icon: ShieldCheck, color: "#22c55e" },
    { label: "Unique IPs Today", value: overview.uniqueIps24h, icon: Globe, color: "#8b5cf6" },
    { label: "Brute Force Alerts", value: overview.bruteForceAlerts, icon: AlertTriangle, color: overview.bruteForceAlerts > 0 ? "#ef4444" : "#22c55e" },
    { label: "Recent Registrations", value: overview.recentRegistrations, icon: Fingerprint, color: "#f59e0b" },
  ];

  return (
    <div className="admin-page">
      <div className="admin-dashboard-stats">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="admin-stat-card">
              <div className="admin-stat-icon" style={{ color: card.color }}>
                <Icon size={24} />
              </div>
              <div className="admin-stat-body">
                <span className="admin-stat-value">{card.value}</span>
                <span className="admin-stat-label">{card.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="admin-dashboard-section">
        <h3><ShieldAlert size={16} /> Security Alerts</h3>
        {overview.bruteForceAlerts > 0 ? (
          <div className="admin-alert-banner" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <strong style={{ color: "#ef4444" }}>⚠ {overview.bruteForceAlerts} admin(s) had 5+ failed logins in the last hour</strong>
            <p style={{ color: "#888", fontSize: 13, margin: "4px 0 0" }}>Possible brute force attack detected. Review login activity.</p>
          </div>
        ) : (
          <div className="admin-alert-banner" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <strong style={{ color: "#22c55e" }}>✓ No brute force alerts</strong>
            <p style={{ color: "#888", fontSize: 13, margin: "4px 0 0" }}>All admins within normal login limits.</p>
          </div>
        )}
      </div>
    </div>
  );
}