import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// Receives Slack events + button interactions from n8n webhook relay
export async function POST(req: NextRequest) {
  const body = await req.json();

  // Slack URL verification challenge
  if (body.type === "url_verification") {
    return NextResponse.json({ challenge: body.challenge });
  }

  // Button action from SDR (replied / call booked / lost)
  if (body.type === "block_actions") {
    const action = body.actions?.[0];
    const lead_id = action?.value;
    const action_id = action?.action_id;

    if (!lead_id || !action_id) {
      return NextResponse.json({ ok: true });
    }

    const stageMap: Record<string, string> = {
      mark_replied: "replied",
      mark_call_booked: "call_booked",
      mark_won: "won",
      mark_lost: "lost",
      mark_nurture: "nurture",
    };

    const newStage = stageMap[action_id];
    if (newStage) {
      const supabase = getSupabase();
      await supabase
        .from("leads")
        .update({ stage: newStage, updated_at: new Date().toISOString() })
        .eq("id", lead_id);
    }

    return NextResponse.json({ ok: true });
  }

  // Message event — /prospect <linkedin_url>
  const event = body.event;
  if (event?.type === "message" && event.text?.startsWith("/prospect ")) {
    const url = event.text.replace("/prospect ", "").trim();
    if (!url.includes("linkedin.com")) {
      return NextResponse.json({ ok: true });
    }

    const supabase = getSupabase();
    await supabase.from("leads").insert({
      linkedin_url: url,
      stage: "new",
      signals: [],
      source_url: "slack",
    });
  }

  return NextResponse.json({ ok: true });
}
