import http from "../lib/http";

export type User = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  identityCard?: string;
  driverLicense?: string;
  avatarUrl?: string;
  createdAt?: string;
};

export async function getMe() {
  const res = await http.get<User>("/api/User/me");
  return res.data;
}

// cập nhật hồ sơ (BE của bạn có thể khác path/field; chỉnh key cho khớp)
export async function updateProfile(payload: Partial<User>) {
  const res = await http.put("/api/User/me", payload);
  return res.data;
}

export async function changePassword(payload: { currentPassword: string; newPassword: string }) {
  const res = await http.post("/api/Authen/change-password", payload);
  return res.data;
}

// nếu BE có endpoint upload ảnh; nếu chưa có, ẩn nút Upload
export async function uploadAvatar(file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await http.post("/api/User/avatar", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data as { url: string };
}

// lịch sử đơn (placeholder – chỉnh path cho đúng BE)
export type Booking = {
  id: string;
  carName: string;
  startDate: string;
  endDate: string;
  status: "pending" | "confirmed" | "completed" | "canceled";
  price: number;
};
export async function getMyBookings() {
  const res = await http.get<Booking[]>("/api/Booking/my");
  return res.data;
}
