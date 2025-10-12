export default function PromoCard({ title, desc }:{title:string; desc:string}) {
  return (
    <div className="card promo-card">
      <div className="promo-title">{title}</div>
      <div className="promo-desc">{desc}</div>
    </div>
  );
}
