import { Loader2 } from "lucide-react";

const STATUS_BADGE = {
  DRAFT: {
    label: "Draft",
    class: "badge-neutral",
  },
  PENDING: {
    label: "Pending",
    class: "badge-warning",
  },
  APPROVED: {
    label: "Approved",
    class: "badge-info",
  },
  PICKED_UP: {
    label: "Picked Up",
    class: "badge-primary",
  },
  COMPLETED: {
    label: "Completed",
    class: "badge-success",
  },
  REJECTED: {
    label: "Rejected",
    class: "badge-danger",
  },
};
export function Badge({ status, map }) {
  const s = map?.[status] ||
    STATUS_BADGE[status] || {
      label: status,
      class: "badge-neutral",
    };
  return <span className={`status-badge ${s.class}`}>{s.label}</span>;
}
export function Loading({ message = "Loading..." }) {
  return (
    <div className="loading-container">
      <Loader2 className="spin" size={32} />
      <p>{message}</p>
    </div>
  );
}
export function Pagination({ page, totalPages, total, onPageChange }) {
  return (
    <div className="pagination-bar">
      <span className="pagination-info">{total} total</span>
      <div className="pagination-controls">
        <button disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Prev
        </button>
        <span className="pagination-current">
          {page} / {totalPages || 1}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
