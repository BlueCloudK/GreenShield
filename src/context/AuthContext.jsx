import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, post } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api("/api/auth/me")
      .then((result) => active && setUser(result.user))
      .catch(() => active && setUser(null))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  async function login(email, password) {
    try {
      const result = await post("/api/auth/login", { email, password });
      setUser(result.user);
      return { ok: true };
    } catch (error) {
      return { ok: false, message: error.message };
    }
  }

  async function register(account) {
    try {
      const result = await post("/api/auth/register", account);
      return { ok: true, user: result.user };
    } catch (error) {
      return { ok: false, message: error.message };
    }
  }

  async function sendOtp(account) {
    try {
      const result = await post("/api/auth/send-otp", account);
      return { ok: true, email: result.email };
    } catch (error) {
      return { ok: false, message: error.message };
    }
  }

  async function verifyOtp(email, otp) {
    try {
      const result = await post("/api/auth/verify-otp", { email, otp });
      setUser(result.user);
      return { ok: true, user: result.user };
    } catch (error) {
      return { ok: false, message: error.message };
    }
  }

  async function logout() {
    try { await post("/api/auth/logout"); } finally { setUser(null); }
  }

  const value = useMemo(() => ({
    user,
    loading,
    isAuthenticated: Boolean(user),
    login,
    register,
    sendOtp,
    verifyOtp,
    logout,
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
