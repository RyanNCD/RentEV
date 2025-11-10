import { useState } from "react";

type QA = { q: string; a: string };
const QA_LIST: QA[] = [
  {
    q: "GreenGo là gì và hoạt động như thế nào?",
    a: "GreenGo là nền tảng thuê xe ô tô điện thông minh, đặt – nhận – trả xe hoàn toàn online. Bạn chọn xe, thời gian và điểm giao, hệ thống sẽ gợi ý phương án thuận tiện nhất."
  },
  { q: "Tôi có phải trả phí giao xe không?", a: "Một số khu vực có hỗ trợ giao xe miễn phí trong bán kính nhất định; ngoài vùng sẽ tính phụ phí theo chính sách đối tác." },
  { q: "Làm sao để thuê xe điện trên GoGreen?", a: "Chọn địa điểm, thời gian, tìm xe phù hợp, xác nhận đặt và thanh toán – nhận xe đúng hẹn." },
  { q: "Tôi có cần bằng lái để thuê xe không", a: "Có. Bạn cần bằng lái hợp lệ còn hiệu lực theo quy định." },
  { q: "Tôi có thể hủy hoặc thay đổi đơn thuê không?", a: "Có thể. Phí/điều kiện sẽ tùy theo thời điểm hủy thay đổi." },
  { q: "Xe điện có đủ pin cho chuyến đi dài không?", a: "Mỗi xe đều được bàn giao mức pin tối thiểu; bạn có thể xem trạm sạc trên lộ trình." },
  { q: "GreenGo có cung cấp bảo hiểm chuyến đi không?", a: "Tùy mẫu xe và đối tác; thông tin hiển thị chi tiết khi đặt." },
  { q: "Tôi có thể thanh toán bằng những hình thức nào?", a: "Hỗ trợ thẻ, ví điện tử và chuyển khoản tùy khu vực." },
  { q: "Nếu xe gặp sự cố giữa đường thì sao?", a: "Liên hệ hotline hỗ trợ 24/7; chúng tôi phối hợp đối tác xử lý nhanh nhất." }
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="section">
      <h2 className="section-title" style={{marginBottom: 8}}>Câu Hỏi Thường Gặp</h2>

      <div className="faq">
        {QA_LIST.map((item, idx) => {
          const isOpen = open === idx;
          return (
            <div key={idx} className={`faq-item ${isOpen ? "open" : ""}`}>
              <button
                className="faq-q"
                onClick={() => setOpen(isOpen ? null : idx)}
                aria-expanded={isOpen}
                aria-controls={`faq-${idx}`}
              >
                <span className="q-index">{idx + 1}.</span> {item.q}
                <span className="q-icon">{isOpen ? "–" : "+"}</span>
              </button>
              <div id={`faq-${idx}`} className="faq-a">
                {item.a}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
