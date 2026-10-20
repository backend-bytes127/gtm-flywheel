import { NextRequest, NextResponse } from "next/server";
import { getDb, parseLead, serializeJson } from "@/lib/db";
import { scoreLead, writeOutreach, researchLead } from "@/agents/flywheel-agent";
import {
  addLeadToHeyReachCampaign,
  addLeadToInstantlyCampaign,
  upsertHubSpotContact,
  postSlackLeadCard,
} from "@/lib/integrations";
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
      const enriched = parseLead(db.prepare("SELECT * FROM leads WHERE id = ?").get(lead_id)) as Lead;

      // Notify Slack that lead is enriched and ready for review
      postSlackLeadCard({
        id: enriched.id,
        full_name: enriched.full_name ?? "Unknown",
        current_title: enriched.current_title,
        current_company: enriched.current_company,
        fit_score: enriched.fit_score,
        stage: enriched.stage,
        linkedin_url: enriched.linkedin_url ?? "",
        research: enriched.research,
      }).catch(() => null);

      return NextResponse.json({ lead: enriched });
    }

    case "score": {
      const score = await scoreLead(lead);
      db.prepare(`
        UPDATE leads SET fit_score = ?, stage = 'scored', updated_at = datetime('now') WHERE id = ?
      `).run(score, lead_id);
      const scored = parseLead(db.prepare("SELECT * FROM leads WHERE id = ?").get(lead_id)) as Lead;

      // Sync to HubSpot when scored
      upsertHubSpotContact({
        full_name: scored.full_name ?? "Unknown",
        email: scored.email,
        current_title: scored.current_title,
        current_company: scored.current_company,
        location: scored.location,
        linkedin_url: scored.linkedin_url ?? "",
        fit_score: scored.fit_score,
        stage: scored.stage,
      }).catch(() => null);

      return NextResponse.json({ lead: scored, score });
    }

    case "write_outreach": {
      const channel = lead.outreach_channel ?? "email";
      const effectiveChannel = channel === "both" ? "email" : channel;
      const msg = await writeOutreach(lead, effectiveChannel);
      const msgId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO outreach_messages (id, lead_id, channel, subject, body, status)
        VALUES (?, ?, ?, ?, ?, 'draft')
      `).run(msgId, lead_id, effectiveChannel, msg.subject ?? null, msg.body);

      // Enroll in outreach sequences
      if (effectiveChannel === "linkedin" || channel === "both") {
        addLeadToHeyReachCampaign({
          linkedin_url: lead.linkedin_url ?? "",
          full_name: lead.full_name ?? "Unknown",
          current_title: lead.current_title,
          current_company: lead.current_company,
          email: lead.email,
        }).catch(() => null);
      }
      if ((effectiveChannel === "email" || channel === "both") && lead.email) {
        addLeadToInstantlyCampaign({
          email: lead.email,
          full_name: lead.full_name ?? "Unknown",
          current_company: lead.current_company,
          current_title: lead.current_title,
        }).catch(() => null);
      }

      // Update HubSpot stage to outreach_sent
      upsertHubSpotContact({
        full_name: lead.full_name ?? "Unknown",
        email: lead.email,
        current_title: lead.current_title,
        current_company: lead.current_company,
        location: lead.location,
        linkedin_url: lead.linkedin_url ?? "",
        fit_score: lead.fit_score,
        stage: "outreach_sent",
      }).catch(() => null);

      db.prepare(`UPDATE leads SET stage = 'outreach_sent', updated_at = datetime('now') WHERE id = ?`).run(lead_id);

      const inserted = db.prepare("SELECT * FROM outreach_messages WHERE id = ?").get(msgId);
      const updatedLead = parseLead(db.prepare("SELECT * FROM leads WHERE id = ?").get(lead_id));
      return NextResponse.json({ message: inserted, lead: updatedLead });
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
