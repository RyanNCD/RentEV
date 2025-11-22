// src/data/cars.ts

export type Tag = "popular" | "compact" | "large" | "premium";
export type Tone = "success" | "info" | "muted" | "warning";

export type Badge = { text: string; tone?: Tone };

export type Car = {
  id: string;
  name: string;
  pricePerDay: number; // VND / ngày
  image: string;       // chỉ tên file, ví dụ "car-vf7.jpg" (ảnh để trong public/images)
  tag: Tag;
  href?: string;       // link chi tiết (nếu có)
  badges?: Badge[];    // badge hiển thị ngay dưới ảnh
};

export const cars: Car[] = [
  {
    id: "vf7",
    name: "VinFast VF 7 2024",
    pricePerDay: 1500000,
    image: "car-vf7.jpg",
    tag: "popular",
    badges: [{ text: "Giao xe tận nơi", tone: "success" }],
  },
  {
    id: "vf3",
    name: "VinFast VF 3 2024",
    pricePerDay: 850000,
    image: "car-vf3.jpg",
    tag: "popular",
    badges: [
      { text: "Giao xe tận nơi", tone: "info" },
      { text: "Miễn thế chấp", tone: "muted" },
    ],
  },
  {
    id: "vf6",
    name: "VinFast VF 6 2023",
    pricePerDay: 1200000,
    image: "car-vf6.jpg",
    tag: "popular",
    badges: [{ text: "Giao xe tận nơi", tone: "success" }],
  },
  {
    id: "vf34",
    name: "VinFast VF e34 2021",
    pricePerDay: 850000,
    image: "car-vf34.jpg",
    tag: "compact",
    badges: [
      { text: "Giao xe tận nơi", tone: "info" },
      { text: "Miễn thế chấp", tone: "muted" },
    ],
  },
  {
    id: "ioniq5",
    name: "HYUNDAI IONIQ 5 2023",
    pricePerDay: 1600000,
    image: "car-ioniq5.jpg",
    tag: "large",
    badges: [{ text: "Giao xe tận nơi", tone: "success" }],
  },
  {
    id: "ev6",
    name: "KIA EV6",
    pricePerDay: 1200000,
    image: "car-ev6.jpg",
    tag: "popular",
    badges: [
      { text: "Giao xe tận nơi", tone: "info" },
      { text: "Bảo hiểm đặc biệt", tone: "muted" },
    ],
  },
  {
    id: "vf5",
    name: "VinFast VF 5 2023",
    pricePerDay: 3500000,
    image: "car-vf5.jpg",
    tag: "premium",
    badges: [{ text: "Giao xe tận nơi", tone: "info" }],
  },
  {
    id: "vf9",
    name: "VinFast VF 9 2023",
    pricePerDay: 3800000,
    image: "car-vf9.jpg",
    tag: "premium",
    badges: [
      { text: "Giao xe tận nơi", tone: "info" },
      { text: "Sạc miễn phí", tone: "muted" },
    ],
  },
  {
    id: "vf8",
    name: "VinFast VF 8 2024",
    pricePerDay: 1600000,
    image: "car-vf8.jpg",
    tag: "large",
    badges: [{ text: "Giao xe tận nơi", tone: "success" }],
  },
];
