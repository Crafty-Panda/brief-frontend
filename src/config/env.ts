// Vite exposes env vars prefixed with VITE_ via import.meta.env

const fallbackApiBaseUrl = 'http://localhost:3000'

export const API_BASE_URL: string =
  // e.g. VITE_API_BASE_URL="http://localhost:3000"
  import.meta.env.VITE_API_BASE_URL || fallbackApiBaseUrl

export const FRONTEND_ORIGIN: string =
  // e.g. VITE_FRONTEND_ORIGIN="http://localhost:8080"
  import.meta.env.VITE_FRONTEND_ORIGIN || window.location.origin


