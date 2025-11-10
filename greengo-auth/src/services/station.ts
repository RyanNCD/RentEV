// File: src/services/station.ts (Bản fix theo API mới)

import http from "../lib/http";
import { type IStation } from "../types"; 

// DTO cho TẠO MỚI (theo image_a10825.png, bỏ stationId, createdAt)
type StationCreateDto = {
  stationName: string;
  address: string;
  latitude: number;
  longitude: number;
};

// DTO cho CẬP NHẬT
type StationUpdateDto = Partial<StationCreateDto>;

// Sửa: /api/station -> /api/Station (Chữ S hoa)
export const getAllStations = async (): Promise<IStation[]> => {
  const response = await http.get<IStation[]>("/api/station"); 
  return response.data;
};

// (Giả sử các API khác cũng dùng /api/Station)
export const getStationById = async (id: string): Promise<IStation> => {
    const response = await http.get<IStation>(`/api/station/${id}`);
    return response.data;
}

export const createStation = async (data: StationCreateDto): Promise<IStation> => {
  const response = await http.post<IStation>("/api/station", data);
  return response.data;
};

export const updateStation = async (id: string, data: StationUpdateDto): Promise<IStation> => {
  const response = await http.put<IStation>(`/api/station/${id}`, data);
  return response.data;
};

export const deleteStation = async (id: string): Promise<void> => {
  await http.delete(`/api/station/${id}`);
};