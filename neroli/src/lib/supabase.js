import { createClient } from "@supabase/supabase-js";

// Configure the shared Supabase client from the app environment.

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Fail early when the deployment is missing the credentials needed for data access.
if (!url || !key) {
  throw new Error("Missing Supabase environment variables");
}

// Persist login state and refresh tokens through the shared client.
const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: true,
    persistSession: true,
  },
});

export default supabase;
