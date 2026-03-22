import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";

export const createClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a dummy client or handle gracefully during build/prerender
    // Most @supabase/ssr functions will just return errors if these are empty
    // but createBrowserClient itself requires them to be non-empty strings
    // to avoid throwing immediately.
    return createBrowserClient(
      supabaseUrl || "https://placeholder.supabase.co", 
      supabaseAnonKey || "placeholder"
    );
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
};
