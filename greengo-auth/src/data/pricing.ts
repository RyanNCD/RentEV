// src/data/pricing.ts
export type BillingCycle = "hour" | "day" | "week" | "month";

export const BILLING_LABEL: Record<BillingCycle, string> = {
  hour: "/giờ",
  day: "/ngày",
  week: "/tuần",
  month: "/tháng",
};

export type Plan = {
  id: string;
  name: string;
  tagline: string;
  popular?: boolean;
  prices: Record<BillingCycle, number>;
  includedKm: Record<BillingCycle, number>;
  features: { label: string; note?: string; available: boolean }[];
  ctaRoute?: string;
};

export const PRICING_PLANS: Plan[] = [
  {
    id: "city",
    name: "City",
    tagline: "Đi gần – linh hoạt trong phố",
    prices: { hour: 90000, day: 650000, week: 3990000, month: 13990000 },
    includedKm: { hour: 15, day: 120, week: 700, month: 2600 },
    features: [
      { label: "Giao xe trong nội khu miễn phí", available: true },
      { label: "Hỗ trợ 24/7 qua ứng dụng", available: true },
      { label: "Bảo hiểm cơ bản", available: true },
      { label: "Sạc nhanh tại trạm GreenGo", note: "giảm 20%", available: true },
      { label: "Thay xe khi có sự cố", available: false },
      { label: "Miễn phí vượt km", available: false },
    ],
    ctaRoute: "/booking?plan=city",
  },
  {
    id: "flex",
    name: "Flex",
    tagline: "Đi xa – chủ động lịch trình",
    popular: true,
    prices: { hour: 120000, day: 820000, week: 4890000, month: 16990000 },
    includedKm: { hour: 20, day: 160, week: 900, month: 3200 },
    features: [
      { label: "Giao xe trong nội khu miễn phí", available: true },
      { label: "Hỗ trợ 24/7 qua ứng dụng", available: true },
      { label: "Bảo hiểm mở rộng", available: true },
      { label: "Sạc nhanh tại trạm GreenGo", note: "giảm 30%", available: true },
      { label: "Thay xe khi có sự cố", available: true },
      { label: "Miễn phí vượt km", available: false },
    ],
    ctaRoute: "/booking?plan=flex",
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Doanh nghiệp – lịch chạy dày",
    prices: { hour: 150000, day: 990000, week: 5990000, month: 19990000 },
    includedKm: { hour: 25, day: 220, week: 1200, month: 4200 },
    features: [
      { label: "Giao xe trong nội khu miễn phí", available: true },
      { label: "Hỗ trợ 24/7 qua ứng dụng", available: true },
      { label: "Bảo hiểm toàn diện", available: true },
      { label: "Sạc nhanh tại trạm GreenGo", note: "giảm 40%", available: true },
      { label: "Thay xe khi có sự cố", available: true },
      { label: "Miễn phí vượt km", available: true },
    ],
    ctaRoute: "/booking?plan=pro",
  },
];

export const formatVND = (n: number) =>
  n.toLocaleString("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
