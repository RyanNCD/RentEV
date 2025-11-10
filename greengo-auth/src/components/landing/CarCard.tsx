import "../carcard.css";

export type Badge =
  | { text: string; tone?: "success" | "warning" | "muted" | "info" };

export type CarCardProps = {
  image: string;
  name: string;          // ví dụ: "VinFast VF 7 2024"
  href?: string;         // nếu muốn click vào chi tiết
  badges?: Badge[];      // các nhãn nhỏ ngay dưới ảnh
  className?: string;
};

export default function CarCard({
  image,
  name,
  href,
  badges = [],
  className = "",
}: CarCardProps) {
  const Tag = href ? "a" : "div";
  const props = href ? { href } : {};
  return (
    <Tag className={`car-card ${className}`} {...(props as any)}>
      <div className="car-card__media">
        <img src={image} alt={name} loading="lazy" />
      </div>

      {badges.length > 0 && (
        <div className="car-card__badges">
          {badges.map((b, i) => (
            <span key={i} className={`badge ${b.tone ?? "muted"}`}>
              {b.text}
            </span>
          ))}
        </div>
      )}

      <div className="car-card__body">
        <h3 className="car-card__title">{name}</h3>
      </div>
    </Tag>
  );
}

