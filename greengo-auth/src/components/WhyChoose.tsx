// Thay ảnh/icon của bạn trong thư mục src/assets/... cho thuận tiện
import whyImg from "../assets/why-choose.jpg";         // ảnh lớn bên trái
import icSupport from "../assets/icons/support.jpg";    // hỗ trợ 24/7
import icPrice from "../assets/icons/price.jpg";        // giá tốt - minh bạch
import icDelivery from "../assets/icons/location.jpg";  // giao xe tận nơi
import "./whychoose.css"; // nhớ import file CSS riêng

type Reason = { icon: string; title: string; desc: string };

const REASONS: Reason[] = [
  {
    icon: icSupport,
    title: "Hỗ trợ khách hàng 24/7",
    desc: "Đội ngũ GreenGo luôn sẵn sàng hỗ trợ bất cứ lúc nào – từ lúc đặt xe, nhận xe cho đến khi kết thúc hành trình. Mọi thắc mắc đều được giải đáp nhanh chóng và tận tâm.",
  },
  {
    icon: icPrice,
    title: "Giá tốt nhất – Minh bạch tuyệt đối",
    desc: "Không phụ phí ẩn, rõ ràng về mức giá. GreenGo cam kết mang đến mức giá cạnh tranh và rõ ràng nhất, giúp bạn an tâm chi tiêu mà không lo phát sinh.",
  },
  {
    icon: icDelivery,
    title: "Giao xe tận nơi – Linh hoạt địa điểm",
    desc: "Dù bạn ở nhà, công ty hay khách sạn, GreenGo đều giao xe tận tay miễn phí trong khu vực hoạt động.",
  },
];

export default function WhyChoose() {
  return (
    <section className="why-choose">
      <div className="container why-choose__inner">
        <h2 className="why-choose__title">Vì Sao Chọn GreenGo</h2>
        <p className="why-choose__subtitle">
          Giải pháp thuê xe điện tiện lợi – an toàn – thân thiện với môi trường, dành cho mọi hành trình của bạn
        </p>

        <div className="why-choose__grid">
          <div className="why-choose__media">
            <img src={whyImg} alt="GreenGo" />
          </div>

          <ul className="why-choose__list">
            {REASONS.map((r, i) => (
              <li key={i} className="why-choose__item">
                <div className="why-choose__icon">
                  <img src={r.icon} alt={r.title} />
                </div>
                <div className="why-choose__content">
                  <h4 className="why-choose__item-title">{r.title}</h4>
                  <p className="why-choose__item-desc">{r.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
