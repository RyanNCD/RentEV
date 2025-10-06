type Car = {
  id: string;
  name: string;
  pricePerDay: number;
  image: string; // /car1.jpg ...
  tags?: string[];
};

export default function CarCard({ name, pricePerDay, image, tags = [] }: Car) {
  return (
    <div className="car-card">
      <img src={image} alt={name} />
      <div className="car-meta">
        <h4>{name}</h4>
        <p className="muted">{tags.join(" • ")}</p>
        <div className="car-foot">
          <span className="price">{pricePerDay.toLocaleString()}đ/ngày</span>
          <button className="btn primary sm">Đặt ngay</button>
        </div>
      </div>
    </div>
  );
}
