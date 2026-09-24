import { supabase } from "@/lib/supabase";
import type { Encargo, NuevoEncargoInput } from "@shared/types";

async function fetchAutenticado(path: string, opciones: RequestInit = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("No hay sesión activa.");

  const res = await fetch(path, {
    ...opciones,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...opciones.headers,
    },
  });

  if (!res.ok) {
    const cuerpo = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(cuerpo.error ?? `Error ${res.status}`);
  }
  return res.json();
}

export async function listarEncargos(): Promise<Encargo[]> {
  return fetchAutenticado("/api/encargos");
}

export async function crearIntake(input: NuevoEncargoInput): Promise<Encargo> {
  return fetchAutenticado("/api/intake", { method: "POST", body: JSON.stringify(input) });
}

export async function confirmarEncargo(id: string): Promise<Encargo> {
  return fetchAutenticado(`/api/encargos/${id}/confirmar`, { method: "PATCH" });
}
