import { Link } from "react-router-dom";
import "./promotions.css";

type Promo = {
  id: string;
  image: string;
  title: string;
  desc: string;
  cta?: string;
};

const PROMOS: Promo[] = [
  { id:"green-start", image:"/promo-green-start.jpg", title:"Green Start – Thuê Xe Điện, Giá Siêu Tiết Kiệm", desc:"Giảm giá 20% cho khách hàng lần đầu thuê xe điện.", cta:"Nhận khuyến mãi" },
  { id:"eco-friend",  image:"/promo-eco-friend.jpg",  title:"EcoFriend – Đi Chung Thêm Vui, Giá Giảm Cùng Nhau", desc:"Thuê xe theo nhóm (từ 3 người trở lên) được giảm thêm 15%.", cta:"Nhận khuyến mãi" },
  { id:"charge-free", image:"/promo-charge-free.jpg", title:"Charge Free – Thuê Xe Điện, Miễn Phí Sạc Pin", desc:"Tặng voucher sạc pin miễn phí tại trạm liên kết cho mỗi lần thuê.", cta:"Nhận khuyến mãi" },
];


export default function Promotions() {
  return (
    <section className="promo">
      <div className="promo__head">
        <h2>Chương Trình Khuyến Mãi</h2>
        <p>Nhận nhiều ưu đãi hấp dẫn từ GreenGo</p>
      </div>

      <div className="promo__grid">
        {PROMOS.map((p) => (
          <article className="promo-card" key={p.id}>
            <div className="promo-card__media">
              <img src={p.image} alt={p.title} loading="lazy" />
            </div>
            <div className="promo-card__body">
              <h3 className="promo-card__title">{p.title}</h3>
              <p className="promo-card__desc">{p.desc}</p>

              {/* Link đến trang đăng ký */}
              <Link to="/register" className="promo-card__cta" aria-label={`${p.cta} - ${p.title}`}>
                {p.cta ?? "Nhận khuyến mãi"} <span className="arrow">→</span>
              </Link>


            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
