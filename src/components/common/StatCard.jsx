export function StatCard({ label, val, value, icon: Icon, col, color, style }) {
  const displayVal = value !== undefined ? value : val;
  const displayColor = color || col;
  return (
    <div className="pos-stat-card" style={style}>
      <div className="stat-card-header">
        <span className="stat-label">{label}</span>
        {Icon && (
          <div
            className="stat-icon"
            style={{
              backgroundColor: displayColor ? `${displayColor}15` : undefined,
              color: displayColor,
            }}
          >
            <Icon size={16} />
          </div>
        )}
      </div>
      <div className="stat-value">{displayVal}</div>
    </div>
  );
}
