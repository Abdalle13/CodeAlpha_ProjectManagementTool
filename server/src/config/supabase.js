import "./env.js";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "";

const supabaseKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase URL or secret key not configured.");
}

export const supabase = createClient(supabaseUrl || "https://placeholder.supabase.co", supabaseKey || "placeholder", {
  auth: { persistSession: false },
});

export async function connectDatabase() {
  if (!supabaseUrl || !supabaseKey) {
    return { connected: false, reason: "SUPABASE_URL or SUPABASE_SECRET_KEY is not set" };
  }
  const { error } = await supabase.from("users").select("id").limit(1);
  if (error) {
    return { connected: false, reason: error.message };
  }
  return { connected: true };
}

export function getDatabaseStatus() {
  return supabaseUrl && supabaseKey ? "connected" : "disconnected";
}
