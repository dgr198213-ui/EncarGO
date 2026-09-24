// Capa de proveedores del Analista de Intake.
// Mismo criterio que en Creative AI Engine: Gemini como default, Z.ai (GLM)
// como fallback gratuito. Sin SDKs — fetch directo para no añadir dependencias
// pesadas a un servidor que solo necesita "texto entra, JSON sale".

interface ProviderResult {
  texto: string;
  proveedor: "gemini" | "zai";
}

async function llamarGemini(prompt: string): Promise<ProviderResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY no configurada");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
      }),
    },
  );

  if (!res.ok) throw new Error(`Gemini respondió ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!texto) throw new Error("Gemini no devolvió contenido utilizable");
  return { texto, proveedor: "gemini" };
}

async function llamarZai(prompt: string): Promise<ProviderResult> {
  const apiKey = process.env.ZAI_API_KEY;
  if (!apiKey) throw new Error("ZAI_API_KEY no configurada");

  // API compatible con el formato OpenAI chat completions.
  const res = await fetch("https://api.z.ai/api/paas/v4/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "glm-4.6",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) throw new Error(`Z.ai respondió ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const texto = data?.choices?.[0]?.message?.content;
  if (!texto) throw new Error("Z.ai no devolvió contenido utilizable");
  return { texto, proveedor: "zai" };
}

// Intenta Gemini y cae a Z.ai si falla por cualquier motivo (cuota, timeout,
// clave ausente). Si ambos fallan, propaga el último error.
export async function completarJSON(prompt: string): Promise<ProviderResult> {
  try {
    return await llamarGemini(prompt);
  } catch (errorGemini) {
    try {
      return await llamarZai(prompt);
    } catch (errorZai) {
      throw new Error(
        `Ambos proveedores fallaron. Gemini: ${(errorGemini as Error).message} · Z.ai: ${(errorZai as Error).message}`,
      );
    }
  }
}
