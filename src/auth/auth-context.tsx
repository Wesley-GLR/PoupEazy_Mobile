import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { setUnauthorizedHandler } from '@/api/client';
import { authService } from '@/api/services';
import type { AuthUser, Profile } from '@/types/api';

import { clearSessionToken, getSessionToken, setSessionToken } from './token-storage';

type AuthContextValue = {
  user: AuthUser | null;
  profile: Profile | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: { email: string; password: string; nome: string; telefone?: string }) => Promise<void>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ message?: string; resetToken?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  updateProfile: (input: Partial<Pick<Profile, 'nome' | 'telefone'>>) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(async () => {
    await clearSessionToken();
    setUser(null);
    setProfile(null);
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => {
    setUnauthorizedHandler(clearSession);
    return () => setUnauthorizedHandler(undefined);
  }, [clearSession]);

  useEffect(() => {
    let active = true;
    async function restore() {
      try {
        if (!(await getSessionToken())) return;
        const session = await authService.me();
        if (!active) return;
        setUser(session.user);
        setProfile(session.profile);
      } catch {
        if (active) await clearSession();
      } finally {
        if (active) setLoading(false);
      }
    }
    void restore();
    return () => { active = false; };
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    profile,
    loading,
    isAuthenticated: Boolean(user),
    async signIn(email, password) {
      const session = await authService.login(email.trim().toLowerCase(), password);
      await setSessionToken(session.token);
      setUser(session.user);
      setProfile(session.profile);
    },
    async signUp(input) {
      await authService.register({ ...input, email: input.email.trim().toLowerCase() });
    },
    signOut: clearSession,
    forgotPassword: (email) => authService.forgotPassword(email.trim().toLowerCase()),
    resetPassword: (token, newPassword) => authService.resetPassword(token, newPassword),
    async updateProfile(input) {
      const updated = await authService.updateProfile(input);
      setProfile(updated);
    },
    updatePassword: (newPassword) => authService.updatePassword(newPassword),
  } as AuthContextValue), [clearSession, loading, profile, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  return value;
}
