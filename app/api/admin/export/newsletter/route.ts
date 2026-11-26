import { getAdmin } from "@/lib/admin/auth";
import { db } from "@/lib/data";
import { toCsv } from "@/lib/utils";

export async function GET() {
  if (!(await getAdmin())) return new Response("Not authorised", { status: 403 });
  const rows = await db().select("newsletter_subscribers", { order: [{ column: "created_at", ascending: false }] });
  return new Response("﻿" + toCsv(["Email", "Subscribed at"], rows.map((r) => [r.email, r.created_at])), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tanzaib-subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
