"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { apiClient } from "@/lib/http/client";
import { ENDPOINTS } from "@/lib/constants/http/endpoints";
import type { User, AuthMeResponse } from "@/types/user";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  walletBalance: number;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (user: User, walletBalance: number, accessToken?: string) => void;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  revalidate: () => Promise<void>;
  setPendingAction: (action: (() => void) | null) => void;
  executePendingAction: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

let authOperationId = 0;

export default function AuthProvider({
  children,
  initialUser = null,
  initialWalletBalance = 0,
}: {
  children: React.ReactNode;
  initialUser?: User | null;
  initialWalletBalance?: number;
}) {
  const [state, setState] = useState<AuthState>({
    user: initialUser,
    accessToken: null,
    walletBalance: Number(initialWalletBalance ?? 0),
    isLoading: false,
    isAuthenticated: Boolean(initialUser),
  });

  const pendingActionRef = useRef<(() => void) | null>(null);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  });

  useEffect(() => {
    let cancelled = false;

    const revalidate = async () => {
      const opId = ++authOperationId;
      try {
        const data = await apiClient.get<AuthMeResponse>(ENDPOINTS.AUTH.ME);
        if (cancelled || opId !== authOperationId) return;
        setState({
          user: data.user,
          accessToken: stateRef.current.accessToken,
          walletBalance: Number(data.walletBalance),
          isLoading: false,
          isAuthenticated: true,
        });
      } catch {
        if (cancelled || opId !== authOperationId) return;
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    void revalidate();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback((user: User, walletBalance: number, accessToken?: string) => {
    authOperationId += 1;
    setState({
      user,
      accessToken: accessToken ?? null,
      walletBalance: Number(walletBalance),
      isLoading: false,
      isAuthenticated: true,
    });
    setTimeout(() => {
      const action = pendingActionRef.current;
      if (action) {
        pendingActionRef.current = null;
        action();
      }
    }, 100);
  }, []);

  const logout = useCallback(async () => {
    authOperationId += 1;
    try {
      await apiClient.post(ENDPOINTS.AUTH.LOGOUT);
    } catch {
      // Local logout still completes if the API is unavailable.
    }
    authOperationId += 1;
    setState({
      user: null,
      accessToken: null,
      walletBalance: 0,
      isLoading: false,
      isAuthenticated: false,
    });
    pendingActionRef.current = null;
  }, []);

  const hydrate = useCallback(async () => {
    const opId = ++authOperationId;
    try {
      setState((prev) => (prev.user ? prev : { ...prev, isLoading: true }));
      const data = await apiClient.get<AuthMeResponse>(ENDPOINTS.AUTH.ME);
      if (opId !== authOperationId) return;
      setState({
        user: data.user,
        accessToken: stateRef.current.accessToken,
        walletBalance: Number(data.walletBalance),
        isLoading: false,
        isAuthenticated: true,
      });
    } catch {
      if (opId !== authOperationId) return;
      setState({
        user: null,
        accessToken: null,
        walletBalance: 0,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  }, []);

  const revalidate = useCallback(async () => {
    const opId = ++authOperationId;
    try {
      const data = await apiClient.get<AuthMeResponse>(ENDPOINTS.AUTH.ME);
      if (opId !== authOperationId) return;
      setState({
        user: data.user,
        accessToken: stateRef.current.accessToken,
        walletBalance: Number(data.walletBalance),
        isLoading: false,
        isAuthenticated: true,
      });
    } catch {
      if (opId !== authOperationId) return;
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const setPendingAction = useCallback((action: (() => void) | null) => {
    pendingActionRef.current = action;
  }, []);

  const executePendingAction = useCallback(() => {
    const action = pendingActionRef.current;
    if (!action) return;
    setTimeout(() => {
      action();
    }, 100);
    pendingActionRef.current = null;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        hydrate,
        revalidate,
        setPendingAction,
        executePendingAction,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
