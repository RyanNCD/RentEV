import http from "../lib/http";

export type Vehicle = {
  vehicleId: string;
  stationId: string;
  vehicleName: string;
  vehicleType: string;
  batteryCapacity?: number;
  licensePlate: string;
  status: string;
  pricePerDay?: number;
  description?: string;
  seatingCapacity?: number;
  utilities?: string;
  numberOfRenters: number;
};

// API public - không cần authentication
export async function getAvailableVehicles(): Promise<Vehicle[]> {
  const res = await http.get<Vehicle[]>("/api/vehicle/available");
  return res.data;
}

// Lấy chi tiết xe (cần authentication)
export async function getVehicleById(id: string): Promise<Vehicle> {
  const res = await http.get<Vehicle>(`/api/vehicle/${id}`);
  return res.data;
}

// Lấy featured vehicles (public)
export async function getFeaturedVehicles(top: number = 5): Promise<Vehicle[]> {
  const res = await http.get<Vehicle[]>(`/api/vehicle/featured?top=${top}`);
  return res.data;
}
