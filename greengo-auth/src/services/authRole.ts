// Centralized auth role service: parse JWT, map roles, and redirect paths
import { jwtDecode } from "jwt-decode";

export type AppRole = "ADMIN" | "STAFF_STATION" | "CUSTOMER";

export interface DecodedTokenShape {
  nameid?: string;
  email?: string;
  role?: string; // normalized single role string
  exp?: number;
  stationId?: string;
}

function extractRole(payload: any): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const roleKeys = [
    "role",
    "roles",
    "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role",
  ];
  for (const key of roleKeys) {
    const val = payload[key];
    if (typeof val === "string" && val.trim()) return val.trim();
    if (Array.isArray(val) && val.length && typeof val[0] === "string") return (val[0] as string).trim();
  }
  return undefined;
}

export function decodeToken(token: string): DecodedTokenShape {
  try {
    const raw: any = jwtDecode<any>(token);
    const role = extractRole(raw);
    const nameid = raw?.nameid
      ?? raw?.sub
      ?? raw?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"]
      ?? raw?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/nameidentifier"];
    const email = raw?.email
      ?? raw?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"]
      ?? raw?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/emailaddress"];
    const exp = raw?.exp;
    const stationId = raw?.stationId
      ?? raw?.station_id
      ?? raw?.["stationId"]
      ?? raw?.["station_id"];
    return { nameid, email, role, exp, stationId };
  } catch {
    return {};
  }
}

export function mapServerRoleToAppRole(serverRole?: string): AppRole | null {
  if (!serverRole) return null;
  const normalized = serverRole.trim().toLowerCase();
  if (["admin", "administrator"].includes(normalized)) return "ADMIN";
  if (["staff", "staffstation", "station_staff", "stationstaff", "employee", "station"].includes(normalized)) return "STAFF_STATION";
  if (["customer", "renter", "user", "tenant"].includes(normalized)) return "CUSTOMER";
  return null;
}

export function getRedirectPathForRole(role: AppRole): string {
  switch (role) {
    case "ADMIN":
      return "/dashboard";
    case "STAFF_STATION":
      return "/dashboard";
    case "CUSTOMER":
      return "/";
  }
}

export function isRoleAuthorized(role: AppRole | null, allowed: AppRole[]): boolean {
  if (!role) return false;
  return allowed.includes(role);
}

export function isTokenExpired(decoded: DecodedTokenShape): boolean {
  if (!decoded?.exp) return true;
  return decoded.exp * 1000 < Date.now();
}