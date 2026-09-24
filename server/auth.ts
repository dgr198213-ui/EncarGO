import type { NextFunction, Request, Response } from "express";
import { supabaseAdmin } from "./supabase";

declare global {
  namespace Express {
    interface Request {
      usuarioId?: string;
    }
  }
}

// Espera "Authorization: Bearer <access_token>" emitido por Supabase Auth
// en el cliente (login con email/magic link). No usa cookies en la Fase 1.
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;

  if (!token) {
    return res.status(401).json({ error: "Falta el token de autenticación." });
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    return res.status(401).json({ error: "Token inválido o caducado." });
  }

  req.usuarioId = data.user.id;
  next();
}
