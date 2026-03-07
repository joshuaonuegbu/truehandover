import fs from "node:fs";
import path from "node:path";

const readEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) return { exists: false, env: {} };
  const raw = fs.readFileSync(filePath, "utf8");
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return { exists: true, env };
};

const redact = (value) => {
  if (!value) return "";
  if (value.length <= 8) return "********";
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
};

const requireKeys = (env, keys, label) => {
  const missing = keys.filter((k) => !String(env[k] || "").trim());
  if (missing.length) {
    console.error(`\n[FAIL] Missing ${label}: ${missing.join(", ")}`);
    return false;
  }
  console.log(`\n[OK] ${label} present`);
  return true;
};

const warnForbiddenPublicSecrets = (env) => {
  const suspicious = Object.entries(env).filter(([k, v]) => {
    if (!k.startsWith("VITE_")) return false;
    const keyUpper = k.toUpperCase();
    if (keyUpper.includes("SECRET")) return true;
    if (keyUpper.includes("STRIPE") && keyUpper.includes("KEY") && !keyUpper.includes("PUBLISH")) return true;
    if (keyUpper.includes("R2_") && (keyUpper.includes("ACCESS") || keyUpper.includes("SECRET"))) return true;
    if (keyUpper.includes("SUPABASE") && keyUpper.includes("SERVICE")) return true;
    return false;
  });

  if (!suspicious.length) {
    console.log("\n[OK] No obvious public (VITE_) secrets detected");
    return true;
  }

  console.warn("\n[WARN] Possible secrets in VITE_ env vars (these end up in the browser bundle):");
  for (const [k, v] of suspicious) console.warn(`- ${k}=${redact(v)}`);
  return false;
};

const printR2CorsSuggestion = (allowedOrigins) => {
  const origins = allowedOrigins
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!origins.length) return;

  const cors = [
    {
      AllowedOrigins: origins,
      AllowedMethods: ["GET", "PUT", "HEAD"],
      AllowedHeaders: ["content-type"],
      ExposeHeaders: [],
      MaxAgeSeconds: 3000,
    },
  ];
  console.log("\nSuggested R2 bucket CORS JSON:");
  console.log(JSON.stringify(cors, null, 2));
};

const root = process.cwd();
const frontendEnvPath = path.join(root, ".env.local");
const functionsEnvPath = path.join(root, "supabase", ".env.local");

const frontend = readEnvFile(frontendEnvPath);
const functions = readEnvFile(functionsEnvPath);

console.log("TrueHandover production check\n");
console.log(`Frontend env: ${frontend.exists ? frontendEnvPath : "(missing)"} (copy from .env.example)`);
console.log(`Functions env: ${functions.exists ? functionsEnvPath : "(missing)"} (copy from supabase/.env.example)`);

let ok = true;

ok = requireKeys(frontend.env, ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"], "frontend env vars") && ok;
warnForbiddenPublicSecrets(frontend.env);

// Edge Functions
ok =
  requireKeys(
    functions.env,
    [
      "ALLOWED_ORIGINS",
      "APP_BASE_URL",
      "CLIENT_PORTAL_HMAC_SECRET",
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
      "RESEND_API_KEY",
      "NUDGE_FROM_EMAIL",
      "R2_ACCOUNT_ID",
      "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY",
      "R2_BUCKET_NAME",
    ],
    "Edge Function env vars"
  ) && ok;

// CORS coupling sanity check
if (String(functions.env.APP_BASE_URL || "").trim() && !String(functions.env.ALLOWED_ORIGINS || "").trim()) {
  console.error("\n[FAIL] APP_BASE_URL is set but ALLOWED_ORIGINS is empty. Browser calls will be blocked.");
  ok = false;
}

printR2CorsSuggestion(String(functions.env.ALLOWED_ORIGINS || "").trim());

console.log(ok ? "\nResult: OK" : "\nResult: NEEDS FIXES");
process.exit(ok ? 0 : 1);
