import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { authApi } from "../api/auth";

export const AuthContext = createContext(null);

const TOKEN_KEY = "access_token";
const REFRESH_KEY = "refresh_token";
const USER_KEY = "user";

function persistTokens(access, refresh, user) {
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

/** Decode a JWT payload without verifying the signature. */
function decodeJwtPayload(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

/** Returns true if the stored access token is present and not yet expired. */
function isTokenAlive() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return false;
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;
  return payload.exp * 1000 > Date.now() + 10_000; // 10-second leeway
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  // Validate the stored session once on mount; silently clear it if it's dead.
  const validated = useRef(false);
  useEffect(() => {
    if (validated.current) return;
    validated.current = true;

    async function validateSession() {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (!storedToken) {
        setSessionChecked(true);
        return;
      }

      // If the access token is still alive, fetch fresh user data
      if (isTokenAlive()) {
        try {
          const { data } = await authApi.me();
          setUser(data);
          localStorage.setItem(USER_KEY, JSON.stringify(data));
        } catch {
          clearTokens();
          setToken(null);
          setUser(null);
        }
      } else {
        // Access token expired — try a silent refresh
        const refresh = localStorage.getItem(REFRESH_KEY);
        if (!refresh) {
          clearTokens();
          setToken(null);
          setUser(null);
          setSessionChecked(true);
          return;
        }
        try {
          const { data: refreshData } = await authApi.refreshToken(refresh);
          localStorage.setItem(TOKEN_KEY, refreshData.access);
          if (refreshData.refresh) {
            localStorage.setItem(REFRESH_KEY, refreshData.refresh);
          }
          setToken(refreshData.access);

          const { data: meData } = await authApi.me();
          setUser(meData);
          localStorage.setItem(USER_KEY, JSON.stringify(meData));
        } catch {
          clearTokens();
          setToken(null);
          setUser(null);
        }
      }
      setSessionChecked(true);
    }

    validateSession();
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const { data } = await authApi.login({ email, password });
      persistTokens(data.access, data.refresh, data.user);
      setToken(data.access);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        "Login failed. Please check your credentials.";
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (formData) => {
    setLoading(true);
    try {
      const { data } = await authApi.register(formData);
      persistTokens(data.access, data.refresh, data.user);
      setToken(data.access);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      const errors = err.response?.data || {};
      return { success: false, errors };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    const refresh = localStorage.getItem(REFRESH_KEY);
    try {
      if (refresh) await authApi.logout(refresh);
    } catch {
      // Blacklist failure is non-fatal; clear local state regardless
    } finally {
      clearTokens();
      setToken(null);
      setUser(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const { data } = await authApi.me();
      setUser(data);
      localStorage.setItem(USER_KEY, JSON.stringify(data));
    } catch {
      // silent — axiosInstance will handle expired tokens via its interceptor
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      sessionChecked,
      isAuthenticated: !!token,
      isOrganizer: user?.role === "organizer",
      isParticipant: user?.role === "participant",
      login,
      register,
      logout,
      refreshProfile,
    }),
    [user, token, loading, sessionChecked, login, register, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
