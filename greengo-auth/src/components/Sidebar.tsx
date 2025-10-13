type MenuItem = {
  key: string;
  label: string;
  icon: string;
};

type Props = {
  items: MenuItem[];
  activeKey: string;
  onSelect: (key: string) => void;
};

export default function Sidebar({ items, activeKey, onSelect }: Props) {
  return (
    <aside
      style={{
        width: "260px",
        background: "var(--panel)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "16px",
        height: "fit-content",
        position: "sticky",
        top: "120px",
      }}
    >
      <nav style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => onSelect(item.key)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 16px",
              background: activeKey === item.key ? "var(--primary)" : "transparent",
              color: activeKey === item.key ? "#fff" : "var(--text-primary)",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: activeKey === item.key ? 600 : 500,
              transition: "all 0.2s",
              textAlign: "left",
            }}
            onMouseEnter={(e) => {
              if (activeKey !== item.key) {
                e.currentTarget.style.background = "var(--bg-hover)";
              }
            }}
            onMouseLeave={(e) => {
              if (activeKey !== item.key) {
                e.currentTarget.style.background = "transparent";
              }
            }}
          >
            <span style={{ fontSize: "18px" }}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

