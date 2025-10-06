type Props = {
  active: "self" | "with" | "long";
  onChange: (tab: "self" | "with" | "long") => void;
};

export default function Tabs({ active, onChange }: Props) {
  return (
    <div className="tabs">
      <button className={`tab ${active === "self" ? "is-active" : ""}`} onClick={() => onChange("self")}>
        Xe tự lái
      </button>
      <button className={`tab ${active === "with" ? "is-active" : ""}`} onClick={() => onChange("with")}>
        Xe có tài xế
      </button>
      <button className={`tab ${active === "long" ? "is-active" : ""}`} onClick={() => onChange("long")}>
        Thuê xe dài hạn
      </button>
    </div>
  );
}
