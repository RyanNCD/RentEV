
import { Link } from "react-router-dom";
import { HeartIcon } from "../assets/icons";
import type { Car } from "../data/cars";

type Props = { car: Car; highlighted?: boolean };

export default function CarCard({ car, highlighted }: Props) {
  const vnd = new Intl.NumberFormat("vi-VN").format(car.pricePerDay);

  return (
    <article className={`car ${highlighted ? "car--highlight" : ""}`}>
      <button className="car__wish" aria-label="Yêu thích">
        <HeartIcon size={18} color="#16a34a" />
      </button>

      {/* ảnh lấy từ public/images */}
      <img src={`/images/${car.image}`} alt={car.name} className="car__img" />

      <h4 className="car__name">{car.name}</h4>

      <div className="car__price">
        <span>Chỉ từ</span>
        <strong>{vnd}</strong><small> VND/ngày</small>
      </div>

      <Link to="/register" className="car__btn">Thuê ngay</Link>
    </article>
  );
}
