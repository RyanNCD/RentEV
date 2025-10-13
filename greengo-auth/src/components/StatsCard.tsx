type Props = {
  title: string;
  value: string | number;
  change?: string;
  icon?: string;
  trend?: "up" | "down" | "neutral";
};

export default function StatsCard({ title, value, change, icon, trend = "neutral" }: Props) {
  const trendColor = trend === "up" ? "#10b981" : trend === "down" ? "#ef4444" : "#6b7280";
  
  return (
    <div className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "14px", color: "var(--muted)", fontWeight: 500 }}>{title}</span>
        {icon && <span style={{ fontSize: "24px" }}>{icon}</span>}
      </div>
      <div style={{ fontSize: "28px", fontWeight: 700, color: "var(--primary-700)" }}>
        {value}
      </div>
      {change && (
        <div style={{ fontSize: "13px", color: trendColor, fontWeight: 500 }}>
          {trend === "up" && "↑ "}
          {trend === "down" && "↓ "}
          {change}
        </div>
      )}
    </div>
  );
}


