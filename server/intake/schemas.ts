import { z } from "zod";

// Cada tipo de encargo necesita parámetros distintos — este es el motivo por
// el que parametros_extraidos es jsonb en vez de columnas fijas: la forma
// depende del tipo, y aquí es donde se valida esa forma antes de guardar.

export const parametrosContenidoSchema = z.object({
  formato: z.string().describe("p.ej. 'post redes', 'descripción de portfolio', 'email'"),
  tono: z.string().describe("p.ej. 'cercano y profesional', 'directo'"),
  longitudAprox: z.string().optional().describe("p.ej. '150 palabras', 'breve'"),
  tema: z.string(),
});

export const parametrosAutomatizacionSchema = z.object({
  trigger: z.string().describe("qué dispara la automatización"),
  condicion: z.string().optional(),
  accion: z.string().describe("qué debe ocurrir cuando se dispara"),
  herramientaSugerida: z.string().describe("p.ej. 'zapier', 'agent00'"),
});

export const parametrosDisenoSchema = z.object({
  tipoActivo: z.string().describe("p.ej. 'logo', 'post', 'flyer'"),
  estilo: z.string(),
  dimensiones: z.string().optional(),
  referencias: z.string().optional(),
});

export const parametrosAdministrativoSchema = z.object({
  accionAdministrativa: z.string().describe("p.ej. 'emitir factura', 'agendar cita', 'responder email'"),
  destinatario: z.string().optional(),
  plazo: z.string().optional(),
  datos: z.record(z.string(), z.string()).optional(),
});

export const pasoPropuestoSchema = z.object({
  descripcion: z.string(),
  herramientaDestino: z.string(),
});

// Salida completa que se espera del modelo tras clasificar y extraer.
export const intakeResultSchema = z.object({
  tipo: z.enum(["contenido", "automatizacion", "diseno", "administrativo"]),
  confianzaClasificacion: z.number().min(0).max(1),
  resumenLegible: z.string().describe("frase que el usuario revisará en el espejo de confirmación"),
  parametrosExtraidos: z.record(z.string(), z.unknown()),
  pasos: z.array(pasoPropuestoSchema).min(1),
});

export type IntakeResult = z.infer<typeof intakeResultSchema>;

export const schemaPorTipo = {
  contenido: parametrosContenidoSchema,
  automatizacion: parametrosAutomatizacionSchema,
  diseno: parametrosDisenoSchema,
  administrativo: parametrosAdministrativoSchema,
} as const;

// Valida parametrosExtraidos contra el schema de su propio tipo, una vez
// que ya sabemos qué tipo devolvió el clasificador.
export function validarParametrosPorTipo(tipo: IntakeResult["tipo"], parametros: unknown) {
  return schemaPorTipo[tipo].safeParse(parametros);
}
