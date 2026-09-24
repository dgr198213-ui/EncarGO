import { completarJSON } from "./providers";
import { intakeResultSchema, validarParametrosPorTipo, type IntakeResult } from "./schemas";
import type { CanalEntrada, PasoEjecucion } from "@shared/types";

const PALABRAS_IRREVERSIBLES = [
  "enviar",
  "envía",
  "borrar",
  "eliminar",
  "pagar",
  "facturar",
  "factura",
  "publicar",
  "cobrar",
  "cancelar",
];

function contieneAccionIrreversible(pasos: { descripcion: string }[]): boolean {
  return pasos.some((paso) => PALABRAS_IRREVERSIBLES.some((palabra) => paso.descripcion.toLowerCase().includes(palabra)));
}

const PROMPT_SISTEMA = `Eres el Analista de Intake de Encargo, un producto para autónomos creativos sin jerga técnica.
Tu trabajo: leer lo que pide el usuario (puede venir como texto libre, campos de formulario, o ambos) y devolver
SOLO un JSON con esta forma exacta, sin texto adicional ni backticks:

{
  "tipo": "contenido" | "automatizacion" | "diseno" | "administrativo",
  "confianzaClasificacion": número entre 0 y 1,
  "resumenLegible": "frase corta, en el idioma del usuario, que describe qué se va a hacer",
  "parametrosExtraidos": { ... campos específicos del tipo, ver abajo ... },
  "pasos": [ { "descripcion": "...", "herramientaDestino": "..." }, ... al menos 1 ... ]
}

Campos de parametrosExtraidos según el tipo:
- contenido: formato, tono, longitudAprox (opcional), tema
- automatizacion: trigger, condicion (opcional), accion, herramientaSugerida
- diseno: tipoActivo, estilo, dimensiones (opcional), referencias (opcional)
- administrativo: accionAdministrativa, destinatario (opcional), plazo (opcional), datos (opcional, objeto)

Reglas:
- Si la petición es ambigua entre dos tipos, elige el más probable y baja confianzaClasificacion por debajo de 0.6.
- pasos debe reflejar el desglose real de ejecución, no un solo paso genérico si en realidad son varios.
- Nunca inventes datos que el usuario no dio — si falta un dato no opcional, indícalo dentro del propio texto del paso ("pedir al usuario: ...").`;

export interface AnalisisIntake {
  tipo: IntakeResult["tipo"];
  confianzaClasificacion: number;
  resumenLegible: string;
  parametrosExtraidos: Record<string, unknown>;
  pasos: Array<Pick<PasoEjecucion, "descripcion" | "herramientaDestino">>;
  requiereConfirmacionExplicita: boolean;
  proveedorUsado: "gemini" | "zai";
}

export async function analizarEncargo(input: {
  canalEntrada: CanalEntrada;
  inputBruto?: string;
  camposFormulario?: Record<string, unknown>;
}): Promise<AnalisisIntake> {
  const partesUsuario = [
    input.inputBruto ? `Texto libre del usuario: "${input.inputBruto}"` : null,
    input.camposFormulario ? `Campos de formulario: ${JSON.stringify(input.camposFormulario)}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  if (!partesUsuario) {
    throw new Error("El encargo no tiene ni texto libre ni campos de formulario que analizar.");
  }

  const prompt = `${PROMPT_SISTEMA}\n\n${partesUsuario}`;
  const { texto, proveedor } = await completarJSON(prompt);

  let bruto: unknown;
  try {
    bruto = JSON.parse(texto);
  } catch {
    throw new Error(`El proveedor (${proveedor}) devolvió JSON inválido: ${texto.slice(0, 200)}`);
  }

  const parsed = intakeResultSchema.safeParse(bruto);
  if (!parsed.success) {
    throw new Error(`Respuesta del Intake no cumple el schema esperado: ${parsed.error.message}`);
  }

  const parametrosValidados = validarParametrosPorTipo(parsed.data.tipo, parsed.data.parametrosExtraidos);
  if (!parametrosValidados.success) {
    throw new Error(
      `Parámetros de tipo "${parsed.data.tipo}" no válidos: ${parametrosValidados.error.message}`,
    );
  }

  // Regla de umbral (validada con los 3 escenarios de prueba): un encargo de
  // un solo paso sin acción irreversible no necesita el checklist completo.
  const requiereConfirmacionExplicita =
    parsed.data.pasos.length > 1 || contieneAccionIrreversible(parsed.data.pasos);

  return {
    tipo: parsed.data.tipo,
    confianzaClasificacion: parsed.data.confianzaClasificacion,
    resumenLegible: parsed.data.resumenLegible,
    parametrosExtraidos: parametrosValidados.data,
    pasos: parsed.data.pasos,
    requiereConfirmacionExplicita,
    proveedorUsado: proveedor,
  };
}
