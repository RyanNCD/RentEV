// ...existing imports...
import { useState } from "react";
import type { Car } from "../data/cars";
import { cars as ALL_CARS } from "../data/cars";          // ⬅️ lấy toàn bộ data xe

import { Link } from "react-router-dom";
import Tabs from "../components/Tabs";
import SearchBar from "../components/SearchBar";
import CarCard from "../components/CarCard";
import FeaturedCities from "../components/FeaturedCities";
import FAQ from "../components/FAQ";
import Footer from "../components/Footer";
import Promotions from "../components/Promotions";

// ...existing code...

const TAKE = 8; // số xe hiển thị trên trang chủ

export default function HomePage() {
  const [tab, setTab] = useState<"self" | "with" | "long">("self");
  const [city, setCity] = useState("Thành phố Hồ Chí Minh");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [cars, setCars] = useState<Car[]>(ALL_CARS.slice(0, TAKE));

  // demo lọc đơn giản theo tab; thực tế bạn có thể dùng field "tag" của Car
  function handleSearch() {
    let list = ALL_CARS;

    if (tab === "with") list = ALL_CARS.slice(0, 4);     // ví dụ: xe có tài
    else if (tab === "long") list = ALL_CARS.slice(2);        // ví dụ: đi dài ngày

    setCars(list.slice(0, TAKE));  // chỉ lấy vài chiếc để show ở Home
  }

  return (
    <div className="page">
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

        {/* Danh sách xe nháp ở Home */}
        <section className="grid-cars">
          {cars.map((c) => (
            <CarCard
              key={c.id}
              image={`/images/${c.image}`}
              name={c.name}
              href={`/cars/${c.id}`}
              badges={c.badges}
            />
          ))}
        </section>


        {/* Nút xem thêm */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
          <Link to="/cars" className="btn-outline">
            Xem thêm xe
          </Link>
        </div>

        <Promotions />
        <FeaturedCities />
        <FAQ />
        <Footer />
      </main>

      <footer className="footer" />
    </div>
  );
}
// ...existing code...
