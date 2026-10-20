import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

import type { Lead, Signal } from "@/types";

const model = anthropic("claude-sonnet-4-5");

export async function scoreLead(lead: Lead): Promise<number> {
  const { text } = await generateText({
    model,
    system: `You are a GTM scoring engine. Score leads 0-100 based on fit signals.
Output ONLY a JSON object: {"score": <number>, "reason": "<one sentence>"}`,
    prompt: `Lead: ${lead.full_name} | ${lead.current_title} at ${lead.current_company}
Location: ${lead.location}
Signals: ${(lead.signals ?? []).map((s: Signal) => s.detail).join("; ") || "none"}
Research: ${lead.research?.slice(0, 300) ?? "none"}`,
    maxOutputTokens: 100,
  });

  try {
    const parsed = JSON.parse(text.trim());
    return Math.min(100, Math.max(0, Number(parsed.score) || 0));
  } catch {
    return 0;
  }
}

export async function writeOutreach(lead: Lead, channel: "email" | "linkedin"): Promise<{ subject: string | null; body: string }> {
  const { text } = await generateText({
    model,
    system: `You are a senior SDR writing highly personalized outreach.
- Be specific, reference their actual work/signals
- Keep LinkedIn messages under 300 chars
- Emails: subject + 3 short paragraphs max
- No fluff, no "I hope this finds you well"
- Output JSON: {"subject": <string|null>, "body": <string>}`,
    prompt: `Channel: ${channel}
Name: ${lead.full_name}
Title: ${lead.current_title} at ${lead.current_company}
Signals: ${(lead.signals ?? []).map((s: Signal) => s.detail).join("; ") || "none"}
Talking points: ${(lead.talking_points ?? []).join(" | ") || "none"}
Research: ${lead.research?.slice(0, 400) ?? "none"}`,
    maxOutputTokens: 600,
  });

  try {
    return JSON.parse(text.trim());
  } catch {
    return { subject: null, body: text.trim() };
  }
}

export async function analyzeReply(replyText: string): Promise<{
  sentiment: "positive" | "neutral" | "negative";
  next_action: "book_call" | "send_followup" | "mark_lost" | "nurture";
  suggested_response: string;
}> {
  const { text } = await generateText({
    model,
    system: `Analyze an SDR reply and decide next action.
Output JSON: {"sentiment": "positive|neutral|negative", "next_action": "book_call|send_followup|mark_lost|nurture", "suggested_response": "<short response draft>"}`,
    prompt: `Reply: ${replyText}`,
    maxOutputTokens: 300,
  });

  try {
    return JSON.parse(text.trim());
  } catch {
    return { sentiment: "neutral", next_action: "send_followup", suggested_response: "" };
  }
}

export async function researchLead(linkedinUrl: string, name: string, company: string): Promise<{
  research: string;
  talking_points: string[];
}> {
  const { text } = await generateText({
    model,
    system: `You are a GTM researcher. Given a LinkedIn profile and company, write:
1. A concise research summary (2-3 sentences on what they do, their focus, recent activity)
2. 3 sharp talking points for outreach
Output JSON: {"research": "<summary>", "talking_points": ["<point1>", "<point2>", "<point3>"]}`,
    prompt: `Person: ${name}
Company: ${company}
LinkedIn: ${linkedinUrl}`,
    maxOutputTokens: 500,
  });

  try {
    return JSON.parse(text.trim());
  } catch {
    return { research: text.trim(), talking_points: [] };
  }
}
