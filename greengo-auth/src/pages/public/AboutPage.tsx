import AboutMission from "../../components/landing/AboutMission";
import HowItWorks from "../../components/landing/HowItWorks";
import WhyChoose from "../../components/landing/WhyChoose";
import "../about.css";

export default function AboutPage() {
  return (
    <div className="page page--about">
      {/* HERO: thay ảnh ở /public/about-hero.jpg */}
      <section className="about-hero">
        <img src="/public/about-hero.jpg" alt="" />
        <div className="about-hero__overlay" />
        <div className="container about-hero__content">
          <h1 className="about-hero__title">GreenGo</h1>
          <h2 className="about-hero__line">Hành trình xanh</h2>
          <h2 className="about-hero__line">Khởi đầu từ một cú chạm</h2>
        </div>
      </section>

      {/* INTRO 2 CỘT */}
      <main className="container about-intro">
        <div className="about-intro__left">
          <h3 className="about-intro__heading">
            Hành trình xanh,<br />trải nghiệm sạch
          </h3>
        </div>
        <div className="about-intro__right">
          <p>
            GreenGo ra đời với sứ mệnh tạo nên một cách di chuyển mới xanh hơn,
            tiện lợi hơn và thông minh hơn.
          </p>
          <p>
            Chúng tôi tin rằng việc lựa chọn phương tiện không chỉ là di chuyển
            từ điểm A đến điểm B, mà còn là cách mỗi người góp phần bảo vệ hành tinh.
          </p>
          <p>
            Từ những chiếc xe điện đầu tiên được đưa vào hệ thống, GreenGo hướng đến
            mục tiêu xây dựng cộng đồng người dùng yêu môi trường, nơi mọi hành trình
            đều là một bước tiến nhỏ cho tương lai bền vững.
          </p>
          <p>
            Ứng dụng đặt nhanh chóng, giao xe tận nơi, hỗ trợ 24/7 — mang đến trải nghiệm
            thuê xe điện an toàn, tiện lợi và tràn đầy năng lượng tích cực.
          </p>
        </div>
      </main>

      {/* Bọc các section dưới bằng container để đồng bộ lề 2 bên với Home */}
      <section className="container"><AboutMission /></section>
      <section className="container"><HowItWorks /></section>
      <section className="container"><WhyChoose /></section>

      
    </div>
  );
}
