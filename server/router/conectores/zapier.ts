interface ResultadoConector {
  ok: boolean;
  contenido?: string;
  error?: string;
}

// Zapier no tiene una API pública para crear Zaps sobre la marcha en el plan
// gratuito — el patrón real es un webhook "Catch Hook" ya configurado en
// Zapier, al que se le manda el payload y es el propio Zap quien decide qué
// hacer según los campos. Por eso aquí solo se dispara el webhook: la lógica
// de "qué automatización es cuál" vive en el Zap, no en este conector.
export async function ejecutarPasoAutomatizacion(
  descripcionPaso: string,
  parametrosExtraidos: Record<string, unknown>,
): Promise<ResultadoConector> {
  const webhookUrl = process.env.ZAPIER_WEBHOOK_URL;
  if (!webhookUrl) {
    return { ok: false, error: "ZAPIER_WEBHOOK_URL no configurada — automatización no disparada." };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ descripcion: descripcionPaso, parametros: parametrosExtraidos }),
    });

    if (!res.ok) {
      return { ok: false, error: `Zapier respondió ${res.status}: ${await res.text()}` };
    }
    return { ok: true, contenido: "Automatización disparada correctamente en Zapier." };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
