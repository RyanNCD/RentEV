import http from "../lib/http";

export interface IRevenueSummary {
  totalRevenue: number;
  totalPayments: number;
  averagePayment: number;
  revenueByMonth: Array<{
    year: number;
    month: number;
    revenue: number;
    count: number;
  }>;
  revenueByMethod: Array<{
    method: string;
    revenue: number;
    count: number;
  }>;
}

export interface IDailyRevenue {
  date: string;
  revenue: number;
  count: number;
}

export interface IRecentPayment {
  paymentId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  userName: string;
  vehicleName: string;
}

export interface IRevenueByStation {
  stationId: string;
  stationName: string;
  stationAddress: string;
  revenue: number;
  count: number;
}

// Get revenue summary
export const getRevenueSummary = async (
  startDate?: string,
  endDate?: string
): Promise<IRevenueSummary> => {
  const params: any = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  
  const response = await http.get<IRevenueSummary>("/api/revenue/summary", { params });
  return response.data;
};

// Get daily revenue
export const getDailyRevenue = async (
  startDate?: string,
  endDate?: string
): Promise<IDailyRevenue[]> => {
  const params: any = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  
  const response = await http.get<IDailyRevenue[]>("/api/revenue/daily", { params });
  return response.data;
};

// Get recent payments (with optional date filter)
export const getRecentPayments = async (
  limit: number = 10,
  startDate?: string,
  endDate?: string
): Promise<IRecentPayment[]> => {
  const params: any = { limit };
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  
  const response = await http.get<IRecentPayment[]>("/api/revenue/recent", { params });
  return response.data;
};

// Get revenue by station
export const getRevenueByStation = async (
  startDate?: string,
  endDate?: string
): Promise<IRevenueByStation[]> => {
  const params: any = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  
  const response = await http.get<IRevenueByStation[]>("/api/revenue/by-station", { params });
  return response.data;
};

