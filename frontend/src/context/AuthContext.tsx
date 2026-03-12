import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { setAuthToken, setupApiAuth } from "../lib/api";
import * as authApi from "../lib/auth";
import type { AuthUser } from "../lib/auth";

const STORAGE_TOKEN = "kenbon_access_token";
const STORAGE_REFRESH = "kenbon_refresh_token";
const STORAGE_USER = "kenbon_user";

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
};

type AuthContextValue = AuthState & {
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  register: (
    email: string,
    username: string,
    password: string,
  ) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
};

export type { AuthContextValue };

const AuthContext = createContext<AuthContextValue | null>(null);

export { AuthContext };

function loadStored(): {
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
} {
  try {
    const token = localStorage.getItem(STORAGE_TOKEN);
    const refreshToken = localStorage.getItem(STORAGE_REFRESH);
    const userJson = localStorage.getItem(STORAGE_USER);
    const user = userJson ? (JSON.parse(userJson) as AuthUser) : null;
    return { token, refreshToken, user };
  } catch {
    return { token: null, refreshToken: null, user: null };
  }
}

function saveStored(
  token: string | null,
  refreshToken: string | null,
  user: AuthUser | null,
) {
  if (token) localStorage.setItem(STORAGE_TOKEN, token);
  else localStorage.removeItem(STORAGE_TOKEN);
  if (refreshToken) localStorage.setItem(STORAGE_REFRESH, refreshToken);
  else localStorage.removeItem(STORAGE_REFRESH);
  if (user) localStorage.setItem(STORAGE_USER, JSON.stringify(user));
  else localStorage.removeItem(STORAGE_USER);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
  });
  const refreshTokenRef = useRef<string | null>(null);

  const logout = useCallback(() => {
    setAuthToken(null);
    refreshTokenRef.current = null;
    saveStored(null, null, null);
    setState((s) => ({ ...s, user: null, token: null }));
  }, []);

  const tryRefresh = useCallback(async (): Promise<boolean> => {
    const stored =
      refreshTokenRef.current ?? localStorage.getItem(STORAGE_REFRESH);
    if (!stored) return false;
    try {
      const res = await authApi.refresh(stored);
      const rt = res.refreshToken ?? res.accessToken;
      setAuthToken(res.accessToken);
      refreshTokenRef.current = rt;
      saveStored(res.accessToken, rt, res.user);
      setState({
        token: res.accessToken,
        user: res.user,
        isLoading: false,
      });
      return true;
    } catch {
      logout();
      return false;
    }
  }, [logout]);

  useEffect(() => {
    setupApiAuth(logout, tryRefresh);
  }, [logout, tryRefresh]);

  useEffect(() => {
    const { token, refreshToken, user } = loadStored();
    if (token) {
      setTimeout(() => {
        setState({ token, user, isLoading: false });
      }, 0);
      setAuthToken(token);
      refreshTokenRef.current = refreshToken;
    } else {
      setTimeout(() => {
        setState((s) => ({ ...s, isLoading: false }));
      }, 0);
    }
  }, []);

  const login = useCallback(
    async (usernameOrEmail: string, password: string) => {
      const res = await authApi.login({
        usernameOrEmail,
        password,
      });
      const rt = res.refreshToken ?? res.accessToken;
      setAuthToken(res.accessToken);
      refreshTokenRef.current = rt;
      saveStored(res.accessToken, rt, res.user);
      setState({ token: res.accessToken, user: res.user, isLoading: false });
    },
    [],
  );

  const register = useCallback(
    async (email: string, username: string, password: string) => {
      const res = await authApi.register({
        email,
        username,
        password,
      });
      const rt = res.refreshToken ?? res.accessToken;
      setAuthToken(res.accessToken);
      refreshTokenRef.current = rt;
      saveStored(res.accessToken, rt, res.user);
      setState({ token: res.accessToken, user: res.user, isLoading: false });
    },
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      register,
      logout,
      isAuthenticated: !!state.token,
    }),
    [state, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
