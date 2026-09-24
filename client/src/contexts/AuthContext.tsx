import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthState {
  session: Session | null;
  loading: boolean;
  enviarEnlaceMagico: (email: string) => Promise<{ error: string | null }>;
  cerrarSesion: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nuevaSesion) => {
      setSession(nuevaSesion);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  async function enviarEnlaceMagico(email: string) {
    const { error } = await supabase.auth.signInWithOtp({ email });
    return { error: error?.message ?? null };
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ session, loading, enviarEnlaceMagico, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
