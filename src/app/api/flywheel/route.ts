import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { scoreLead, writeOutreach, researchLead } from "@/agents/flywheel-agent";
import type { Lead } from "@/types";

// POST /api/flywheel — run the flywheel for a single lead
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { lead_id, step } = body;

  if (!lead_id || !step) {
    return NextResponse.json({ error: "lead_id and step required" }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data: lead, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", lead_id)
    .single();

  if (error || !lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const typedLead = lead as Lead;

  switch (step) {
    case "enrich": {
      if (!typedLead.linkedin_url) {
        return NextResponse.json({ error: "No LinkedIn URL to enrich" }, { status: 400 });
      }
      const { research, talking_points } = await researchLead(
        typedLead.linkedin_url,
        typedLead.full_name ?? "",
        typedLead.current_company ?? ""
      );
      const { data: updated } = await supabase
        .from("leads")
        .update({ research, talking_points, stage: "enriched", last_enriched_at: new Date().toISOString() })
        .eq("id", lead_id)
        .select()
        .single();
      return NextResponse.json({ lead: updated });
    }

    case "score": {
      const score = await scoreLead(typedLead);
      const { data: updated } = await supabase
        .from("leads")
        .update({ fit_score: score, stage: "scored" })
        .eq("id", lead_id)
        .select()
        .single();
      return NextResponse.json({ lead: updated, score });
    }

    case "write_outreach": {
      const channel = typedLead.outreach_channel ?? "email";
      const msg = await writeOutreach(typedLead, channel === "both" ? "email" : channel);
      const { data: inserted } = await supabase
        .from("outreach_messages")
        .insert({
          lead_id,
          channel,
          subject: msg.subject,
          body: msg.body,
          status: "draft",
        })
        .select()
        .single();
      return NextResponse.json({ message: inserted });
    }

    default:
      return NextResponse.json({ error: `Unknown step: ${step}` }, { status: 400 });
  }
}

// GET /api/flywheel/stats — funnel metrics
export async function GET() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("leads")
    .select("stage");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.stage] = (counts[row.stage] ?? 0) + 1;
  }

  const stages = ["new", "enriched", "scored", "outreach_sent", "replied", "call_booked", "won"];
  const funnel = stages.map((s) => ({ stage: s, count: counts[s] ?? 0 }));

  return NextResponse.json({ funnel, total: (data ?? []).length });
}
