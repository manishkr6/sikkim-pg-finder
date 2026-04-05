import { createContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
  // sikkimPGApi = import.meta.env.VITE_API_URL;
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Restore session on load
  useEffect(() => {
    const stored = localStorage.getItem("sikkimpg_user");
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch (_) {
        localStorage.removeItem("sikkimpg_user");
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const { default: api } = await import("../utils/api");
    const { data } = await api.post("/auth/login", { email, password });
    return data;
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem("sikkimpg_user");
    localStorage.removeItem("sikkimpg_token");
    navigate("/");
  }, [navigate]);

  const signup = useCallback(async (name, email, password) => {
    const { default: api } = await import("../utils/api");
    const { data } = await api.post("/auth/signup", { name, email, password });
    return data;
  }, []);

  const verifyOtp = useCallback(async (email, otp, purpose) => {
    const { default: api } = await import("../utils/api");
    const { data } = await api.post("/auth/verify-otp", {
      email,
      otp,
      purpose,
    });
    if (data.token) localStorage.setItem("sikkimpg_token", data.token);
    setCurrentUser(data.user);
    localStorage.setItem("sikkimpg_user", JSON.stringify(data.user));
    return data.user;
  }, []);

  const resendOtp = useCallback(async (email, purpose) => {
    const { default: api } = await import("../utils/api");
    const { data } = await api.post("/auth/resend-otp", { email, purpose });
    return data;
  }, []);

  const forgotPassword = useCallback(async (email) => {
    const { default: api } = await import("../utils/api");
    const { data } = await api.post("/auth/forgot-password", { email });
    return data;
  }, []);

  const resetPassword = useCallback(async (tokenValue, password) => {
    const { default: api } = await import("../utils/api");
    const { data } = await api.put(`/auth/reset-password/${tokenValue}`, {
      password,
    });
    if (data.token) localStorage.setItem("sikkimpg_token", data.token);
    if (data.user) {
      setCurrentUser(data.user);
      localStorage.setItem("sikkimpg_user", JSON.stringify(data.user));
    }
    return data;
  }, []);

  const updateCurrentUser = useCallback((updates) => {
    setCurrentUser((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem("sikkimpg_user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isAuthenticated = !!currentUser;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        isAuthenticated,
        login,
        logout,
        signup,
        verifyOtp,
        resendOtp,
        forgotPassword,
        resetPassword,
        updateCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
