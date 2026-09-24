import type { Encargo, PasoEjecucion } from "@shared/types";

export function mapFilaEncargo(fila: any, pasos: any[] = []): Encargo {
  return {
    id: fila.id,
    usuarioId: fila.usuario_id,
    tipo: fila.tipo,
    canalEntrada: fila.canal_entrada,
    inputBruto: fila.input_bruto ?? undefined,
    camposFormulario: fila.campos_formulario ?? undefined,
    parametrosExtraidos: fila.parametros_extraidos ?? {},
    confianzaClasificacion: fila.confianza_clasificacion ?? undefined,
    estado: fila.estado,
    resumenLegible: fila.resumen_legible ?? undefined,
    requiereConfirmacionExplicita: fila.requiere_confirmacion_explicita,
    pasos: pasos
      .slice()
      .sort((a, b) => a.orden - b.orden)
      .map(
        (p): PasoEjecucion => ({
          id: p.id,
          orden: p.orden,
          descripcion: p.descripcion,
          herramientaDestino: p.herramienta_destino,
          editable: p.editable,
          aprobado: p.aprobado,
          resultado: p.resultado ?? undefined,
        }),
      ),
    creadoEn: fila.creado_en,
    confirmadoEn: fila.confirmado_en ?? undefined,
  };
}
