import http from "../lib/http";

export type Rental = {
  rentalId: string;
  contractId?: string;
  userId: string;
  vehicleId: string;
  pickupStationId: string;
  returnStationId?: string;
  staffId?: string;
  startTime?: string;
  endTime?: string;
  totalCost?: number;
  status: string;
  createdAt?: string;
};

export type VehicleConditionCheck = {
  imageUrls: string[];
  note?: string;
  description?: string;
};

// Lấy tất cả rentals (cho admin/staff)
export async function getAllRentals() {
  const res = await http.get<Rental[]>("/api/rental");
  return res.data;
}

// Lấy rental theo ID
export async function getRentalById(id: string) {
  const res = await http.get<Rental>(`/api/rental/${id}`);
  return res.data;
}

// Lấy các rental cần checkin
export async function getCheckinRentals() {
  const res = await http.get<Rental[]>("/api/rental/checkin");
  return res.data;
}

// Checkin rental
export async function checkinRental(rentalId: string, conditionCheck: VehicleConditionCheck) {
  const res = await http.post<Rental>(`/api/rental/checkin/${rentalId}`, conditionCheck);
  return res.data;
}

// Lấy các rental cần trả
export async function getReturnRentals() {
  const res = await http.get<Rental[]>("/api/rental/return");
  return res.data;
}

// Trả xe
export async function returnRental(rentalId: string, conditionCheck: VehicleConditionCheck) {
  const res = await http.post<Rental>(`/api/rental/return/${rentalId}`, conditionCheck);
  return res.data;
}

// Tạo rental mới
export async function createRental(rental: Partial<Rental>) {
  const res = await http.post<Rental>("/api/rental", rental);
  return res.data;
}

// Hủy rental
export async function cancelRental(rentalId: string) {
  const res = await http.put(`/api/rental/cancel/${rentalId}`, {});
  return res.data;
}
