// API base URL - uses Vite's built-in production detection
export const API_BASE_URL: string = import.meta.env.PROD
  ? 'https://brief-backend-v8w9.onrender.com'
  : 'http://localhost:3000';

export const FRONTEND_ORIGIN: string =
  import.meta.env.VITE_FRONTEND_ORIGIN || window.location.origin;



