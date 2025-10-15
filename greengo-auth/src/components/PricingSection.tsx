// src/components/PricingSection.tsx
import React, { useMemo, useState } from "react";
import { PRICING_PLANS, BILLING_LABEL, formatVND, type BillingCycle } from "../data/pricing";
import "./pricing.css";
import { useNavigate } from "react-router-dom";
import FaqSection from "./FaqSection";
import Footer from "./Footer";
const TOGGLE_OPTS: { key: BillingCycle; label: string }[] = [
  { key: "hour", label: "Giờ" },
  { key: "day", label: "Ngày" },
  { key: "week", label: "Tuần" },
  { key: "month", label: "Tháng" },
];

const PricingSection: React.FC = () => {
  const [cycle, setCycle] = useState<BillingCycle>("day");
  const navigate = useNavigate();

  const discountNote = useMemo(() => {
    if (cycle === "week") return "Giảm ~10% so với theo ngày";
    if (cycle === "month") return "Giảm ~18% so với theo ngày";
    return "";
  }, [cycle]);

  return (
    <section className="gg-pricing" aria-label="Bảng giá GreenGo">
      <div className="gg-hero">
        <h2 className="gg-hero__title">Bảng giá GreenGo</h2>
        <p className="gg-hero__subtitle">
          Thuê xe điện linh hoạt theo {cycle === "hour" ? "giờ" : cycle === "day" ? "ngày" : cycle === "week" ? "tuần" : "tháng"}.
          {discountNote ? ` ${discountNote}.` : ""}
        </p>

        <div className="gg-toggle" role="tablist" aria-label="Chu kỳ thuê">
          {TOGGLE_OPTS.map((opt) => (
            <button
              key={opt.key}
              role="tab"
              aria-selected={cycle === opt.key}
              className={`gg-toggle__btn ${cycle === opt.key ? "is-active" : ""}`}
              onClick={() => setCycle(opt.key)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="gg-grid">
        {PRICING_PLANS.map((p) => (
          <article key={p.id} className={`gg-card ${p.popular ? "gg-card--popular" : ""}`} aria-label={p.name}>
            {p.popular && <div className="gg-card__ribbon">Phổ biến</div>}
            <header className="gg-card__header">
              <h3 className="gg-card__title">{p.name}</h3>
              <p className="gg-card__tagline">{p.tagline}</p>
            </header>

            <div className="gg-price">
              <div className="gg-price__amount">{formatVND(p.prices[cycle])}</div>
              <div className="gg-price__suffix">{BILLING_LABEL[cycle]}</div>
              <div className="gg-price__km">Đã gồm {p.includedKm[cycle]} km</div>
            </div>

            <ul className="gg-card__features">
              {p.features.map((f, idx) => (
                <li key={idx} className={`gg-card__feature ${f.available ? "ok" : "no"}`}>
                  <span aria-hidden="true">{f.available ? "✓" : "—"}</span>
                  <span>
                    {f.label} {f.note ? <em className="gg-note">({f.note})</em> : null}
                  </span>
                </li>
              ))}
            </ul>

            <button
              className="gg-card__cta"
              onClick={() => navigate(p.ctaRoute || "/booking")}
              aria-label={`Thuê ngay gói ${p.name}`}
            >
              Thuê ngay
            </button>
          </article>
        ))}
      </div>

      <div className="gg-compare">
        <h3>So sánh nhanh tính năng</h3>
        <div className="gg-table" role="table" aria-label="Bảng so sánh tính năng">
          <div className="gg-table__head" role="row">
            <div role="columnheader">Tính năng</div>
            {PRICING_PLANS.map((p) => (
              <div key={p.id} role="columnheader">{p.name}</div>
            ))}
          </div>
                {/* ...khối gg-compare ở trên... */}

      


          {PRICING_PLANS[0].features.map((feat, rowIdx) => (
            <div className="gg-table__row" role="row" key={rowIdx}>
              <div role="cell" className="gg-table__feature-name">{feat.label}</div>
              {PRICING_PLANS.map((p) => {
                const f = p.features[rowIdx];
                return (
                  <div role="cell" key={p.id + rowIdx} className={`gg-table__cell ${f.available ? "ok" : "no"}`}>
                    {f.available ? "✓" : "—"} {f.note ? <em className="gg-note">({f.note})</em> : null}
                  </div>
                );
              })}
            </div>
          ))}
          <FaqSection />
        </div>
        <Footer />
      </div>
    </section>
    
  );
};
<FaqSection />
export default PricingSection;
