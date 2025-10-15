import { type FormEvent } from "react";
import "./footer.css";

export default function Footer() {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: xử lý logic đăng ký email ở đây (nếu cần)
    console.log("Đã nhấn nút đăng ký");
  };

  return (
    <footer className="footer">
      {/* Hàng đầu */}
      <div className="footer-top">
        <div className="footer-brand">
          <div className="footer-logo">
            {/* Nếu bạn có logo riêng, thay <span> bằng <img src="/logo.png" alt="GreenGo" /> */}
            <img src="/logo.png" alt="GreenGo" style={{ width: 40, height: "auto" }} />
            <span className="logo-text">GREENGO</span>
          </div>
          <h4 className="footer-slogan">
            Thuê xe dễ dàng – Tận hưởng không giới hạn
          </h4>
        </div>

        <form className="footer-form" onSubmit={handleSubmit}>
          <label htmlFor="newsletter" className="sr-only">
            Nhập email của bạn
          </label>
          <input
            id="newsletter"
            type="email"
            placeholder="Nhập email của bạn"
            required
            className="footer-input"
          />
          <button type="submit" className="footer-btn">Đăng ký</button>
        </form>
      </div>

      {/* Lưới nội dung */}
      <div className="footer-grid">
        <div className="footer-col">
          <h5>Về chúng tôi</h5>
          <ul>
            <li><a href="#">Tầm nhìn</a></li>
            <li><a href="#">Đội ngũ GreenGo</a></li>
            <li><a href="#">Câu chuyện thương hiệu</a></li>
            <li><a href="#">Chính sách & cam kết</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h5>Dịch vụ</h5>
          <ul>
            <li><a href="#">Thuê xe điện cá nhân</a></li>
            <li><a href="#">Thuê xe du lịch – công tác</a></li>
            <li><a href="#">Giao xe tận nơi miễn phí</a></li>
            <li><a href="#">Sạc điện linh hoạt tại trạm đối tác</a></li>
            <li><a href="#">Hỗ trợ 24/7</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h5>Hỗ trợ khách hàng</h5>
          <ul>
            <li><a href="#">Câu hỏi thường gặp (FAQs)</a></li>
            <li><a href="#">Hướng dẫn thuê xe</a></li>
            <li><a href="#">Chính sách hoàn hủy</a></li>
            <li><a href="#">Liên hệ hỗ trợ kỹ thuật</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h5>Liên hệ</h5>
          <ul className="footer-contact">
            <li>
              <span className="icon" aria-hidden></span>
              <a href="mailto:support@gogreen.vn">support@gogreen.vn</a>
            </li>
            <li>
              <span className="icon" aria-hidden></span>
              <a href="tel:1900988668">1900 *** ***</a>
            </li>
          </ul>
        </div>
      </div>

      {/* Dòng cuối */}
      <div className="footer-bottom">
        <p>© 2025 GoGreen | All Rights Reserved</p>
        <nav className="footer-legal">
          <a href="#">Điều khoản sử dụng</a>
          <span>•</span>
          <a href="#">Chính sách bảo mật</a>
        </nav>
      </div>
    </footer>
  );
}
