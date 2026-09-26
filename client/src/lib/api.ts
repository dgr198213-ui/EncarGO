import { supabase } from "@/lib/supabase";
import type { Encargo, NuevoEncargoInput } from "@shared/types";

// En local, "/api" pasa por el proxy de Vite (ver vite.config.ts) hacia el
// servidor Express en el puerto 3001. En producción (Vercel), el frontend y
// el backend viven en dominios distintos, así que hace falta la URL completa
// de Railway — sin esto, las llamadas irían al propio dominio de Vercel,
// que ya no sirve la API (ver server/index.ts).
const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

async function fetchAutenticado(path: string, opciones: RequestInit = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("No hay sesión activa.");

  const res = await fetch(`${API_BASE}${path}`, {
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
  return fetchAutenticado("/encargos");
}

export async function crearIntake(input: NuevoEncargoInput): Promise<Encargo> {
  return fetchAutenticado("/intake", { method: "POST", body: JSON.stringify(input) });
}

export async function confirmarEncargo(id: string): Promise<Encargo> {
  return fetchAutenticado(`/encargos/${id}/confirmar`, { method: "PATCH" });
}
