export type LeadStage =
  | "new"
  | "enriched"
  | "scored"
  | "outreach_sent"
  | "replied"
  | "call_booked"
  | "won"
  | "lost"
  | "nurture";

export type SignalType =
  | "job_change"
  | "funding_round"
  | "hiring_signal"
  | "tech_stack_change"
  | "intent_signal";

export type OutreachChannel = "email" | "linkedin" | "both";

export interface Lead {
  id: string;
  full_name: string;
  linkedin_url: string | null;
  email: string | null;
  phone: string | null;
  current_title: string | null;
  current_company: string | null;
  location: string | null;
  stage: LeadStage;
  fit_score: number | null;
  signals: Signal[];
  research: string | null;
  talking_points: string[] | null;
  outreach_channel: OutreachChannel | null;
  hubspot_contact_id: string | null;
  heyreach_campaign_id: string | null;
  instantly_lead_id: string | null;
  source_url: string | null;
  icp_id: string | null;
  created_at: string;
  updated_at: string;
  last_enriched_at: string | null;
  last_contacted_at: string | null;
}

export interface Signal {
  signal_type: SignalType;
  detail: string;
  detected_at: string;
}

export interface ICP {
  id: string;
  name: string;
  target_titles: string[];
  target_companies: string[];
  location: string[];
  keywords: string[];
  signals_to_watch: SignalType[];
  outreach_channel: OutreachChannel;
  created_at: string;
}

export interface FlywheelStage {
  key: LeadStage;
  label: string;
  count: number;
  conversion_rate: number | null;
}

export interface OutreachMessage {
  id: string;
  lead_id: string;
  channel: OutreachChannel;
  subject: string | null;
  body: string;
  status: "draft" | "approved" | "sent" | "replied";
  sent_at: string | null;
  replied_at: string | null;
  created_at: string;
}
