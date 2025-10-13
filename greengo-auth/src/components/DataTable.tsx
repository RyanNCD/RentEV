type Column = {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
};

type Props = {
  columns: Column[];
  data: any[];
  onRowClick?: (row: any) => void;
};

export default function DataTable({ columns, data, onRowClick }: Props) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid var(--border)" }}>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  textAlign: "left",
                  padding: "12px 16px",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={idx}
              onClick={() => onRowClick?.(row)}
              style={{
                borderBottom: "1px solid var(--border)",
                cursor: onRowClick ? "pointer" : "default",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => {
                if (onRowClick) e.currentTarget.style.background = "var(--bg-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={{
                    padding: "12px 16px",
                    fontSize: "14px",
                    color: "var(--text-secondary)",
                  }}
                >
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && (
        <div style={{ textAlign: "center", padding: "32px", color: "var(--muted)" }}>
          Không có dữ liệu
        </div>
      )}
    </div>
  );
}


