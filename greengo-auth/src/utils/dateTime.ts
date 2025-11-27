/**
 * Utility functions for handling date/time with Vietnam timezone (GMT+7)
 */

/**
 * Convert date string to Vietnam time (GMT+7)
 * @param dateString - Date string from backend (could be UTC with Z or already GMT+7 without timezone)
 * @returns Date object representing Vietnam time
 */
export const toVietnamTime = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null;
  
  // Check if string has timezone indicator (Z at end, or +HH:mm or -HH:mm)
  const hasTimezone = dateString.endsWith('Z') || 
                       /[+-]\d{2}:\d{2}$/.test(dateString) ||
                       /[+-]\d{4}$/.test(dateString);
  
  if (hasTimezone) {
    // Has timezone indicator (UTC) - parse and convert to GMT+7
    const utcDate = new Date(dateString);
    if (isNaN(utcDate.getTime())) return null;
    // Add 7 hours to convert UTC to GMT+7
    return new Date(utcDate.getTime() + 7 * 60 * 60 * 1000);
  } else {
    // No timezone indicator - assume it's already in GMT+7 (database format: YYYY-MM-DD HH:mm:ss)
    // Parse the string and treat the values as GMT+7
    // Format: "2025-11-27 02:00:00" or "2025-11-27T02:00:00"
    const normalized = dateString.replace(' ', 'T').replace(/\.\d+$/, ''); // Remove milliseconds if any
    const parts = normalized.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})/);
    
    if (parts) {
      const [, year, month, day, hour, minute, second] = parts;
      
      // Since input is GMT+7, create UTC date by subtracting 7 hours
      // This way, when we display it, we can add 7 hours back to show the correct GMT+7 time
      const utcDate = new Date(Date.UTC(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hour) - 7, // Subtract 7 because input is GMT+7
        parseInt(minute),
        parseInt(second || '0')
      ));
      
      if (isNaN(utcDate.getTime())) return null;
      
      // Return the UTC date - we'll handle the GMT+7 conversion in formatVietnamDate
      // Actually, we need to return a date that represents GMT+7, so add 7 hours back
      // But wait - if we add 7 hours back, we're back to the original problem
      // The solution: return the UTC date, and in formatVietnamDate, we'll format it correctly
      return utcDate;
    }
    
    // Fallback: parse as-is (will be treated as local time)
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return date;
  }
};

/**
 * Format date to Vietnamese locale string
 * @param dateInput - ISO date string from backend (UTC) or Date object
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string in Vietnam timezone
 */
export const formatVietnamDate = (
  dateInput: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string => {
  if (!dateInput) return "N/A";
  
  let date: Date | null;
  let hadTimezone = false;
  
  if (dateInput instanceof Date) {
    // If it's already a Date object, use it as-is
    date = dateInput;
  } else {
    // If it's a string, check if it has timezone
    hadTimezone = dateInput.endsWith('Z') || 
                  /[+-]\d{2}:\d{2}$/.test(dateInput) ||
                  /[+-]\d{4}$/.test(dateInput);
    
    if (hadTimezone) {
      // Has timezone (UTC) - parse and convert to GMT+7
      const utcDate = new Date(dateInput);
      if (isNaN(utcDate.getTime())) return "N/A";
      date = new Date(utcDate.getTime() + 7 * 60 * 60 * 1000);
    } else {
      // No timezone - assume it's already GMT+7 (database format: YYYY-MM-DD HH:mm:ss)
      // Parse the string and create UTC date by subtracting 7 hours
      // Then format with timeZone: "Asia/Ho_Chi_Minh" will show the correct GMT+7 time
      const normalized = dateInput.replace(' ', 'T').replace(/\.\d+$/, '');
      const parts = normalized.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})/);
      
      if (parts) {
        const [, year, month, day, hour, minute, second] = parts;
        // Create UTC date by subtracting 7 hours (since input is GMT+7)
        date = new Date(Date.UTC(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          parseInt(hour) - 7, // Subtract 7 to convert GMT+7 to UTC
          parseInt(minute),
          parseInt(second || '0')
        ));
      } else {
        date = new Date(dateInput);
      }
    }
  }
  
  if (!date || isNaN(date.getTime())) return "N/A";
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh", // Always format in Vietnam timezone
    ...options,
  };
  
  // Format using Vietnam timezone
  return date.toLocaleString("vi-VN", defaultOptions);
};

/**
 * Format date to date-only string (no time)
 */
export const formatVietnamDateOnly = (dateString: string | null | undefined): string => {
  if (!dateString) return "N/A";
  
  const hadTimezone = dateString.endsWith('Z') || 
                       /[+-]\d{2}:\d{2}$/.test(dateString) ||
                       /[+-]\d{4}$/.test(dateString);
  
  let date: Date | null = null;
  
  if (hadTimezone) {
    // Has timezone (UTC) - parse and convert to GMT+7
    const utcDate = new Date(dateString);
    if (!isNaN(utcDate.getTime())) {
      date = new Date(utcDate.getTime() + 7 * 60 * 60 * 1000);
    }
  } else {
    // No timezone - assume it's already GMT+7
    const normalized = dateString.replace(' ', 'T').replace(/\.\d+$/, '');
    const parts = normalized.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})/);
    
    if (parts) {
      const [, year, month, day, hour, minute, second] = parts;
      // Create UTC date by subtracting 7 hours (since input is GMT+7)
      date = new Date(Date.UTC(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hour) - 7,
        parseInt(minute),
        parseInt(second || '0')
      ));
    } else {
      date = new Date(dateString);
    }
  }
  
  if (!date || isNaN(date.getTime())) return "N/A";
  
  return date.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  });
};

/**
 * Get current Vietnam time
 */
export const getVietnamNow = (): Date => {
  const now = new Date();
  // Add 7 hours for GMT+7
  return new Date(now.getTime() + 7 * 60 * 60 * 1000);
};

/**
 * Convert Vietnam time to UTC ISO string for sending to backend
 */
export const toUtcISOString = (vietnamDate: Date): string => {
  // Subtract 7 hours to convert back to UTC
  const utcDate = new Date(vietnamDate.getTime() - 7 * 60 * 60 * 1000);
  return utcDate.toISOString();
};

