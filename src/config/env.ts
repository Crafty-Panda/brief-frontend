// Helper to get API base URL
function getApiBaseUrl(): string {
  if (import.meta.env.ENVIRONMENT === 'production') {
    return 'https://brief-backend-v8w9.onrender.com';
  }
  if (import.meta.env.ENVIRONMENT === 'development') {
    return 'http://localhost:3000';
  }
  
  return 'https://brief-backend-v8w9.onrender.com';
}

export const API_BASE_URL: string = getApiBaseUrl();

export const FRONTEND_ORIGIN: string =
  // e.g. VITE_FRONTEND_ORIGIN="http://localhost:8080"
  import.meta.env.VITE_FRONTEND_ORIGIN || window.location.origin
  // import.meta.env.VITE_FRONTEND_ORIGIN || (typeof window !== 'undefined' ? window.location.origin : '')



