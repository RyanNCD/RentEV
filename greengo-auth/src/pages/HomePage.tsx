import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Tabs from "../components/Tabs";
import SearchBar from "../components/SearchBar";
import PromoCard from "../components/PromoCard";

const HERO_URL = "/hero.jpg";

export default function HomePage(){
  const nav = useNavigate();

  const [tab, setTab] = useState<"self"|"withDriver"|"longTerm">("self");
  const [city, setCity] = useState("TP. Hồ Chí Minh");
  const [start, setStart] = useState(new Date().toISOString().slice(0,16));
  const [end, setEnd] = useState(() => { const d=new Date(); d.setDate(d.getDate()+1); return d.toISOString().slice(0,16); });

  const onFind = () => {
    const q = new URLSearchParams({
      city,
      start,
      end,
      mode: tab,
    });
    nav(`/search?${q.toString()}`);
  };

  return (
    <>
      <Navbar />
      <div className="container">
        <Tabs value={tab} onChange={setTab}/>
        <section className="card search">
          <SearchBar
            city={city} onCity={setCity}
            start={start} end={end}
            onStart={setStart} onEnd={setEnd}
            onFind={onFind}
          />
          <div className="hero"><img src={HERO_URL} alt="Hero" /></div>
        </section>

        <section className="promo">
          <h2>Chương Trình Khuyến Mãi</h2>
          <p className="sub">Nhận nhiều ưu đãi hấp dẫn từ GreenGo</p>
          <div className="promo-grid">
            <PromoCard title="Miễn phí giao xe" desc="Bán kính 10km (đơn > 2 ngày)"/>
            <PromoCard title="Giảm 15% xe tự lái" desc="Cho khách mới"/>
            <PromoCard title="Tặng 1 ngày" desc="Thuê 6 ngày tặng 1"/>
          </div>
        </section>
      </div>
      <footer className="footer"><div className="container">© {new Date().getFullYear()} GreenGo.</div></footer>
    </>
  );
}
