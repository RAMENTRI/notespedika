import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const browserFetch: typeof fetch = async (input, init) => {
  const requestUrl = typeof input === "string" || input instanceof URL ? input.toString() : input.url;

  if (typeof window === "undefined" || !supabaseUrl || !requestUrl.startsWith(supabaseUrl)) {
    return fetch(input, init);
  }

  return fetch(`/api/supabase-proxy?url=${encodeURIComponent(requestUrl)}`, init);
};

export const supabase = createClient(
  supabaseUrl || "https://example.supabase.co",
  supabaseAnonKey || "missing-anon-key",
  {
    global: {
      fetch: browserFetch,
    },
  }
);
