import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { readStorage, writeStorage } from "../utils/storage";

const AUTH_KEY = "greenshield.auth";
const DEMO_USER = {
  name: "GreenShield Admin",
  email: "admin@example.com",
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storedUser = readStorage(AUTH_KEY, null);
    return storedUser ? { ...DEMO_USER, email: storedUser.email || DEMO_USER.email } : null;
  });

  useEffect(() => {
    if (user) {
      writeStorage(AUTH_KEY, user);
    } else {
      window.localStorage.removeItem(AUTH_KEY);
    }
  }, [user]);

  function login(email, password) {
    if (email.trim().toLowerCase() === "admin@example.com" && password === "admin123") {
      setUser(DEMO_USER);
      return { ok: true };
    }

    return {
      ok: false,
      message: "Demo email or password is incorrect.",
    };
  }

  function logout() {
    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      logout,
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
