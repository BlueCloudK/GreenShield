import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { readStorage, writeStorage } from "../utils/storage";

const AUTH_KEY = "greenshield.auth";
const DEMO_USERS_KEY = "greenshield.demoUsers";

const AuthContext = createContext(null);

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storedUser = readStorage(AUTH_KEY, null);
    return storedUser?.email ? storedUser : null;
  });

  useEffect(() => {
    if (user) {
      writeStorage(AUTH_KEY, user);
    } else {
      window.localStorage.removeItem(AUTH_KEY);
    }
  }, [user]);

  function login(email, password) {
    const users = readStorage(DEMO_USERS_KEY, []);
    const nextEmail = normalizeEmail(email);
    const matchedUser = users.find((item) => item.email === nextEmail && item.password === password);

    if (matchedUser) {
      setUser({
        name: matchedUser.name,
        email: matchedUser.email,
        company: matchedUser.company || "",
      });
      return { ok: true };
    }

    return {
      ok: false,
      message: "Email hoặc mật khẩu demo chưa đúng.",
    };
  }

  function register(account) {
    const users = readStorage(DEMO_USERS_KEY, []);
    const nextEmail = normalizeEmail(account.email);
    const existingUser = users.find((item) => item.email === nextEmail);

    if (existingUser) {
      return {
        ok: false,
        message: "Email này đã được đăng ký trong demo. Hãy đăng nhập hoặc dùng email khác.",
      };
    }

    const nextUser = {
      name: account.name.trim(),
      email: nextEmail,
      company: account.company?.trim() || "",
      password: account.password,
      createdAt: new Date().toISOString(),
    };

    writeStorage(DEMO_USERS_KEY, [...users, nextUser]);
    setUser({
      name: nextUser.name,
      email: nextUser.email,
      company: nextUser.company,
    });

    return {
      ok: true,
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
      register,
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
