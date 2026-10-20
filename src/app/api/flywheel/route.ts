import { NextRequest, NextResponse } from "next/server";
import { getDb, parseLead, serializeJson } from "@/lib/db";
import { scoreLead, writeOutreach, researchLead } from "@/agents/flywheel-agent";
import type { Lead } from "@/types";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { lead_id, step } = body;

  if (!lead_id || !step) {
    return NextResponse.json({ error: "lead_id and step required" }, { status: 400 });
  }

  const db = getDb();
  const row = db.prepare("SELECT * FROM leads WHERE id = ?").get(lead_id);
  if (!row) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const lead = parseLead(row) as Lead;

  switch (step) {
    case "enrich": {
      if (!lead.linkedin_url) {
        return NextResponse.json({ error: "No LinkedIn URL to enrich" }, { status: 400 });
      }
      const { research, talking_points } = await researchLead(
        lead.linkedin_url,
        lead.full_name ?? "",
        lead.current_company ?? ""
      );
      db.prepare(`
        UPDATE leads
        SET research = ?, talking_points = ?, stage = 'enriched',
            last_enriched_at = datetime('now'), updated_at = datetime('now')
        WHERE id = ?
      `).run(research, serializeJson(talking_points), lead_id);
      const updated = parseLead(db.prepare("SELECT * FROM leads WHERE id = ?").get(lead_id));
      return NextResponse.json({ lead: updated });
    }

    case "score": {
      const score = await scoreLead(lead);
      db.prepare(`
        UPDATE leads SET fit_score = ?, stage = 'scored', updated_at = datetime('now') WHERE id = ?
      `).run(score, lead_id);
      const updated = parseLead(db.prepare("SELECT * FROM leads WHERE id = ?").get(lead_id));
      return NextResponse.json({ lead: updated, score });
    }

    case "write_outreach": {
      const channel = lead.outreach_channel ?? "email";
      const msg = await writeOutreach(lead, channel === "both" ? "email" : channel);
      const msgId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO outreach_messages (id, lead_id, channel, subject, body, status)
        VALUES (?, ?, ?, ?, ?, 'draft')
      `).run(msgId, lead_id, channel, msg.subject ?? null, msg.body);
      const inserted = db.prepare("SELECT * FROM outreach_messages WHERE id = ?").get(msgId);
      return NextResponse.json({ message: inserted });
    }

    default:
      return NextResponse.json({ error: `Unknown step: ${step}` }, { status: 400 });
  }
}

export async function GET() {
  const db = getDb();
  const rows = db.prepare("SELECT stage FROM leads").all() as { stage: string }[];

  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.stage] = (counts[row.stage] ?? 0) + 1;
  }

  const stages = ["new", "enriched", "scored", "outreach_sent", "replied", "call_booked", "won"];
  const funnel = stages.map((s) => ({ stage: s, count: counts[s] ?? 0 }));

  return NextResponse.json({ funnel, total: rows.length });
}
