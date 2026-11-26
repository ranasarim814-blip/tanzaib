/**
 * Creates (or promotes) the first admin.
 *   pnpm create-admin                       → invites ADMIN_EMAIL (they set a password from the email)
 *   pnpm create-admin --password 'S3cret!'  → creates the user with this password directly
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";

for (const f of [".env.local", ".env"]) {
  if (!existsSync(f)) continue;
  for (const line of readFileSync(f, "utf8").split("\n")) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = (process.argv.find((a) => a.startsWith("--email="))?.split("=")[1] ?? process.env.ADMIN_EMAIL ?? "").toLowerCase();
const pwIndex = process.argv.indexOf("--password");
const password = pwIndex > -1 ? process.argv[pwIndex + 1] : undefined;

if (!url || !key) {
  console.error("✗ Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.");
  process.exit(1);
}
if (!email) {
  console.error("✗ Set ADMIN_EMAIL in .env.local (or pass --email=you@example.com).");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  let userId: string | undefined;
  const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  userId = list?.users.find((u) => u.email?.toLowerCase() === email)?.id;

  if (!userId) {
    if (password) {
      const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
      if (error) throw error;
      userId = data.user.id;
      console.log(`✓ Created user ${email}`);
    } else {
      const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, { redirectTo: `${site}/admin/login` });
      if (error) throw error;
      userId = data.user.id;
      console.log(`✓ Invitation sent to ${email}. Open the email to set a password.`);
    }
  } else {
    console.log(`• User ${email} already exists`);
    if (password) {
      await supabase.auth.admin.updateUserById(userId, { password });
      console.log("✓ Password updated");
    }
  }

  const { error } = await supabase.from("admins").upsert({ user_id: userId, email }, { onConflict: "user_id" });
  if (error) throw error;
  console.log(`✓ ${email} is an admin. Sign in at /admin/login`);
}

main().catch((e) => {
  console.error("✗", e.message ?? e);
  process.exit(1);
});
