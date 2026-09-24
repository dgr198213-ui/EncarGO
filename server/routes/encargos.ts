import { Router } from "express";
import { z } from "zod";
import { supabaseAdmin } from "../supabase";
import { requireAuth } from "../auth";
import { mapFilaEncargo as mapFila } from "./encargos-mapper";

export const encargosRouter = Router();
encargosRouter.use(requireAuth);

const nuevoEncargoSchema = z.object({
  canalEntrada: z.enum(["chat", "formulario", "mixto"]),
  inputBruto: z.string().min(1).optional(),
  camposFormulario: z.record(z.string(), z.unknown()).optional(),
});

// GET /api/encargos — histórico del usuario autenticado
encargosRouter.get("/", async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("encargos")
    .select("*")
    .eq("usuario_id", req.usuarioId)
    .order("creado_en", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data.map((fila) => mapFila(fila)));
});

// POST /api/encargos — crea un encargo en borrador (aún sin clasificar; eso es Fase 2)
encargosRouter.post("/", async (req, res) => {
  const parsed = nuevoEncargoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { data, error } = await supabaseAdmin
    .from("encargos")
    .insert({
      usuario_id: req.usuarioId,
      // Borrador sin clasificar todavía — para clasificar y extraer parámetros
      // de verdad, el cliente debe llamar a POST /api/intake en su lugar.
      // Este endpoint queda para guardar un borrador mientras el usuario escribe.
      tipo: "contenido",
      canal_entrada: parsed.data.canalEntrada,
      input_bruto: parsed.data.inputBruto,
      campos_formulario: parsed.data.camposFormulario,
      estado: "borrador",
    })
    .select("*")
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(mapFila(data));
});

// GET /api/encargos/:id — detalle con pasos incluidos
encargosRouter.get("/:id", async (req, res) => {
  const [{ data: encargo, error: errEncargo }, { data: pasos, error: errPasos }] = await Promise.all([
    supabaseAdmin.from("encargos").select("*").eq("id", req.params.id).eq("usuario_id", req.usuarioId).single(),
    supabaseAdmin.from("pasos_ejecucion").select("*").eq("encargo_id", req.params.id),
  ]);

  if (errEncargo || !encargo) return res.status(404).json({ error: "Encargo no encontrado." });
  if (errPasos) return res.status(500).json({ error: errPasos.message });

  res.json(mapFila(encargo, pasos ?? []));
});

// PATCH /api/encargos/:id/confirmar — el usuario aprueba el espejo de confirmación
// (de momento solo cambia de estado; disparar la ejecución real es Fase 4 — Router multi-IA)
encargosRouter.patch("/:id/confirmar", async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("encargos")
    .update({ estado: "confirmado", confirmado_en: new Date().toISOString() })
    .eq("id", req.params.id)
    .eq("usuario_id", req.usuarioId)
    .select("*")
    .single();

  if (error || !data) return res.status(404).json({ error: "Encargo no encontrado." });
  res.json(mapFila(data));
});
