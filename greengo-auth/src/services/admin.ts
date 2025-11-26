// File: src/services/admin.ts
import http from "../lib/http";
import { type IUser, type IStation } from "../types";

export interface IRole {
  roleId: string;
  roleName: string;
  description?: string;
}

// Get all users
export const getUsers = async (): Promise<IUser[]> => {
  const response = await http.get<IUser[]>("/api/users");
  return response.data;
};

// Get only customer users (optimized for UserManagement)
export const getCustomerUsers = async (): Promise<IUser[]> => {
  const response = await http.get<IUser[]>("/api/users/customers");
  return response.data;
};

// Get user by ID
export const getUserById = async (userId: string): Promise<IUser> => {
  const response = await http.get<IUser>(`/api/users/${userId}`);
  return response.data;
};

// Create user
export const createUser = async (userData: any): Promise<IUser> => {
  const response = await http.post<IUser>("/api/users", userData);
  return response.data;
};

// Update user
export const updateUser = async (userId: string, userData: any): Promise<IUser> => {
  const response = await http.put<IUser>(`/api/users/${userId}`, userData);
  return response.data;
};

// Delete user
export const deleteUser = async (userId: string): Promise<void> => {
  await http.delete(`/api/users/${userId}`);
};

// Ban user (add to blacklist and downgrade to Customer)
export const banUser = async (userId: string, reason: string): Promise<IUser> => {
  const response = await http.post<IUser>(`/api/users/${userId}/ban`, { reason });
  return response.data;
};

// Update user role
export const updateUserRole = async (userId: string, roleId: string): Promise<IUser> => {
  const response = await http.patch<IUser>(`/api/users/${userId}/role`, { roleId });
  return response.data;
};

// Get all roles
export const getRoles = async (): Promise<IRole[]> => {
  const response = await http.get<IRole[]>("/api/users/roles");
  return response.data;
};

// Get staff users
export const getStaffList = async (): Promise<IUser[]> => {
  const response = await http.get<IUser[]>("/api/users/staffstation");
  return response.data;
};

// Delete staff
export const deleteStaff = async (staffId: string): Promise<void> => {
  await http.delete(`/api/users/staffstation/${staffId}`);
};

// Revoke staff role (downgrade to Customer)
export const revokeStaffRole = async (staffId: string): Promise<IUser> => {
  const response = await http.post<IUser>(`/api/users/staffstation/${staffId}/revoke`);
  return response.data;
};

export const getStations = async (): Promise<IStation[]> => {
  const response = await http.get<IStation[]>("/api/station");
  return response.data;
};

export const updateStaffStation = async (staffId: string, stationId: string | null): Promise<IUser> => {
  const response = await http.patch<IUser>(`/api/users/staffstation/${staffId}/station`, { stationId });
  return response.data;
};