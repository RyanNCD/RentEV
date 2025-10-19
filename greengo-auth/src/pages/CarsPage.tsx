import { cars } from "../data/cars";
import CarCard from "../components/CarCard";

export default function CarsPage() {
  return (
    <main className="page container">
      <h2 className="section-title">Xe Dành Cho Bạn</h2>
      <p className="section-sub">
        Đặt xe tức thì – Giao nhanh miễn phí, an tâm trọn vẹn
      </p>

      <div
        className="grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
          gap: "20px",
          marginTop: "32px",
        }}
      >
        {cars.map((c) => (
          <CarCard
            key={c.id}
            image={`/images/${c.image}`}
            name={c.name}
            href={`/cars/${c.id}`}
            badges={c.badges}
          />
        ))}
      </div>
    </main>
  );
}
