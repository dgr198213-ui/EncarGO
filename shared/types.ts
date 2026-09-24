export type TipoEncargo = "contenido" | "automatizacion" | "diseno" | "administrativo";

export type EstadoEncargo =
  | "borrador"
  | "pendiente_confirmacion"
  | "confirmado"
  | "ejecutando"
  | "completado"
  | "rechazado";

export type CanalEntrada = "chat" | "formulario" | "mixto";

export interface PasoEjecucion {
  id: string;
  orden: number;
  descripcion: string;
  herramientaDestino: string;
  editable: boolean;
  aprobado: boolean;
  resultado?: unknown;
}

export interface Encargo {
  id: string;
  usuarioId: string;
  tipo: TipoEncargo;
  canalEntrada: CanalEntrada;
  inputBruto?: string;
  camposFormulario?: Record<string, unknown>;
  parametrosExtraidos: Record<string, unknown>;
  confianzaClasificacion?: number;
  estado: EstadoEncargo;
  resumenLegible?: string;
  requiereConfirmacionExplicita: boolean;
  pasos: PasoEjecucion[];
  creadoEn: string;
  confirmadoEn?: string;
}

// Payload que crea el cliente al describir una necesidad (aún sin clasificar).
export interface NuevoEncargoInput {
  canalEntrada: CanalEntrada;
  inputBruto?: string;
  camposFormulario?: Record<string, unknown>;
}

// Lo que el Intake entrega al Router una vez confirmado (Fase 2, aún no implementado).
export interface EncargoConfirmado {
  encargoId: string;
  tipo: TipoEncargo;
  pasos: PasoEjecucion[];
  contexto: Record<string, unknown>;
}
