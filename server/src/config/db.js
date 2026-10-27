import { connectDatabase as connectSupabase, getDatabaseStatus as getSupabaseStatus } from "./supabase.js";

export async function connectDatabase() {
  return connectSupabase();
}

export function getDatabaseStatus() {
  return getSupabaseStatus();
}

export async function disconnectDatabase() {
  // Supabase client uses HTTP fetch, no open connection pool to disconnect
}
