// Centralized API configuration
// Single source of truth for all API URLs

const GOOGLE_SHEETS_BASE_URL =
  "https://script.google.com/macros/s/AKfycbzG8CyTBV-lk2wQ0PKjhrGUnBKdRBY-tkFVz-6GzGcbXqdEGYF0pWyfCl0BvGfVhi0/exec";

export const API_CONFIG = {
  FETCH_URL: `${GOOGLE_SHEETS_BASE_URL}?sheet=FMS&action=fetch`,
  UPDATE_URL: GOOGLE_SHEETS_BASE_URL,
  MASTER_SHEET_URL: `${GOOGLE_SHEETS_BASE_URL}?sheet=Master%20Sheet%20Link&action=fetch`,
  MASTER_SHEET_LINK_URL: `${GOOGLE_SHEETS_BASE_URL}?sheet=Master Sheet Link&action=fetch`,
};

export const SHEET_URL = GOOGLE_SHEETS_BASE_URL;
export const GOOGLE_SHEETS_URL = GOOGLE_SHEETS_BASE_URL;

export const AI_API_URL = "https://ai-agent-ja64.onrender.com";

export default API_CONFIG;
