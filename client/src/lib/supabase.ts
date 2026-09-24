import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Cópialas desde el panel de Supabase (Project Settings > API) a tu .env.",
  );
}

// Cliente de navegador: usa la anon key, que respeta RLS — nunca la service role key aquí.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
