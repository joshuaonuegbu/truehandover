import { createClient } from "npm:@supabase/supabase-js";

const mustGetEnv = (key: string) => {
  const value = Deno.env.get(key);
  if (!value) throw new Error(`Missing environment variable: ${key}`);
  return value;
};

export const createUserClient = (req: Request) => {
  const supabaseUrl = mustGetEnv("SUPABASE_URL");
  const supabaseAnonKey = mustGetEnv("SUPABASE_ANON_KEY");
  const authorization = req.headers.get("Authorization") || "";

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authorization,
      },
    },
  });
};

export const createServiceClient = () => {
  const supabaseUrl = mustGetEnv("SUPABASE_URL");
  const serviceRoleKey = mustGetEnv("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(supabaseUrl, serviceRoleKey);
};

