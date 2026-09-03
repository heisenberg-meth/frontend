export function TableHeader({ columns, trClassName, thClassName, trStyle }) {
  return (
    <thead>
      <tr className={trClassName} style={trStyle}>
        {columns.map((col) => {
          if (typeof col === "string" || typeof col === "number") {
            return <th key={String(col)}>{col}</th>;
          }
          const { label, key, id, style, className, colSpan } = col || {};
          const headerKey = key || id || label;
          return (
            <th
              key={headerKey}
              style={style}
              className={className || thClassName}
              colSpan={colSpan}
            >
              {label}
            </th>
          );
        })}
      </tr>
    </thead>
  );
}
