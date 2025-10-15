import React, { useState } from "react";
import "./faq.css";

type FAQ = { q: string; a: string };

const FAQS: FAQ[] = [
  {
    q: "Vượt km tính như thế nào?",
    a: "Phí vượt km tùy theo gói và dòng xe (15.000–20.000 VND/km). Hệ thống sẽ hiển thị rõ trước khi bạn xác nhận thuê.",
  },
  {
    q: "Đặt xe trước bao lâu?",
    a: "Bạn có thể đặt trước tối đa 30 ngày. Gói Pro cho phép lên lịch định kỳ theo tuần/tháng.",
  },
  {
    q: "Chính sách sạc điện?",
    a: "Xe giao ở mức sạc tối thiểu 70%. Khi trả xe, bạn chỉ cần sạc về mức tương đương hoặc sử dụng trạm GreenGo với mức giảm theo gói (20%/30%/40%).",
  },
  {
    q: "Tài sản thế chấp & giấy tờ cần chuẩn bị?",
    a: "CMND/CCCD/hộ chiếu còn hiệu lực, GPLX phù hợp hạng xe. Một số dòng xe yêu cầu đặt cọc (hoàn lại khi kết thúc hợp đồng).",
  },
];

const NOTES: string[] = [
  "Phí phụ trội giờ: tính pro-rata theo gói đang dùng.",
  "Phụ phí làm sạch đặc biệt (nếu có): thông báo trước khi thu.",
  "Phí giao/nhận ngoài nội khu: hiển thị rõ trên màn xác nhận.",
];

const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const toggle = (i: number) => setOpenIndex(i === openIndex ? null : i);

  return (
    <section className="faq-section">
      <h2 className="faq-title">Câu Hỏi Thường Gặp</h2>

      <div className="faq-list">
        {FAQS.map((item, i) => (
          <div key={i} className={`faq-item ${openIndex === i ? "open" : ""}`}>
            <button className="faq-question" onClick={() => toggle(i)}>
              <span className="faq-number">{i + 1}.</span>
              <span className="faq-text">{item.q}</span>
              <span className="faq-icon">{openIndex === i ? "−" : "+"}</span>
            </button>
            {openIndex === i && <div className="faq-answer">{item.a}</div>}
          </div>
        ))}
      </div>

      <div className="gg-notes">
        <h4>Lưu ý về phí</h4>
        <ul>
          {NOTES.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default FaqSection;
