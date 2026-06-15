import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  User,
  Activity,
  Shield,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import api from "../api";

export default function AuditLogs() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(() => {
    api
      .get("/audit")
      .then((res) => {
        const data = res.data;
        if (Array.isArray(data)) {
          setLogs(data);
        } else if (Array.isArray(data?.logs)) {
          setLogs(data.logs);
        } else if (Array.isArray(data?.data)) {
          setLogs(data.data);
        } else {
          setLogs([]);
          console.warn("Unexpected audit-logs response shape:", data);
        }
      })
      .catch(() => {
        console.error("Failed to fetch logs");
        setLogs([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleRefresh = () => {
    setLoading(true);
    fetchLogs();
  };

  return (
    <div className="audit-container">
      <div className="audit-nav">
        <button className="back-link" onClick={() => navigate("/dashboard")}>
          <ArrowLeft size={16} /> BACK TO INTELLIGENCE
        </button>
        <button
          className="audit-refresh-btn"
          onClick={handleRefresh}
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? "spin" : ""} /> REFRESH
          TRAIL
        </button>
      </div>

      <div className="audit-header">
        <h1>Clinical Audit Trail</h1>
        <p>
          Comprehensive record of all facility operations and security events.
        </p>
      </div>

      <div className="log-stack">
        {loading && logs.length === 0 ? (
          <div className="empty-state">
            <RefreshCw
              size={32}
              className="spin"
              style={{ color: "var(--primary)", marginBottom: 16 }}
            />
            <p>Synchronizing clinical logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <p>No audit logs recorded yet.</p>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="log-entry">
              <div className="log-main">
                <div className={`log-icon-box ${log.type}`}>
                  {log.type === "security" ? (
                    <Shield size={20} />
                  ) : (
                    <Activity size={20} />
                  )}
                </div>
                <div className="log-info">
                  <h4>{log.action}</h4>
                  <p>Target: {log.target}</p>
                </div>
              </div>
              <div className="log-meta">
                <div className="user-tag">
                  <User size={14} /> <span>{log.username}</span>
                </div>
                <div className="time-stamp">
                  <Clock size={12} />
                  <span>
                    {formatDistanceToNow(new Date(log.date), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
