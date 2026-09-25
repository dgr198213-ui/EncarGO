import { supabaseAdmin } from "../supabase";
import { ejecutarPasoContenido } from "./conectores/contenido";
import { ejecutarPasoAutomatizacion } from "./conectores/zapier";
import type { TipoEncargo } from "@shared/types";

// Contrato único de entrada del Router (ver diseño de Fase 2): cualquier tipo
// de encargo confirmado llega aquí con la misma forma, y es este módulo quien
// decide a qué conector enrutar cada paso — así añadir un tipo nuevo no toca
// nada de lo que ya funciona.
async function ejecutarPaso(
  tipo: TipoEncargo,
  descripcionPaso: string,
  parametrosExtraidos: Record<string, unknown>,
): Promise<{ ok: boolean; contenido?: string; proveedor?: string; error?: string }> {
  switch (tipo) {
    case "contenido":
      return ejecutarPasoContenido(descripcionPaso, parametrosExtraidos);
    case "automatizacion":
      return ejecutarPasoAutomatizacion(descripcionPaso, parametrosExtraidos);
    case "diseno":
    case "administrativo":
      // Fase 5 (sin construir todavía): estos dos tipos se validan primero
      // con contenido + automatización antes de ampliar el Router.
      return { ok: false, error: `Conector de "${tipo}" no implementado todavía (Fase 5).` };
  }
}

// Ejecuta todos los pasos de un encargo ya confirmado y deja el encargo en
// "completado" si todos los pasos salieron bien, o "fallido" si alguno falló.
// No lanza excepción hacia arriba: cualquier fallo queda registrado en el
// propio encargo/pasos, nunca deja el registro en un estado ambiguo.
export async function ejecutarEncargo(encargoId: string, usuarioId: string): Promise<void> {
  const { data: encargo, error: errEncargo } = await supabaseAdmin
    .from("encargos")
    .select("*")
    .eq("id", encargoId)
    .eq("usuario_id", usuarioId)
    .single();

  if (errEncargo || !encargo) throw new Error("Encargo no encontrado para ejecutar.");

  const { data: pasos, error: errPasos } = await supabaseAdmin
    .from("pasos_ejecucion")
    .select("*")
    .eq("encargo_id", encargoId)
    .order("orden", { ascending: true });

  if (errPasos) throw new Error(errPasos.message);

  await supabaseAdmin.from("encargos").update({ estado: "ejecutando" }).eq("id", encargoId);

  let todosOk = true;
  for (const paso of pasos ?? []) {
    const resultado = await ejecutarPaso(encargo.tipo, paso.descripcion, encargo.parametros_extraidos ?? {});
    if (!resultado.ok) todosOk = false;

    await supabaseAdmin
      .from("pasos_ejecucion")
      .update({ resultado })
      .eq("id", paso.id);
  }

  await supabaseAdmin
    .from("encargos")
    .update({ estado: todosOk ? "completado" : "fallido" })
    .eq("id", encargoId);
}
