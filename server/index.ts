import express from "express";
import { createServer } from "http";
import { encargosRouter } from "./routes/encargos";
import { intakeRouter } from "./routes/intake";

// A partir de la separación Vercel (frontend) / Railway (backend), este
// servidor es una API pura — ya no sirve el build de Vite. Vercel no soporta
// un proceso persistente con app.listen(), así que intentar servir estáticos
// desde aquí es justo lo que hacía que la web devolviera el bundle como texto
// plano en vez de ejecutarlo.

const ORIGENES_PERMITIDOS = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

function corsMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const origin = req.headers.origin;
  // En desarrollo (sin CORS_ORIGIN configurada) se permite cualquier origen
  // para no bloquear localhost en distintos puertos.
  const permitido = ORIGENES_PERMITIDOS.length === 0 || (origin && ORIGENES_PERMITIDOS.includes(origin));

  if (origin && permitido) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");

  if (req.method === "OPTIONS") {
    res.sendStatus(permitido ? 204 : 403);
    return;
  }
  next();
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(corsMiddleware);
  app.use(express.json());

  // API routes
  app.use("/api/encargos", encargosRouter);
  app.use("/api/intake", intakeRouter);

  // Health check — útil para Railway y para comprobar que el servicio está
  // vivo sin depender de ninguna ruta autenticada.
  app.get("/", (_req, res) => {
    res.json({ ok: true, servicio: "encargo-api" });
  });

  const port = process.env.PORT || 3001;

  server.listen(port, () => {
    console.log(`API escuchando en http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
