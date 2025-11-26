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

