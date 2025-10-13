import { useEffect } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: number;
};

export default function Modal({ isOpen, onClose, title, children, footer, maxWidth = 600 }: Props) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          maxWidth,
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
          padding: "24px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ margin: 0, color: "var(--primary-700)" }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "var(--muted)",
            }}
          >
            ×
          </button>
        </div>
        <div style={{ marginBottom: footer ? "16px" : 0 }}>{children}</div>
        {footer && <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>{footer}</div>}
      </div>
    </div>
  );
}


