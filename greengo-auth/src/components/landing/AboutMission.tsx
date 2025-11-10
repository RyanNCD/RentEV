import leaf from "../../assets/icons/leaf.jpg";
import star from "../../assets/icons/star.jpg";
import shield from "../../assets/icons/shield.jpg";
import headset from "../../assets/icons/headset.jpg";
import earth from "../../assets/icons/earth.jpg";
import link from "../../assets/icons/link.jpg";

type Item = { icon: string; title: string; desc: string };

const ITEMS: Item[] = [
  {
    icon: leaf,
    title: "Xanh hoá từng chuyến đi",
    desc: "Tiên phong mở rộng mạng lưới xe điện, giúp người dùng dễ dàng tiếp cận phương tiện thân thiện với môi trường."
  },
  {
    icon: star,
    title: "Tiện lợi trong từng thao tác",
    desc: "Chỉ với vài chạm trên ứng dụng, bạn có thể đặt, nhận và trả xe nhanh chóng – không giấy tờ rườm rà, không mất thời gian chờ đợi."
  },
  {
    icon: shield,
    title: "An toàn và tin cậy",
    desc: "Mỗi chiếc xe trước khi giao đều được kiểm định kỹ lưỡng, đảm bảo hành trình của bạn luôn an tâm và suôn sẻ."
  },
  {
    icon: headset,
    title: "Đồng hành cùng khách hàng",
    desc: "Đội ngũ hỗ trợ sẵn sàng 24/7, giúp bạn giải quyết mọi tình huống trên hành trình một cách nhanh chóng."
  },
  {
    icon: earth,
    title: "Lan toả thói quen sống xanh",
    desc: "Cộng đồng người dùng ý thức vì môi trường – nơi mỗi chuyến đi đều mang ý nghĩa tích cực cho Trái Đất."
  },
  {
    icon: link,
    title: "Kết nối công nghệ bền vững",
    desc: "Ứng dụng kết hợp giữa công nghệ hiện đại và định hướng phát triển xanh, góp phần vào tương lai giao thông thông minh hơn."
  }
];

export default function AboutMission() {
  return (
    <section className="about-mission">
      <div className="container">
        <h2 className="mission-title">Nhiệm Vụ</h2>
        <p className="mission-sub">Những giá trị GreenGo hướng đến trong từng hành trình</p>

        <div className="mission-grid">
          {ITEMS.map((it) => (
            <article className="mission-card" key={it.title}>
              <img src={it.icon} alt={it.title} className="mission-icon" />
              <h4>{it.title}</h4>
              <p>{it.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
