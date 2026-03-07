import crypto from "node:crypto";

const toBase64Url = (buf) =>
  buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const portalSecret = toBase64Url(crypto.randomBytes(48)); // 64 chars-ish, good entropy
const cronSecret = toBase64Url(crypto.randomBytes(32));

console.log("\nGenerated secrets (store these in your hosting/Supabase dashboard; do NOT commit):\n");
console.log(`CLIENT_PORTAL_HMAC_SECRET=${portalSecret}`);
console.log(`CRON_SECRET=${cronSecret}`);
console.log("");

