import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    "Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en las variables de entorno. " +
      "Copia .env.example a .env y rellénalas desde el panel de Supabase (Project Settings > API).",
  );
}

// Cliente de servidor: usa la service role key, que salta RLS.
// Por eso cada ruta debe filtrar explícitamente por el usuario autenticado
// (ver server/auth.ts) en vez de confiar en las policies de Postgres aquí.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
