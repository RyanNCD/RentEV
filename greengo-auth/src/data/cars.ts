export type Tag = "popular" | "large" | "compact" | "premium";

export type Car = {
  id: string;
  name: string;
  pricePerDay: number;
  image: string;     // chỉ tên file, ví dụ "car1.jpg" (ảnh để trong public/images)
  tag: Tag;          // dùng cho tab lọc
  badges?: string[]; // tùy chọn: hiển thị các đặc điểm như "Số tự động", "5 chỗ"
};

export const cars: Car[] = [
  { id:"vf5",    name:"VinFast VF 5 Plus",     pricePerDay: 690000,  image:"car-vf5.jpg",     tag: "popular" },
  { id:"ev6",    name:"Kia EV6",               pricePerDay: 1200000, image:"car-ev6.jpg",     tag: "popular" },
  { id:"mg4",    name:"MG 4 Electric",         pricePerDay: 950000,  image:"car-mg4.jpg",     tag: "popular" },
  { id:"kona",   name:"Hyundai Kona Electric", pricePerDay: 1000000, image:"car-kona.jpg",    tag: "popular" },

  { id:"vf34",   name:"VinFast VF e34",        pricePerDay: 850000,  image:"car-vf34.jpg",    tag: "compact" },
  { id:"leaf",   name:"Nissan Leaf",           pricePerDay: 1100000, image:"car-leaf.jpg",    tag: "compact" },
  { id:"dolphin",name:"BYD Dolphin",           pricePerDay: 900000,  image:"car-dolphin.jpg", tag: "compact" },
  { id:"ora",    name:"Ora Good Cat GT",       pricePerDay: 1050000, image:"car-ora.jpg",     tag: "compact" },
];
