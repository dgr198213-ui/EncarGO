import { generarTexto } from "../../intake/providers";

interface ResultadoConector {
  ok: boolean;
  proveedor?: "gemini" | "zai";
  contenido?: string;
  error?: string;
}

// Genera el texto final para un paso de tipo "contenido", usando el resumen
// del paso y los parámetros extraídos (formato, tono, tema...) como brief.
export async function ejecutarPasoContenido(
  descripcionPaso: string,
  parametrosExtraidos: Record<string, unknown>,
): Promise<ResultadoConector> {
  const prompt = `Eres el redactor de Encargo, escribiendo para un autónomo creativo.
Tarea: ${descripcionPaso}
Parámetros del encargo: ${JSON.stringify(parametrosExtraidos)}

Escribe el contenido final, listo para usar. Sin explicaciones previas, sin comillas
envolviendo el texto, sin markdown salvo que el formato lo pida explícitamente.`;

  try {
    const { texto, proveedor } = await generarTexto(prompt);
    return { ok: true, proveedor, contenido: texto };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
