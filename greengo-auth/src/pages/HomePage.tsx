import { useState } from "react";
import Navbar from "../components/Navbar";
import Tabs from "../components/Tabs";
import SearchBar from "../components/SearchBar";
import PromoCard from "../components/PromoCard";
import CarCard from "../components/CarCard";

const MOCK_CARS = [
  { id: "1", name: "Toyota Vios 2022", pricePerDay: 650000, image: "/car1.jpg", tags: ["Số tự động", "5 chỗ"] },
  { id: "2", name: "Kia Seltos 2023", pricePerDay: 820000, image: "/car2.jpg", tags: ["SUV", "7 túi khí"] },
  { id: "3", name: "Hyundai Accent", pricePerDay: 600000, image: "/car3.jpg", tags: ["Tiết kiệm", "5 chỗ"] },
];

<section className="grid-cars">
  {MOCK_CARS.map(c => <CarCard key={c.id} {...c} />)}
</section>

export default function HomePage() {
  const [tab, setTab] = useState<"self" | "with" | "long">("self");
  const [city, setCity] = useState("Thành phố Hồ Chí Minh");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [cars, setCars] = useState(MOCK_CARS);

  function handleSearch() {
    // chỗ này bạn giữ logic hiện có (call API / filter)
    // demo: lọc nhẹ theo tab (chỉ để có phản hồi)
    if (tab === "with") setCars(MOCK_CARS.slice(0, 2));
    else if (tab === "long") setCars(MOCK_CARS.slice(1));
    else setCars(MOCK_CARS);
  }

  return (
    <div className="page">
      <Navbar />

      <main className="container">
        <Tabs active={tab} onChange={setTab} />

        <div className="search-card">
          <SearchBar
            city={city}
            from={from}
            to={to}
            onCity={setCity}
            onFrom={setFrom}
            onTo={setTo}
            onSearch={handleSearch}
          />
        </div>

        <PromoCard />

        <section className="section">
          <h2 className="section-title">Chương Trình Khuyến Mãi</h2>
          <p className="section-sub">Nhận nhiều ưu đãi hấp dẫn từ GreenGo</p>
        </section>

        <section className="grid-cars">
          {cars.map((c) => (
            <CarCard key={c.id} {...c} />
          ))}
        </section>
      </main>

      <footer className="footer">
        <div className="container foot">
          <span>© {new Date().getFullYear()} GreenGo</span>
          <nav className="foot-links">
            <a>Điều khoản</a><a>Bảo mật</a><a>Hỗ trợ</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
