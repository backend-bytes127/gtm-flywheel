import { NextRequest, NextResponse } from "next/server";
import { getDb, newId } from "@/lib/db";

// Receives Slack events + button interactions
export async function POST(req: NextRequest) {
  const body = await req.json();

  // Slack URL verification challenge
  if (body.type === "url_verification") {
    return NextResponse.json({ challenge: body.challenge });
  }

  const db = getDb();

  // Button action from SDR (replied / call_booked / lost)
  if (body.type === "block_actions") {
    const action = body.actions?.[0];
    const lead_id = action?.value;
    const action_id = action?.action_id;

    if (lead_id && action_id) {
      const stageMap: Record<string, string> = {
        mark_replied: "replied",
        mark_call_booked: "call_booked",
        mark_won: "won",
        mark_lost: "lost",
        mark_nurture: "nurture",
      };
      const newStage = stageMap[action_id];
      if (newStage) {
        db.prepare(`UPDATE leads SET stage = ?, updated_at = ? WHERE id = ?`)
          .run(newStage, new Date().toISOString(), lead_id);
      }
    }

    return NextResponse.json({ ok: true });
  }

  // Message event — /prospect <linkedin_url>
  const event = body.event;
  if (event?.type === "message" && event.text?.startsWith("/prospect ")) {
    const url = event.text.replace("/prospect ", "").trim();
    if (url.includes("linkedin.com")) {
      db.prepare(`
        INSERT INTO leads (id, linkedin_url, stage, signals, created_at, updated_at)
        VALUES (?, ?, 'new', '[]', ?, ?)
      `).run(newId(), url, new Date().toISOString(), new Date().toISOString());
    }
  }

  return NextResponse.json({ ok: true });
}
