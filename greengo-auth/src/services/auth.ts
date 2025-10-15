import http from "../lib/http";


export type LoginReq = { email: string; password: string };

export async function login(payload: LoginReq) {
  const res = await http.post("/api/Authen/login", payload);
  const data: any = res.data;
  const accessToken = data?.token ?? data?.accessToken ?? data?.result?.token;
  if (accessToken) localStorage.setItem("gg_access_token", accessToken);
  return data;
}

export async function register(payload: LoginReq) {
  const res = await http.post("/api/Authen/register", payload);
  return res.data;
}

export function logout() {
  localStorage.removeItem("gg_access_token");
}
