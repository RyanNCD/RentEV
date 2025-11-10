import http from "../lib/http";

export interface UploadResponse {
  url: string;
}

export const uploadRentalImage = async (
  file: File,
  rentalId?: string,
  type?: string,
  description?: string,
  note?: string
): Promise<UploadResponse> => {
  const form = new FormData();
  form.append("file", file);
  if (rentalId) form.append("rentalId", rentalId);
  if (type) form.append("type", type);
  if (description) form.append("description", description);
  if (note) form.append("note", note);

  const response = await http.post<UploadResponse>("/api/upload/rental-image", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export interface RentalImageItem {
  imageId: string;
  rentalId: string;
  imageUrl: string;
  type: string;
  description?: string | null;
  note?: string | null;
  createdAt?: string | null;
}

export const getRentalImages = async (rentalId: string): Promise<RentalImageItem[]> => {
  const response = await http.get<RentalImageItem[]>(`/api/upload/rental-image/${rentalId}`);
  return response.data;
};

export const uploadVehicleImage = async (
  file: File,
  vehicleId?: string
): Promise<UploadResponse> => {
  const form = new FormData();
  form.append("file", file);
  if (vehicleId) form.append("vehicleId", vehicleId);

  const response = await http.post<UploadResponse>("/api/upload/vehicle-image", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};