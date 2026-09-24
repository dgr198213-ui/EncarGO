import { Router } from "express";
import { z } from "zod";
import { supabaseAdmin } from "../supabase";
import { requireAuth } from "../auth";
import { analizarEncargo } from "../intake/analista";
import type { Encargo } from "@shared/types";
import { mapFilaEncargo } from "./encargos-mapper";

export const intakeRouter = Router();
intakeRouter.use(requireAuth);

const intakeInputSchema = z.object({
  canalEntrada: z.enum(["chat", "formulario", "mixto"]),
  inputBruto: z.string().min(1).optional(),
  camposFormulario: z.record(z.string(), z.unknown()).optional(),
});

// POST /api/intake — clasifica, extrae parámetros y crea el encargo ya listo
// para el espejo de confirmación (estado "pendiente_confirmacion").
intakeRouter.post("/", async (req, res) => {
  const parsed = intakeInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  let analisis: Awaited<ReturnType<typeof analizarEncargo>>;
  try {
    analisis = await analizarEncargo(parsed.data);
  } catch (err) {
    // Fallo del Intake (proveedores caídos, JSON inválido, etc.) no debe
    // dejar el encargo en un estado ambiguo — se informa y no se guarda nada.
    return res.status(502).json({ error: (err as Error).message });
  }

  const { data: encargoInsertado, error: errorInsert } = await supabaseAdmin
    .from("encargos")
    .insert({
      usuario_id: req.usuarioId,
      tipo: analisis.tipo,
      canal_entrada: parsed.data.canalEntrada,
      input_bruto: parsed.data.inputBruto,
      campos_formulario: parsed.data.camposFormulario,
      parametros_extraidos: analisis.parametrosExtraidos,
      confianza_clasificacion: analisis.confianzaClasificacion,
      resumen_legible: analisis.resumenLegible,
      requiere_confirmacion_explicita: analisis.requiereConfirmacionExplicita,
      estado: "pendiente_confirmacion",
    })
    .select("*")
    .single();

  if (errorInsert || !encargoInsertado) {
    return res.status(500).json({ error: errorInsert?.message ?? "No se pudo guardar el encargo." });
  }

  const pasosParaInsertar = analisis.pasos.map((paso, index) => ({
    encargo_id: encargoInsertado.id,
    orden: index,
    descripcion: paso.descripcion,
    herramienta_destino: paso.herramientaDestino,
    // Con un solo paso y bajo riesgo, se autoaprueba: el frontend puede
    // saltar directo a ejecución en vez de mostrar el checklist completo.
    aprobado: !analisis.requiereConfirmacionExplicita,
    editable: analisis.requiereConfirmacionExplicita,
  }));

  const { data: pasosInsertados, error: errorPasos } = await supabaseAdmin
    .from("pasos_ejecucion")
    .insert(pasosParaInsertar)
    .select("*");

  if (errorPasos) {
    return res.status(500).json({ error: errorPasos.message });
  }

  const encargo: Encargo = mapFilaEncargo(encargoInsertado, pasosInsertados ?? []);
  res.status(201).json(encargo);
});
