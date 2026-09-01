import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Send,
} from "lucide-react";
import { AnimatePresence, m } from "framer-motion";
import api from "../api";
const CATEGORIES = [
  "INVENTORY",
  "BILLING",
  "PURCHASE",
  "SUPPLIER",
  "SALES",
  "REPORTS",
  "IMPORT",
  "ACCOUNT",
  "TECHNICAL",
  "OTHER",
];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "WAITING_FOR_STAFF",
  "RESOLVED",
  "CLOSED",
];
const STATUS_COLORS = {
  OPEN: "#3b82f6",
  IN_PROGRESS: "#f59e0b",
  WAITING_FOR_STAFF: "#8b5cf6",
  RESOLVED: "#10b981",
  CLOSED: "#6b7280",
};
const PRIORITY_COLORS = {
  LOW: "#6b7280",
  MEDIUM: "#3b82f6",
  HIGH: "#f59e0b",
  CRITICAL: "#ef4444",
};
function SupportTicketsSection1({ loading, tickets, loadTicketDetails }) {
  return loading ? (
    <div
      style={{
        textAlign: "center",
        padding: 40,
      }}
    >
      Loading...
    </div>
  ) : tickets.length === 0 ? (
    <div
      style={{
        textAlign: "center",
        padding: 40,
        color: "var(--text-dim)",
      }}
    >
      No tickets found
    </div>
  ) : (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {tickets.map((ticket) => (
        <m.div
          role="button"
          tabIndex={0}
          key={ticket.id}
          initial={{
            opacity: 0,
            y: 10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="sub-current-card"
          style={{
            cursor: "pointer",
            padding: 16,
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.currentTarget.click();
            }
          }}
          onClick={() => loadTicketDetails(ticket.id)}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: 12,
                    color: "var(--text-dim)",
                  }}
                >
                  {ticket.ticketNumber}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    padding: "2px 8px",
                    borderRadius: 4,
                    background: STATUS_COLORS[ticket.status] + "20",
                    color: STATUS_COLORS[ticket.status],
                  }}
                >
                  {ticket.status.replace(/_/g, " ")}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    padding: "2px 8px",
                    borderRadius: 4,
                    background: PRIORITY_COLORS[ticket.priority] + "20",
                    color: PRIORITY_COLORS[ticket.priority],
                  }}
                >
                  {ticket.priority}
                </span>
              </div>
              <p
                style={{
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                {ticket.subject || ticket.title}
              </p>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  fontSize: 12,
                  color: "var(--text-dim)",
                }}
              >
                <span>{ticket.category}</span>
                <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                {ticket.createdBy && (
                  <span>by {ticket.createdBy.fullName}</span>
                )}
                {ticket._count?.replies > 0 && (
                  <span>
                    <MessageSquare size={12} /> {ticket._count.replies}
                  </span>
                )}
              </div>
            </div>
          </div>
        </m.div>
      ))}
    </div>
  );
}
function SupportTicketsSection2({
  showCreate,
  setShowCreate,
  setForm,
  form,
  createTicket,
  submitting,
}) {
  return (
    <AnimatePresence>
      {showCreate && (
        <div className="modal-overlay-v2">
          <m.div
            className="modal-content-glass"
            initial={{
              opacity: 0,
              scale: 0.95,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              scale: 0.95,
            }}
          >
            <div className="modal-header-v2">
              <h3>Create Support Ticket</h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowCreate(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body-v2">
              <div className="input-v2">
                <label htmlFor="field_4zhc6f">Title</label>
                <input
                  id="field_4zhc6f"
                  type="text"
                  value={form.title}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      title: e.target.value,
                    })
                  }
                  placeholder="Brief description of the issue"
                />
              </div>
              <div className="input-v2">
                <label htmlFor="field_6ez9tb">Description</label>
                <textarea
                  id="field_6ez9tb"
                  value={form.description}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description: e.target.value,
                    })
                  }
                  placeholder="Detailed description..."
                  rows={4}
                  style={{
                    width: "100%",
                    padding: 8,
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "var(--bg-dark)",
                    color: "var(--text)",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                }}
              >
                <div
                  className="input-v2"
                  style={{
                    flex: 1,
                  }}
                >
                  <label htmlFor="field_hfds17">Category</label>
                  <select
                    id="field_hfds17"
                    value={form.category}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        category: e.target.value,
                      })
                    }
                    className="pos-input"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div
                  className="input-v2"
                  style={{
                    flex: 1,
                  }}
                >
                  <label htmlFor="field_tapocp">Priority</label>
                  <select
                    id="field_tapocp"
                    value={form.priority}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        priority: e.target.value,
                      })
                    }
                    className="pos-input"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                className="modal-submit-btn"
                onClick={createTicket}
                disabled={submitting}
                style={{
                  marginTop: 12,
                }}
              >
                {submitting ? "Creating..." : "Create Ticket"}
              </button>
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}
function SupportTicketsSection3({
  setSelectedTicket,
  closeTicket,
  selectedTicket,
  reopenTicket,
  replyText,
  setReplyText,
  sendReply,
}) {
  return (
    <AnimatePresence>
      {selectedTicket && (
        <div className="modal-overlay-v2">
          <m.div
            className="modal-content-glass"
            initial={{
              opacity: 0,
              scale: 0.95,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              scale: 0.95,
            }}
            style={{
              maxWidth: 700,
              maxHeight: "80vh",
              overflow: "auto",
            }}
          >
            <div className="modal-header-v2">
              <div>
                <h3>{selectedTicket.subject || selectedTicket.title}</h3>
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: 12,
                    color: "var(--text-dim)",
                  }}
                >
                  {selectedTicket.ticketNumber}
                </span>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setSelectedTicket(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-body-v2">
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginBottom: 16,
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    padding: "4px 10px",
                    borderRadius: 6,
                    background: STATUS_COLORS[selectedTicket.status] + "20",
                    color: STATUS_COLORS[selectedTicket.status],
                  }}
                >
                  {selectedTicket.status.replace(/_/g, " ")}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    padding: "4px 10px",
                    borderRadius: 6,
                    background: PRIORITY_COLORS[selectedTicket.priority] + "20",
                    color: PRIORITY_COLORS[selectedTicket.priority],
                  }}
                >
                  {selectedTicket.priority}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--text-dim)",
                  }}
                >
                  {selectedTicket.category}
                </span>
              </div>

              <p
                style={{
                  color: "var(--text-dim)",
                  marginBottom: 16,
                }}
              >
                {selectedTicket.message || selectedTicket.description}
              </p>

              {selectedTicket.resolutionSummary && (
                <div
                  style={{
                    padding: 12,
                    background: "#10b98110",
                    border: "1px solid #10b98130",
                    borderRadius: 8,
                    marginBottom: 16,
                  }}
                >
                  <strong>Resolution:</strong>{" "}
                  {selectedTicket.resolutionSummary}
                </div>
              )}

              {selectedTicket.status === "RESOLVED" && (
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginBottom: 16,
                  }}
                >
                  <button
                    className="sub-upgrade-btn"
                    style={{
                      fontSize: 12,
                    }}
                    onClick={() => closeTicket(selectedTicket.id)}
                  >
                    <CheckCircle2 size={14} /> Confirm & Close
                  </button>
                  <button
                    className="sub-upgrade-btn"
                    style={{
                      fontSize: 12,
                      background: "#f59e0b20",
                      color: "#f59e0b",
                    }}
                    onClick={() => {
                      const reason = prompt("Reason for reopening:");
                      if (reason) reopenTicket(selectedTicket.id, reason);
                    }}
                  >
                    <AlertTriangle size={14} /> Reopen
                  </button>
                </div>
              )}

              {selectedTicket.status === "CLOSED" && (
                <button
                  className="sub-upgrade-btn"
                  style={{
                    fontSize: 12,
                    marginBottom: 16,
                  }}
                  onClick={() => {
                    const reason = prompt("Reason for reopening:");
                    if (reason) reopenTicket(selectedTicket.id, reason);
                  }}
                >
                  Reopen Ticket
                </button>
              )}

              <div
                style={{
                  borderTop: "1px solid var(--border)",
                  paddingTop: 16,
                }}
              >
                <h4
                  style={{
                    marginBottom: 12,
                  }}
                >
                  Conversation
                </h4>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    marginBottom: 16,
                  }}
                >
                  {(
                    selectedTicket.replies ||
                    selectedTicket.messages ||
                    []
                  ).map((msg) => (
                    <div
                      key={msg.id}
                      style={{
                        padding: 10,
                        borderRadius: 8,
                        background:
                          msg.authorRole === "ADMIN" ||
                          msg.senderRole === "ADMIN"
                            ? "var(--primary-container)"
                            : "var(--surface)",
                        alignSelf:
                          msg.authorRole === "ADMIN" ||
                          msg.senderRole === "ADMIN"
                            ? "flex-end"
                            : "flex-start",
                        maxWidth: "80%",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--text-dim)",
                          marginBottom: 4,
                        }}
                      >
                        {(msg.author?.fullName || msg.sender?.fullName) + " · "}
                        {new Date(msg.createdAt).toLocaleString()}
                      </div>
                      <p
                        style={{
                          fontSize: 13,
                        }}
                      >
                        {msg.message}
                      </p>
                    </div>
                  ))}
                </div>

                {selectedTicket.status !== "CLOSED" && (
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                    }}
                  >
                    <>
                      <label htmlFor="field_xjoaon" className="sr-only">
                        Type a reply...
                      </label>
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type a reply..."
                        className="pos-input"
                        style={{
                          flex: 1,
                        }}
                        onKeyDown={(e) => e.key === "Enter" && sendReply()}
                        id="field_xjoaon"
                      />
                    </>
                    <button className="sub-upgrade-btn" onClick={sendReply}>
                      <Send size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}
export default function SupportTickets({ user, showToast }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [filter, setFilter] = useState({
    status: "",
    priority: "",
  });
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "OTHER",
    priority: "MEDIUM",
  });
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isAdmin = user?.role === "OWNER" || user?.role === "ADMIN";
  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      const url = "/support/my";
      const params = new URLSearchParams();
      if (filter.status) params.set("status", filter.status);
      if (filter.priority) params.set("priority", filter.priority);
      const res = await api.get(`${url}?${params}`);
      setTickets(res.data?.data || []);
    } catch {
      showToast("Failed to load tickets", "error");
    } finally {
      setLoading(false);
    }
  }, [filter.status, filter.priority, showToast]);
  const loadDashboard = useCallback(async () => {
    try {
      const url = "/support/dashboard";
      const res = await api.get(url);
      setDashboard(res.data?.data);
    } catch (err) {
      console.log(err);
    }
  }, []);
  const refresh = useCallback(async () => {
    await Promise.all([loadTickets(), loadDashboard()]);
  }, [loadTickets, loadDashboard]);
  useEffect(() => {
    let active = true;
    const init = async () => {
      await Promise.resolve();
      if (active) {
        refresh();
      }
    };
    init();
    return () => {
      active = false;
    };
  }, [refresh]);
  const isSubmittingTicketRef = useRef(false);
  const createTicket = async () => {
    if (isSubmittingTicketRef.current) return;
    if (!form.title.trim() || !form.description.trim()) {
      showToast("Title and description are required", "error");
      return;
    }
    isSubmittingTicketRef.current = true;
    setSubmitting(true);
    try {
      await api.post("/support", form);
      showToast("Ticket created", "success");
      setShowCreate(false);
      setForm({
        title: "",
        description: "",
        category: "OTHER",
        priority: "MEDIUM",
      });
      refresh();
    } catch (err) {
      showToast(
        err.response?.data?.error || "Failed to create ticket",
        "error",
      );
    } finally {
      isSubmittingTicketRef.current = false;
      setSubmitting(false);
    }
  };
  const loadTicketDetails = async (ticketId) => {
    try {
      const url = `/support/${ticketId}`;
      const res = await api.get(url);
      setSelectedTicket(res.data?.data);
    } catch {
      showToast("Failed to load ticket details", "error");
    }
  };
  const isReplyingRef = useRef(false);
  const sendReply = async () => {
    if (isReplyingRef.current) return;
    if (!replyText.trim()) return;
    isReplyingRef.current = true;
    try {
      const url = `/support/${selectedTicket.id}/replies`;
      await api.post(url, {
        message: replyText,
      });
      setReplyText("");
      loadTicketDetails(selectedTicket.id);
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to send reply", "error");
    } finally {
      isReplyingRef.current = false;
    }
  };
  const isClosingRef = useRef(false);
  const closeTicket = async (ticketId) => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    try {
      await api.put(`/support/${ticketId}/close`);
      showToast("Ticket closed", "success");
      setSelectedTicket(null);
      refresh();
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to close", "error");
    } finally {
      isClosingRef.current = false;
    }
  };
  const isReopeningRef = useRef(false);
  const reopenTicket = async (ticketId, reason) => {
    if (isReopeningRef.current) return;
    isReopeningRef.current = true;
    try {
      await api.put(`/support/${ticketId}/reopen`, {
        reason,
      });
      showToast("Ticket reopened", "success");
      setSelectedTicket(null);
      refresh();
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to reopen", "error");
    } finally {
      isReopeningRef.current = false;
    }
  };
  return (
    <div className="sub-container">
      <div className="sub-header">
        <div className="sub-title-group">
          <h2>Support Tickets</h2>
          <p>Report issues and track resolutions</p>
        </div>
        <button className="sub-upgrade-btn" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> New Ticket
        </button>
      </div>

      {dashboard && (
        <div
          className="sub-current-card"
          style={{
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 24,
              flexWrap: "wrap",
            }}
          >
            {isAdmin ? (
              <>
                <Stat
                  label="Total"
                  value={dashboard.totalTickets}
                  color="var(--text)"
                />
                <Stat
                  label="Open"
                  value={dashboard.open}
                  color={STATUS_COLORS.OPEN}
                />
                <Stat
                  label="In Progress"
                  value={dashboard.inProgress}
                  color={STATUS_COLORS.IN_PROGRESS}
                />
                <Stat
                  label="Waiting"
                  value={dashboard.waitingForStaff}
                  color={STATUS_COLORS.WAITING_FOR_STAFF}
                />
                <Stat
                  label="Resolved"
                  value={dashboard.resolved}
                  color={STATUS_COLORS.RESOLVED}
                />
                <Stat
                  label="Closed"
                  value={dashboard.closed}
                  color={STATUS_COLORS.CLOSED}
                />
              </>
            ) : (
              <>
                <Stat
                  label="Open"
                  value={dashboard.open}
                  color={STATUS_COLORS.OPEN}
                />
                <Stat
                  label="In Progress"
                  value={dashboard.inProgress}
                  color={STATUS_COLORS.IN_PROGRESS}
                />
                <Stat
                  label="Resolved"
                  value={dashboard.resolved}
                  color={STATUS_COLORS.RESOLVED}
                />
                <Stat
                  label="Closed"
                  value={dashboard.closed}
                  color={STATUS_COLORS.CLOSED}
                />
              </>
            )}
          </div>
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 16,
        }}
      >
        <select
          value={filter.status}
          onChange={(e) =>
            setFilter({
              ...filter,
              status: e.target.value,
            })
          }
          className="pos-input"
          style={{
            width: "auto",
          }}
        >
          <option value="">All Status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <select
          value={filter.priority}
          onChange={(e) =>
            setFilter({
              ...filter,
              priority: e.target.value,
            })
          }
          className="pos-input"
          style={{
            width: "auto",
          }}
        >
          <option value="">All Priority</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <SupportTicketsSection1
        loading={loading}
        tickets={tickets}
        loadTicketDetails={loadTicketDetails}
      />

      <SupportTicketsSection2
        showCreate={showCreate}
        setShowCreate={setShowCreate}
        setForm={setForm}
        form={form}
        createTicket={createTicket}
        submitting={submitting}
      />

      <SupportTicketsSection3
        setSelectedTicket={setSelectedTicket}
        closeTicket={closeTicket}
        selectedTicket={selectedTicket}
        reopenTicket={reopenTicket}
        replyText={replyText}
        setReplyText={setReplyText}
        sendReply={sendReply}
      />
    </div>
  );
}
function Stat({ label, value, color }) {
  return (
    <div
      style={{
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 24,
          fontWeight: 700,
          color,
        }}
      >
        {value ?? 0}
      </div>
      <div
        style={{
          fontSize: 12,
          color: "var(--text-dim)",
        }}
      >
        {label}
      </div>
    </div>
  );
}
