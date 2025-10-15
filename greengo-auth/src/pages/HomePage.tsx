// ...existing code...
import { useState } from "react";
import type { Car } from "../data/cars";

import Tabs from "../components/Tabs";
import SearchBar from "../components/SearchBar";
import CarCard from "../components/CarCard";
import FeaturedCities from "../components/FeaturedCities";
import FAQ from "../components/FAQ";
import Footer from "../components/Footer";
import Promotions from "../components/Promotions";


// ...existing code...
const MOCK_CARS: Car[] = [
  { id: "1", name: "Toyota Vios 2022",   pricePerDay: 650000, image: "car1.jpg", tag: "popular", badges: ["Số tự động", "5 chỗ"] },
  { id: "2", name: "Kia Seltos 2023",    pricePerDay: 820000, image: "car2.jpg", tag: "large",   badges: ["SUV", "7 túi khí"] },
  { id: "3", name: "Hyundai Accent",     pricePerDay: 600000, image: "car3.jpg", tag: "compact", badges: ["Tiết kiệm", "5 chỗ"] },
];

// ...existing code...

export default function HomePage() {
  const [tab, setTab] = useState<"self" | "with" | "long">("self");
  const [city, setCity] = useState("Thành phố Hồ Chí Minh");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [cars, setCars] = useState<Car[]>(MOCK_CARS);

  function handleSearch() {
    if (tab === "with") setCars(MOCK_CARS.slice(0, 2));
    else if (tab === "long") setCars(MOCK_CARS.slice(1));
    else setCars(MOCK_CARS);
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

        <section className="grid-cars">
          {cars.map(c => <CarCard key={c.id} car={c} />)}
        </section>

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