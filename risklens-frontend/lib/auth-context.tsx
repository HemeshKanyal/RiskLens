"use client";

// ==============================
// RiskLens — Auth Context Provider
// Manages authentication state across the app
// ==============================

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import type { User, RegisterPayload } from "./types";
import * as apiService from "./api";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Fetch current user on mount (if token exists)
  const refreshUser = useCallback(async () => {
    const token = apiService.getToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const userData = await apiService.fetchCurrentUser();
      setUser(userData);
    } catch {
      // Token invalid or expired
      apiService.removeToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    await apiService.login(email, password);
    const userData = await apiService.fetchCurrentUser();
    setUser(userData);
    router.push("/dashboard");
  };

  const register = async (payload: RegisterPayload) => {
    await apiService.register(payload);
    // After registration, redirect to login
    router.push("/login");
  };

  const logout = () => {
    apiService.removeToken();
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
