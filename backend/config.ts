// Centralized API base URL configuration
// Reads from environment variables (configured in vite.config.ts) with a sensible fallback.
export const API_BASE_URL: string =
  (process.env.API_BASE_URL as string) || 'http://127.0.0.1:8000';

