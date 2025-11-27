using System;

namespace APIRentEV.Helpers
{
    public static class DateTimeHelper
    {
        /// <summary>
        /// Lấy thời gian hiện tại theo múi giờ Việt Nam (GMT+7)
        /// </summary>
        public static DateTime GetVietnamTime()
        {
            var vietnamTimeZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
            return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, vietnamTimeZone);
        }

        /// <summary>
        /// Convert UTC DateTime sang múi giờ Việt Nam (GMT+7)
        /// </summary>
        public static DateTime ToVietnamTime(DateTime utcTime)
        {
            var vietnamTimeZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
            return TimeZoneInfo.ConvertTimeFromUtc(utcTime, vietnamTimeZone);
        }

        /// <summary>
        /// Convert DateTime Việt Nam sang UTC
        /// </summary>
        public static DateTime ToUtcTime(DateTime vietnamTime)
        {
            var vietnamTimeZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
            return TimeZoneInfo.ConvertTimeToUtc(vietnamTime, vietnamTimeZone);
        }
    }
}

