type City = { name: string; count: string; image: string };

const CITIES: City[] = [
  { name: "TP. Hồ Chí Minh", count: "2000+ xe", image: "/city-hcm.jpg" },
  { name: "Hà Nội",          count: "2500+ xe", image: "/city-hn.jpg" },
  { name: "Đà Nẵng",         count: "500+ xe",  image: "/city-dn.jpg" },
  { name: "Nha Trang",       count: "200+ xe",  image: "/city-nt.jpg" },
  { name: "Hội An",          count: "100+ xe",  image: "/city-ha.jpg" },
  { name: "Hải Phòng",       count: "50+ xe",   image: "/city-hp.jpg" },
];

export default function FeaturedCities() {
  return (
    <section className="section">
      <h2 className="section-title">Địa Điểm Nổi Bật</h2>

      <div className="cities-grid">
        {CITIES.map((c) => (
          <article key={c.name} className="city-card">
            <img src={c.image} alt={c.name} />
            <div className="city-overlay">
              <h3>{c.name}</h3>
              <p>{c.count}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
