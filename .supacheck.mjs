import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const raw = fs.readFileSync(path.resolve(".env"), "utf8");
const env = {};
for (const line of raw.split(/\r?\n/)) {
  if (!line || line.trim().startsWith("#")) continue;
  const idx = line.indexOf("=");
  if (idx < 0) continue;
  const key = line.slice(0, idx).trim();
  let value = line.slice(idx + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  env[key] = value;
}

const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_SERVICE_ROLE_KEY;
console.log("url=" + Boolean(url));
console.log("hasKey=" + Boolean(key));
if (!url || !key) {
  console.error("missing config");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { data, error } = await supabase.from("profiles").select("id,email").limit(1);
console.log("data=" + JSON.stringify(data));
console.log("error=" + JSON.stringify(error));
