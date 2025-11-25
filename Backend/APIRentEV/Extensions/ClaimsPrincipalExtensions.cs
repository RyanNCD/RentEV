using System;
using System.Security.Claims;

namespace APIRentEV.Extensions
{
    public static class ClaimsPrincipalExtensions
    {
        private const string StationClaimType = "stationId";

        public static Guid? GetStationId(this ClaimsPrincipal principal)
        {
            if (principal == null) return null;

            var rawValue = principal.FindFirstValue(StationClaimType)
                           ?? principal.FindFirstValue("station_id");

            return Guid.TryParse(rawValue, out var stationId) ? stationId : null;
        }

        public static bool IsAdmin(this ClaimsPrincipal principal)
        {
            var role = principal?.FindFirstValue(ClaimTypes.Role);
            return role != null && role.Equals("Admin", StringComparison.OrdinalIgnoreCase);
        }

        public static bool IsStaff(this ClaimsPrincipal principal)
        {
            var role = principal?.FindFirstValue(ClaimTypes.Role);
            return role != null && role.Equals("StaffStation", StringComparison.OrdinalIgnoreCase);
        }
    }
}

