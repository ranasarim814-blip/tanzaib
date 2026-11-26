/**
 * Optional: uploads the dummy art in public/dummy to the Supabase "products" bucket and
 * points product_images / category covers at the uploaded copies. Run after seed.sql.
 * Not required — the seed references /dummy/... paths, which work as-is.
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

for (const f of [".env.local", ".env"]) {
  if (!existsSync(f)) continue;
  for (const line of readFileSync(f, "utf8").split("\n")) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("✗ Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.");
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });
const root = join(process.cwd(), "public");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : [join(dir, n)]));
}

async function main() {
  const files = walk(join(root, "dummy")).filter((f) => f.endsWith(".svg"));
  const map = new Map<string, string>();
  for (const f of files) {
    const local = "/" + relative(root, f).split("\\").join("/");
    const path = local.replace(/^\/dummy\//, "dummy/");
    const { error } = await supabase.storage.from("products").upload(path, readFileSync(f), { contentType: "image/svg+xml", upsert: true });
    if (error) throw error;
    map.set(local, supabase.storage.from("products").getPublicUrl(path).data.publicUrl);
  }
  console.log(`✓ Uploaded ${files.length} files`);
  const { data: images } = await supabase.from("product_images").select("id,url");
  for (const img of images ?? []) {
    const next = map.get(img.url);
    if (next) await supabase.from("product_images").update({ url: next }).eq("id", img.id);
  }
  const { data: cats } = await supabase.from("categories").select("id,cover_image");
  for (const c of cats ?? []) {
    const next = c.cover_image ? map.get(c.cover_image) : undefined;
    if (next) await supabase.from("categories").update({ cover_image: next }).eq("id", c.id);
  }
  console.log("✓ Product images now point to Supabase Storage");
}

main().catch((e) => {
  console.error("✗", e.message ?? e);
  process.exit(1);
});
