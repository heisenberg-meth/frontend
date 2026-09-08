import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  rowsPerPage = 10,
  onPageChange,
  onRowsPerPageChange,
  itemLabel = "",
}) {
  if (totalItems === 0) {
    return null;
  }

  const startIndex = (currentPage - 1) * rowsPerPage;
  const showingFrom = startIndex + 1;
  const showingTo = Math.min(startIndex + rowsPerPage, totalItems);

  const getVisiblePages = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }
    if (currentPage >= totalPages - 3) {
      return [
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }
    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages,
    ];
  };

  const visiblePages = getVisiblePages();

  return (
    <div
      className="pagination-wrapper"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px",
        padding: "16px 20px",
        borderTop: "1px solid var(--outline-variant)",
        background: "var(--surface)",
        borderBottomLeftRadius: "inherit",
        borderBottomRightRadius: "inherit",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >
        <span
          className="pagination-info"
          style={{
            fontSize: "13px",
            color: "var(--text-muted)",
            fontWeight: 500,
            fontFamily: '"Manrope", sans-serif',
          }}
        >
          Showing {showingFrom}–{showingTo} of {totalItems}
          {itemLabel ? ` ${itemLabel}` : ""}
        </span>

        <div
          className="pagination-rows-per-page"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "13px",
            color: "var(--text-muted)",
            fontFamily: '"Manrope", sans-serif',
          }}
        >
          <label htmlFor="pagination-rows-select">Rows per page:</label>
          <select
            id="pagination-rows-select"
            value={rowsPerPage}
            onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
            style={{
              background: "var(--surface-container, var(--overlay-03))",
              border: "1px solid var(--outline-variant)",
              color: "var(--text)",
              borderRadius: "8px",
              padding: "4px 8px",
              fontSize: "13px",
              cursor: "pointer",
              outline: "none",
              fontFamily: "inherit",
            }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {totalPages > 1 && (
        <div
          className="pagination-controls"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            className="pagination-btn prev-next"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            aria-label="Previous Page"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              height: "36px",
              padding: "0 12px",
              borderRadius: "8px",
              border: "1px solid var(--outline-variant)",
              background: "var(--surface-container, var(--overlay-03))",
              color: "var(--text)",
              fontSize: "13px",
              fontWeight: 600,
              cursor: currentPage === 1 ? "not-allowed" : "pointer",
              opacity: currentPage === 1 ? 0.4 : 1,
              transition: "all 0.2s ease",
            }}
          >
            <ChevronLeft size={16} />
            <span>Previous</span>
          </button>

          {visiblePages.map((page, index) => {
            if (page === "...") {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="pagination-ellipsis"
                  style={{
                    color: "var(--text-muted)",
                    padding: "0 6px",
                    display: "inline-flex",
                    alignItems: "center",
                    userSelect: "none",
                  }}
                >
                  ...
                </span>
              );
            }

            const isActive = currentPage === page;
            return (
              <button
                key={`page-${page}`}
                type="button"
                className={`pagination-btn ${isActive ? "active" : ""}`}
                onClick={() => onPageChange(page)}
                aria-label={`Page ${page}`}
                aria-current={isActive ? "page" : undefined}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  border: isActive
                    ? "1px solid var(--primary)"
                    : "1px solid var(--outline-variant)",
                  background: isActive
                    ? "var(--primary)"
                    : "var(--surface-container, var(--overlay-03))",
                  color: isActive ? "var(--bg-dark, #0c1321)" : "var(--text)",
                  fontWeight: isActive ? 700 : 500,
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease",
                }}
              >
                {page}
              </button>
            );
          })}

          <button
            type="button"
            className="pagination-btn prev-next"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            aria-label="Next Page"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              height: "36px",
              padding: "0 12px",
              borderRadius: "8px",
              border: "1px solid var(--outline-variant)",
              background: "var(--surface-container, var(--overlay-03))",
              color: "var(--text)",
              fontSize: "13px",
              fontWeight: 600,
              cursor: currentPage === totalPages ? "not-allowed" : "pointer",
              opacity: currentPage === totalPages ? 0.4 : 1,
              transition: "all 0.2s ease",
            }}
          >
            <span>Next</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
