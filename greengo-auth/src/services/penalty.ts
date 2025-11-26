import http from "../lib/http";
import { type IPenalty } from "../types";

// Get all active penalties (public - customers need to see penalty rates)
export const getPenalties = async (): Promise<IPenalty[]> => {
  const response = await http.get<IPenalty[]>("/api/penalty");
  return response.data;
};

// Get penalty by ID
export const getPenaltyById = async (penaltyId: string): Promise<IPenalty> => {
  const response = await http.get<IPenalty>(`/api/penalty/${penaltyId}`);
  return response.data;
};

// Admin: create penalty
export const createPenalty = async (payload: Omit<IPenalty, "penaltyId" | "createdAt" | "updatedAt">): Promise<IPenalty> => {
  const body = {
    violationType: payload.violationType,
    description: payload.description,
    amount: payload.amount,
    isActive: payload.isActive,
  };
  const response = await http.post<IPenalty>("/api/penalty", body);
  return response.data;
};

// Admin: update penalty
export const updatePenalty = async (
  penaltyId: string,
  payload: Omit<IPenalty, "penaltyId" | "createdAt" | "updatedAt">
): Promise<IPenalty> => {
  const body = {
    violationType: payload.violationType,
    description: payload.description,
    amount: payload.amount,
    isActive: payload.isActive,
  };
  const response = await http.put<IPenalty>(`/api/penalty/${penaltyId}`, body);
  return response.data;
};

// Admin: delete (soft) penalty
export const deletePenalty = async (penaltyId: string): Promise<void> => {
  await http.delete(`/api/penalty/${penaltyId}`);
};

