import location from "../../assets/icons/location.jpg";
import calendar from "../../assets/icons/calendar.jpg";
import car from "../../assets/icons/car.jpg";

const STEPS = [
  {
    icon: location,
    title: "Chọn địa điểm",
    desc: "Chọn vị trí bạn muốn nhận xe – GreenGo hỗ trợ giao xe tận nơi miễn phí trong khu vực hoạt động."
  },
  {
    icon: calendar,
    title: "Chọn thời gian thuê",
    desc: "Tuỳ chỉnh thời gian theo nhu cầu: vài giờ, một ngày hay nhiều ngày. Có chính sách giữ xe miễn phí trước 8 giờ so với thời gian nhận."
  },
  {
    icon: car,
    title: "Đặt xe của bạn",
    desc: "Hoàn tất đặt xe với vài thao tác trên ứng dụng. Tất cả xe đều được kiểm định trước khi giao, giúp bạn an tâm khởi hành."
  }
];

export default function HowItWorks() {
  return (
    <section className="how-section">
      <div className="container">
        <h2 className="section-title" style={{ marginBottom: 4 }}>Cách Hoạt Động</h2>
        <p className="section-sub">Thuê xe điện cùng GreenGo thật dễ dàng</p>

        <div className="how-grid">
          {STEPS.map((s) => (
            <div className="how-item" key={s.title}>
              <img src={s.icon} alt={s.title} className="how-icon" />
              <h4>{s.title}</h4>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
