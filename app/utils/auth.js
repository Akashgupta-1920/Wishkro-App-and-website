// src/lib/api.js
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

/** ---------- Base URL ---------- */
export const API_BASE =
  Constants?.expoConfig?.extra?.API_BASE ??
  Constants?.manifest2?.extra?.API_BASE ??
  Constants?.manifest?.extra?.API_BASE ??
  "https://api.wishkro.com";

/** ---------- Helpers ---------- */
export const buildAuthHeader = (t) =>
  t ? `Bearer ${String(t).replace(/^Bearer\s+/i, "").trim()}` : "";

// Optional: screens can import this to check for auth errors.
export const isAuthError = (err) => {
  const s = err?.response?.status;
  return s === 401 || s === 403 || s === 419;
};

/** ---------- Axios Instance ---------- */
const api = axios.create({
  baseURL: API_BASE,
  timeout: 20000, // mobile networks may be slow
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

/** ---------- Token handling ---------- */
let tokenCache = null;
let onUnauthorized = null; // optional callback set by AuthContext

export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = typeof fn === "function" ? fn : null;
};

// Attach/remove default header + cache
export const attachAuth = (token) => {
  tokenCache = token || null;
  if (tokenCache) {
    api.defaults.headers.common.Authorization = buildAuthHeader(tokenCache);
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

// Hydrate token from storage at app boot
export const loadTokenIntoAxios = async () => {
  const saved = await AsyncStorage.getItem("authToken");
  attachAuth(saved);
  return saved || null;
};

/** ---------- Interceptors ---------- */
// Ensure Authorization header exists even if a caller forgets.
// Also handle FormData by letting Axios set boundary.
api.interceptors.request.use(
  async (config) => {
    // Inject token if we have one and caller didn't override
    if (tokenCache && !config.headers?.Authorization) {
      config.headers = config.headers || {};
      config.headers.Authorization = buildAuthHeader(tokenCache);
    }

    // If sending FormData, let Axios set proper multipart boundary
    const isFormData =
      typeof FormData !== "undefined" && config.data instanceof FormData;
    if (isFormData && config.headers?.["Content-Type"]) {
      // Important: remove to avoid wrong boundary
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Centralized error handling & auth plumbing
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error?.response?.status;

    // Network-ish errors -> friendly message
    if (
      error?.code === "ECONNABORTED" ||
      error?.message === "Network Error" ||
      error?.code === "ERR_NETWORK"
    ) {
      error.userMessage = "Network issue. Please check your connection.";
    } else if (status >= 500) {
      error.userMessage = "Server error. Please try again later.";
    } else if (status === 404) {
      error.userMessage = "Not found.";
    }

    // Auth-related statuses: let AuthContext decide (logout, etc.)
    if ((status === 401 || status === 403 || status === 419) && onUnauthorized) {
      try {
        await onUnauthorized(); // should clear token + state
      } catch {
        // swallow
      }
    }

    return Promise.reject(error);
  }
);

export default api;
