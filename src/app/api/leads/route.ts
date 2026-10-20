import { NextRequest, NextResponse } from "next/server";
import { getDb, parseLead, serializeJson, newId } from "@/lib/db";
import { z } from "zod";

const CreateLeadSchema = z.object({
  linkedin_url: z.string().url(),
  icp_id: z.string().optional(),
  source_url: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const stage = searchParams.get("stage");
  const icp_id = searchParams.get("icp_id");
  const limit = Number(searchParams.get("limit") ?? "100");

  const db = getDb();
  let sql = "SELECT * FROM leads";
  const conditions: string[] = [];
  const params: any[] = [];

  if (stage) { conditions.push("stage = ?"); params.push(stage); }
  if (icp_id) { conditions.push("icp_id = ?"); params.push(icp_id); }
  if (conditions.length) sql += " WHERE " + conditions.join(" AND ");
  sql += " ORDER BY created_at DESC LIMIT ?";
  params.push(limit);

  const rows = db.prepare(sql).all(...params);
  return NextResponse.json({ leads: rows.map(parseLead) });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = CreateLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const db = getDb();
  const id = newId();
  db.prepare(`
    INSERT INTO leads (id, linkedin_url, icp_id, source_url, stage, signals)
    VALUES (?, ?, ?, ?, 'new', '[]')
  `).run(id, parsed.data.linkedin_url, parsed.data.icp_id ?? null, parsed.data.source_url ?? null);

  const lead = parseLead(db.prepare("SELECT * FROM leads WHERE id = ?").get(id));
  return NextResponse.json({ lead }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const db = getDb();
  const fields = Object.keys(updates)
    .map((k) => `${k} = ?`)
    .join(", ");
  const values = Object.values(updates).map((v) =>
    typeof v === "object" ? serializeJson(v) : v
  );

  db.prepare(`UPDATE leads SET ${fields}, updated_at = datetime('now') WHERE id = ?`)
    .run(...values, id);

  const lead = parseLead(db.prepare("SELECT * FROM leads WHERE id = ?").get(id));
  return NextResponse.json({ lead });
}
