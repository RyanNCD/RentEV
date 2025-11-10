// Utility để dịch role names sang tiếng Việt

export const translateRole = (roleName: string | undefined | null): string => {
  if (!roleName) return "Không xác định";
  
  const normalized = roleName.trim().toLowerCase();
  
  const translations: Record<string, string> = {
    "admin": "Quản trị viên",
    "administrator": "Quản trị viên",
    "customer": "Khách hàng",
    "staffstation": "Nhân viên trạm",
    "staff": "Nhân viên",
    "staff_station": "Nhân viên trạm",
    "station_staff": "Nhân viên trạm",
    "renter": "Khách hàng",
    "user": "Người dùng",
  };
  
  return translations[normalized] || roleName;
};

