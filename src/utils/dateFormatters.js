// Centralized date formatting utilities
// Consolidated from TaskTable, TaskList, DeveloperStagePage, SystemsList, CompanyTableSection, AdminDashboard/helpers

/**
 * Format date to DD/MM/YY
 * Used in: TaskTable, SystemsList, CompanyTableSection, demo
 */
export const formatDate = (dateString) => {
  if (!dateString) return "";

  // Handle "N/A" case from CompanyTableSection
  if (dateString === "N/A") return "N/A";

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Return original if invalid date

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);

    return `${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
};

/**
 * Format date to DD/MM/YYYY HH:MM
 * Used in: TaskList, DeveloperStagePage
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return "";

  // If already in correct format, return as-is
  if (
    typeof dateString === "string" &&
    dateString.match(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/)
  ) {
    return dateString;
  }

  // If it's a Date object or ISO string
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString; // Return original if invalid date

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

/**
 * Format date to DD/MM/YY with multiple input format support
 * Used in: TaskList, AdminDashboard/helpers
 */
export const formatDateToDDMMYY = (dateString) => {
  if (!dateString) return "";

  try {
    // Handle various date formats
    let date;

    // If it's already in dd/mm/yyyy or dd/mm/yy format, parse it
    if (typeof dateString === "string" && dateString.includes("/")) {
      const parts = dateString.split("/");
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1; // JavaScript months are 0-indexed
        let year = parseInt(parts[2]);

        // Handle 2-digit years
        if (year < 100) {
          year += year < 50 ? 2000 : 1900;
        }

        date = new Date(year, month, day);
      }
    } else if (dateString instanceof Date) {
      date = dateString;
    } else {
      // Try parsing as ISO date or other formats
      date = new Date(dateString);
    }

    // Check if date is valid
    if (!date || isNaN(date.getTime())) {
      return dateString; // Return original if can't parse
    }

    // Format to dd/mm/yy
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear().toString().slice(-2);

    return `${day}/${month}/${year}`;
  } catch (error) {
    return dateString; // Return original if error
  }
};

/**
 * Safely parse any date value (ISO string, datetime-local, DD/MM/YYYY, DD-MM-YYYY, Date object)
 * to an ISO string without throwing RangeError: Invalid time value.
 * Returns fallback (default null) if parsing fails.
 */
export const safeToISO = (val, fallback = null) => {
  if (!val) return fallback;
  if (val instanceof Date) {
    return !isNaN(val.getTime()) ? val.toISOString() : fallback;
  }

  let str = String(val).trim();
  if (!str) return fallback;

  // 1. Check for DD/MM/YYYY or DD-MM-YYYY (with optional time like 17:37 or 17:37:00)
  // e.g. "20/11/2026", "20/11/2026, 17:37", "20-11-2026 17:37"
  const dmyMatch = str.match(
    /^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})(?:[,\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if (dmyMatch) {
    let [, day, month, year, hh = "18", mm = "00", ss = "00"] = dmyMatch;
    if (year.length === 2) {
      year = (parseInt(year, 10) < 50 ? 2000 : 1900) + parseInt(year, 10);
    }
    const isoDateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
    const d = new Date(isoDateStr);
    if (!isNaN(d.getTime())) return d.toISOString();
  }

  // 2. Prevent malformed multiple 'T' concatenation like "2026-11-20T17:37T18:00:00"
  if (str.includes("T")) {
    const parts = str.split("T");
    if (parts.length > 2) {
      str = parts[0] + "T" + parts[1];
    }
  }

  // 3. Date-only YYYY-MM-DD -> add default time if missing
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    str += "T18:00:00";
  }

  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return d.toISOString();
  }

  return fallback;
};

export const addDays = (dateVal, days) => {
  if (!dateVal) return null;
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return null;
  return clampToOfficeHours(new Date(d.getTime() + days * 24 * 60 * 60 * 1000));
};

export const addHours = (dateVal, hours) => {
  if (!dateVal) return null;
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return null;
  d.setTime(d.getTime() + hours * 60 * 60 * 1000);
  return d;
};

const OFFICE_START = 10;
const OFFICE_END = 18;

const clampToOfficeHours = (d) => {
  if (!d || isNaN(d.getTime())) return d;
  const h = d.getHours();
  if (h < OFFICE_START) {
    d.setHours(OFFICE_START, 0, 0, 0);
  } else if (h >= OFFICE_END) {
    d.setDate(d.getDate() + 1);
    d.setHours(OFFICE_START, 0, 0, 0);
  }
  return d;
};

export const addWorkingHours = (dateVal, hours) => {
  if (!dateVal) return null;
  let d = new Date(dateVal);
  if (isNaN(d.getTime())) return null;
  if (d.getHours() < OFFICE_START) {
    d.setHours(OFFICE_START, 0, 0, 0);
  } else if (d.getHours() >= OFFICE_END) {
    d.setDate(d.getDate() + 1);
    d.setHours(OFFICE_START, 0, 0, 0);
  }
  let remaining = hours * 60;
  while (remaining > 0) {
    const currentMins = d.getHours() * 60 + d.getMinutes();
    const endMins = OFFICE_END * 60;
    const availableToday = endMins - currentMins;
    if (remaining <= availableToday) {
      d = new Date(d.getTime() + remaining * 60 * 1000);
      remaining = 0;
    } else {
      remaining -= availableToday;
      d.setDate(d.getDate() + 1);
      d.setHours(OFFICE_START, 0, 0, 0);
    }
  }
  return d;
};

export const calcDelay = (plannedDate, actualDate) => {
  if (!plannedDate) return null;
  const planned = new Date(plannedDate);
  if (isNaN(planned.getTime())) return null;
  const compare = actualDate ? new Date(actualDate) : new Date();
  if (isNaN(compare.getTime())) return null;
  const diffMs = compare.getTime() - planned.getTime();
  if (diffMs <= 0) return { text: "On Time", overdue: false };
  const totalMins = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMins / 1440);
  const hours = Math.floor((totalMins % 1440) / 60);
  const mins = totalMins % 60;
  let text = "";
  if (days > 0) text += `${days}d `;
  if (hours > 0 || days > 0) text += `${hours}h `;
  text += `${mins}m`;
  return { text: text.trim(), overdue: true };
};

