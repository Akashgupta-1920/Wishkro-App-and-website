// context/AuthContext.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import base64 from "react-native-base64";
import api, {
  API_BASE,
  attachAuth,
  loadTokenIntoAxios,
  setUnauthorizedHandler,
} from "../app/utils/auth";

const PROFILE_URL = "/api/user/fetch"; // relative to API_BASE
const AuthCtx = createContext(null);

const parseJwtPayload = (token) => {
  if (!token || token.split(".").length !== 3) return null;
  try {
    const payload = token.split(".")[1];
    const decodedPayload = base64.decode(payload);
    return JSON.parse(decodedPayload);
  } catch (e) {
    if (__DEV__) console.warn("JWT parsing failed:", e?.message || e);
    return null;
  }
};

const readJwtExp = (token) => {
  const payload = parseJwtPayload(token);
  return payload?.exp ? payload.exp * 1000 : null;
};

const isTokenExpired = (token, skewMs = 30_000) => {
  const expMs = readJwtExp(token);
  if (!expMs) return false;
  return Date.now() + skewMs >= expMs;
};

const getTokenRemainingTime = (token) => {
  const expMs = readJwtExp(token);
  if (!expMs) return Infinity;
  return expMs - Date.now();
};

/** ---------- Provider ---------- */
export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);

  // prevent multiple concurrent unauthorized handlers
  const handlingUnauthorizedRef = useRef(false);

  // Ensure axios knows how to handle 401 (logout via this context)
  useEffect(() => {
    setUnauthorizedHandler(async () => {
      if (handlingUnauthorizedRef.current) return;
      handlingUnauthorizedRef.current = true;
      try {
        await logout();
      } finally {
        handlingUnauthorizedRef.current = false;
      }
    });
  }, []); // eslint-disable-line

  // Load token + user from storage and hydrate axios
  useEffect(() => {
    (async () => {
      try {
        await loadTokenIntoAxios();

        const [t, u, lrt] = await Promise.all([
          AsyncStorage.getItem("authToken"),
          AsyncStorage.getItem("authUser"),
          AsyncStorage.getItem("lastRefreshTime"),
        ]);

        if (t && !isTokenExpired(t)) {
          setToken(t);
          attachAuth(t);
        } else if (t && isTokenExpired(t)) {
          // token exists but expired -> clear
          await AsyncStorage.removeItem("authToken");
        }

        if (u) {
          try {
            setUser(JSON.parse(u));
          } catch {
            await AsyncStorage.removeItem("authUser");
          }
        }

        if (lrt) setLastRefreshTime(parseInt(lrt, 10));
      } catch (e) {
        console.error("AuthContext load error:", e);
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  /** ---------- Public actions ---------- */
  const login = useCallback(async ({ token: newToken, user: newUser }) => {
    // Save local state
    setToken(newToken || null);
    setUser(newUser || null);
    attachAuth(newToken || null);

    // Persist
    const now = Date.now();
    setLastRefreshTime(now);

    await Promise.all([
      newToken
        ? AsyncStorage.setItem("authToken", newToken)
        : AsyncStorage.removeItem("authToken"),
      newUser
        ? AsyncStorage.setItem("authUser", JSON.stringify(newUser))
        : AsyncStorage.removeItem("authUser"),
      AsyncStorage.setItem("lastRefreshTime", String(now)),
    ]);
  }, []);

  const logout = useCallback(async () => {
    try {
      // try server logout, ignore errors
      await api.post("/api/logout").catch(() => {});
    } catch {}

    setToken(null);
    setUser(null);
    setLastRefreshTime(null);
    attachAuth(null);

    await Promise.all([
      AsyncStorage.removeItem("authToken"),
      AsyncStorage.removeItem("authUser"),
      AsyncStorage.removeItem("lastRefreshTime"),
    ]);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!token) return false;

    // If token clearly expired, logout proactively
    if (isTokenExpired(token)) {
      await logout();
      return false;
    }

    try {
      setLoading(true);
      const { data } = await api.get(PROFILE_URL);
      const nextUser = data?.user ?? data?.data ?? null;

      if (nextUser) {
        setUser(nextUser);
        await AsyncStorage.setItem("authUser", JSON.stringify(nextUser));
        setLastRefreshTime(Date.now());
        await AsyncStorage.setItem("lastRefreshTime", String(Date.now()));
        return true;
      }
      return false;
    } catch (e) {
      if (e?.response?.status === 401) {
        await logout();
      } else if (__DEV__) {
        console.warn("refreshProfile failed:", e?.message || e);
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [token, logout]);

  // On first hydration, auto-refresh
  useEffect(() => {
    if (hydrated && token) refreshProfile();
  }, [hydrated, token, refreshProfile]);

  /** ---------- Exposed API ---------- */
  const value = useMemo(
    () => ({
      token,
      user,
      hydrated,
      loading,
      login,
      logout,
      refreshProfile,
      isTokenExpired: () => isTokenExpired(token),
      getTokenRemainingTime: () => getTokenRemainingTime(token),
      API_BASE,
    }),
    [token, user, hydrated, loading, login, logout, refreshProfile]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
