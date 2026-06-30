import { useState, useEffect, useCallback, useRef } from "react";
import { adminApi } from "../../services/admin.service";
import toast from "react-hot-toast";
import {
  Ticket,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Search,
} from "lucide-react";

export default function AdminSupportTickets() {
  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  const searchRef = useRef(search);
  useEffect(() => {
    searchRef.current = search;
  }, [search]);

  const fetchTickets = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    try {
      const res = await adminApi.listSupportTickets({
        status: statusFilter || undefined,
        search: searchRef.current || undefined,
        page,
        limit: 15,
      });
      if (res.success) {
        setTickets(res.data.tickets);
        setTotal(res.data.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    Promise.resolve().then(() => fetchTickets());
  }, [fetchTickets]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTickets();
  };

  const handleReply = async (ticketId) => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      const res = await adminApi.replySupportTicket(ticketId, {
        message: replyText,
      });
      if (res.success) {
        setReplyText("");
        toast.success("Reply sent");
        fetchTickets();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const handleStatus = async (ticketId, status) => {
    try {
      const res = await adminApi.updateSupportTicketStatus(ticketId, {
        status,
      });
      if (res.success) {
        toast.success(`Ticket status updated to ${status}`);
        fetchTickets();
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to update ticket status",
      );
    }
  };

  const statusColors = {
    OPEN: "#f59e0b",
    IN_PROGRESS: "#3b82f6",
    WAITING_ON_CUSTOMER: "#8b5cf6",
    RESOLVED: "#22c55e",
    CLOSED: "#666",
  };

  const priorityColors = {
    LOW: "#666",
    MEDIUM: "#f59e0b",
    HIGH: "#ef4444",
    URGENT: "#dc2626",
  };

  const totalPages = Math.ceil(total / 15);

  return (
    <div className="admin-page">
      <h2>
        <Ticket size={20} /> Support Tickets
      </h2>

      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 20,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <form
          onSubmit={handleSearch}
          style={{ display: "flex", gap: 8, flex: 1, maxWidth: 400 }}
        >
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets..."
            style={{
              flex: 1,
              padding: "8px 12px",
              border: "1px solid #333",
              borderRadius: 6,
              background: "#1a1a1a",
              color: "#fff",
            }}
          />
          <button
            type="submit"
            className="admin-btn admin-btn-primary"
            style={{ padding: "8px 14px" }}
          >
            <Search size={16} />
          </button>
        </form>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          style={{
            padding: "8px 12px",
            border: "1px solid #333",
            borderRadius: 6,
            background: "#1a1a1a",
            color: "#fff",
          }}
        >
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="WAITING_ON_CUSTOMER">Waiting on Customer</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      {loading ? (
        <div className="admin-loading-inline">Loading...</div>
      ) : (
        <>
          {tickets.length === 0 ? (
            <div style={{ color: "#666", textAlign: "center", padding: 40 }}>
              No tickets found
            </div>
          ) : (
            tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="admin-card"
                style={{ marginBottom: 12, padding: 16 }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    setExpanded(expanded === ticket.id ? null : ticket.id)
                  }
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          background: `${statusColors[ticket.status]}22`,
                          color: statusColors[ticket.status],
                          border: `1px solid ${statusColors[ticket.status]}44`,
                        }}
                      >
                        {ticket.status.replace(/_/g, " ")}
                      </span>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          background: `${priorityColors[ticket.priority]}22`,
                          color: priorityColors[ticket.priority],
                        }}
                      >
                        {ticket.priority}
                      </span>
                      <span style={{ fontSize: 12, color: "#666" }}>
                        {ticket.tenant?.shopName || "Unknown"}
                      </span>
                    </div>
                    <div
                      style={{ fontWeight: 600, fontSize: 15, color: "#fff" }}
                    >
                      {ticket.subject}
                    </div>
                    <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                      {new Date(ticket.createdAt).toLocaleDateString()} —{" "}
                      {ticket.replies?.length || 0} replies
                    </div>
                  </div>
                  <div style={{ color: "#666" }}>
                    {expanded === ticket.id ? (
                      <ChevronUp size={18} />
                    ) : (
                      <ChevronDown size={18} />
                    )}
                  </div>
                </div>

                {expanded === ticket.id && (
                  <div
                    style={{
                      marginTop: 16,
                      borderTop: "1px solid #222",
                      paddingTop: 16,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 14,
                        color: "#ccc",
                        marginBottom: 16,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {ticket.message}
                    </div>

                    {ticket.replies?.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <h4
                          style={{
                            fontSize: 13,
                            color: "#888",
                            marginBottom: 8,
                          }}
                        >
                          Replies
                        </h4>
                        {ticket.replies.map((r) => (
                          <div
                            key={r.id}
                            style={{
                              padding: "10px 14px",
                              marginBottom: 8,
                              borderRadius: 8,
                              background:
                                r.authorRole === "ADMIN"
                                  ? "#0a2e1a"
                                  : "#1a1a2e",
                              border: `1px solid ${r.authorRole === "ADMIN" ? "#22c55e33" : "#3b82f633"}`,
                            }}
                          >
                            <div
                              style={{
                                fontSize: 12,
                                color: "#888",
                                marginBottom: 4,
                              }}
                            >
                              {r.authorRole} —{" "}
                              {new Date(r.createdAt).toLocaleString()}
                            </div>
                            <div style={{ fontSize: 13, color: "#ccc" }}>
                              {r.message}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                      {["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map(
                        (s) => (
                          <button
                            key={s}
                            onClick={() => handleStatus(ticket.id, s)}
                            style={{
                              padding: "4px 10px",
                              fontSize: 11,
                              borderRadius: 4,
                              cursor: "pointer",
                              background:
                                ticket.status === s
                                  ? `${statusColors[s]}33`
                                  : "transparent",
                              border: `1px solid ${ticket.status === s ? statusColors[s] : "#333"}`,
                              color:
                                ticket.status === s ? statusColors[s] : "#888",
                            }}
                          >
                            {s.replace(/_/g, " ")}
                          </button>
                        ),
                      )}
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your reply..."
                        rows={3}
                        style={{
                          flex: 1,
                          padding: "8px 12px",
                          border: "1px solid #333",
                          borderRadius: 6,
                          background: "#1a1a1a",
                          color: "#fff",
                          resize: "vertical",
                        }}
                      />
                      <button
                        className="admin-btn admin-btn-primary"
                        onClick={() => handleReply(ticket.id)}
                        disabled={sending || !replyText.trim()}
                        style={{ alignSelf: "flex-end", padding: "8px 16px" }}
                      >
                        <MessageSquare size={14} /> Reply
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 8,
                marginTop: 20,
              }}
            >
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="admin-btn"
                style={{ background: "#222", color: "#fff", fontSize: 13 }}
              >
                Prev
              </button>
              <span
                style={{ color: "#888", padding: "8px 12px", fontSize: 13 }}
              >
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                className="admin-btn"
                style={{ background: "#222", color: "#fff", fontSize: 13 }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
