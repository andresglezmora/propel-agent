import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Mismo proyecto de Supabase que LandingPilot (PRD sección 8: el plan
// gratuito no permite otro proyecto). Propel vive aparte en el schema
// "propel" — nunca "public", que ya es de LandingPilot — y la service_role
// key nunca sale de aquí. Reusa SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY de
// LandingPilot; no hace falta una llave nueva.
// El genérico de SupabaseClient asume el schema "public" por default; como
// este cliente siempre habla con "propel", se tipa explícito con ese
// tercer parámetro en vez de dejar que TS infiera "public" y luego se
// queje de que no coinciden.
type PropelClient = SupabaseClient<any, any, "propel">;

let client: PropelClient | null = null;

export function db(): PropelClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local (las mismas de LandingPilot).",
    );
  }

  client = createClient(url, key, {
    db: { schema: "propel" },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

export const PROPOSALS_BUCKET = "propel-proposals";
