import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "..", "flywheel.db");

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS icps (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    target_titles TEXT DEFAULT '[]',
    target_companies TEXT DEFAULT '[]',
    location TEXT DEFAULT '[]',
    keywords TEXT DEFAULT '[]',
    signals_to_watch TEXT DEFAULT '[]',
    outreach_channel TEXT DEFAULT 'email',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    full_name TEXT,
    linkedin_url TEXT,
    email TEXT,
    phone TEXT,
    current_title TEXT,
    current_company TEXT,
    location TEXT,
    stage TEXT NOT NULL DEFAULT 'new',
    fit_score INTEGER,
    signals TEXT DEFAULT '[]',
    research TEXT,
    talking_points TEXT DEFAULT '[]',
    outreach_channel TEXT DEFAULT 'email',
    hubspot_contact_id TEXT,
    heyreach_campaign_id TEXT,
    instantly_lead_id TEXT,
    source_url TEXT,
    icp_id TEXT REFERENCES icps(id),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    last_enriched_at TEXT,
    last_contacted_at TEXT
  );

  CREATE TABLE IF NOT EXISTS outreach_messages (
    id TEXT PRIMARY KEY,
    lead_id TEXT REFERENCES leads(id) ON DELETE CASCADE,
    channel TEXT NOT NULL,
    subject TEXT,
    body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    sent_at TEXT,
    replied_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS signal_events (
    id TEXT PRIMARY KEY,
    lead_id TEXT REFERENCES leads(id) ON DELETE CASCADE,
    signal_type TEXT NOT NULL,
    detail TEXT,
    source TEXT,
    detected_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS leads_stage_idx ON leads(stage);
  CREATE INDEX IF NOT EXISTS leads_score_idx ON leads(fit_score DESC);
  CREATE INDEX IF NOT EXISTS outreach_lead_idx ON outreach_messages(lead_id);
`);

const leads = [
  {
    id: "lead-1",
    full_name: "Yugesh Jaiswal",
    linkedin_url: "https://linkedin.com/in/yogesky",
    email: "yugesh@clayground.io",
    current_title: "GTM Engineer",
    current_company: "Clayground",
    location: "Mumbai, India",
    stage: "replied",
    fit_score: 87,
    signals: JSON.stringify([
      { signal_type: "job_change", detail: "Started GTM Engineer at Clayground — Jun 2026", detected_at: "2026-10-18T10:00:00Z" },
      { signal_type: "hiring_signal", detail: "2 open roles incl. \"Growth Hacker\"", detected_at: "2026-10-18T10:00:00Z" },
    ]),
    research: "GTM Engineer at Clayground & Tricle AI with 5+ years across SaaS sales, outbound automation, and GTM. Focuses on AI-assisted outbound systems, automated lead sourcing, data enrichment, multi-channel outreach and ICP-driven targeting.",
    talking_points: JSON.stringify([
      "I see you build AI-assisted outbound systems — curious if you're prioritizing signal-based prospecting right now?",
      "You mention working across the full revenue cycle — are you focused more on CRM cleanup or building AI sales agents?",
      "Given your interest in automated personalization at scale, would you be open to a 10-min chat?",
    ]),
    outreach_channel: "linkedin",
    hubspot_contact_id: "hs_001",
    source_url: "slack",
    created_at: "2026-10-18T09:00:00Z",
    updated_at: "2026-10-18T11:00:00Z",
    last_enriched_at: "2026-10-18T09:30:00Z",
    last_contacted_at: "2026-10-18T10:30:00Z",
  },
  {
    id: "lead-2",
    full_name: "Prashant Singh",
    linkedin_url: "https://linkedin.com/in/prashant905",
    email: "prashant.singh@iqline.co.in",
    current_title: "Senior AI Engineer",
    current_company: "IQ-Line",
    location: "New Delhi, India",
    stage: "outreach_sent",
    fit_score: 74,
    signals: JSON.stringify([
      { signal_type: "funding_round", detail: "$2M Seed — IQ-Line, Sep 2026", detected_at: "2026-10-15T10:00:00Z" },
    ]),
    research: "Senior AI Engineer at IQ-Line in New Delhi with expertise in Deep Learning, Computer Vision, Python, TensorFlow, PyTorch. Built AI solutions with clear social and healthcare impact.",
    talking_points: JSON.stringify([
      "Congrats on IQ-Line's seed round — are you scaling the team GTM side?",
      "Your computer vision work in healthcare is impressive — what does your current outbound stack look like?",
    ]),
    outreach_channel: "email",
    hubspot_contact_id: "hs_002",
    instantly_lead_id: "ins_002",
    source_url: "slack",
    created_at: "2026-10-17T08:00:00Z",
    updated_at: "2026-10-18T10:00:00Z",
    last_enriched_at: "2026-10-17T09:00:00Z",
    last_contacted_at: "2026-10-17T11:00:00Z",
  },
  {
    id: "lead-3",
    full_name: "Satya Nadella",
    linkedin_url: "https://linkedin.com/in/satyanadella",
    current_title: "CEO",
    current_company: "Microsoft",
    location: "Seattle, WA",
    stage: "scored",
    fit_score: 92,
    signals: JSON.stringify([
      { signal_type: "intent_signal", detail: "Published article on AI-first GTM strategy — Oct 2026", detected_at: "2026-10-16T10:00:00Z" },
      { signal_type: "hiring_signal", detail: "48 open roles incl. \"GTM Lead, AI Products\"", detected_at: "2026-10-16T10:00:00Z" },
    ]),
    research: "CEO of Microsoft driving AI-first transformation across enterprise. Recent focus on Copilot GTM and AI-native product launches. Published thought leadership on agentic AI in enterprise workflows.",
    talking_points: JSON.stringify([
      "Your recent article on AI-first GTM resonated — we're building exactly that layer for mid-market teams.",
      "Microsoft's Copilot GTM is the blueprint — how are enterprise teams adapting to AI-native buying motions?",
    ]),
    outreach_channel: "linkedin",
    source_url: "slack",
    created_at: "2026-10-16T07:00:00Z",
    updated_at: "2026-10-17T09:00:00Z",
    last_enriched_at: "2026-10-16T08:00:00Z",
  },
  {
    id: "lead-4",
    full_name: "Rohit Sujan",
    linkedin_url: "https://linkedin.com/in/rohit-sujan",
    current_title: "Founder",
    current_company: "Vyam.AI",
    location: "Mumbai, India",
    stage: "enriched",
    fit_score: 68,
    signals: JSON.stringify([
      { signal_type: "job_change", detail: "Founded Vyam.AI — Aug 2026", detected_at: "2026-10-14T10:00:00Z" },
    ]),
    research: "Founder-operator at Vyam.AI with deep expertise in product strategy, sales, and growth across B2B.",
    talking_points: JSON.stringify([
      "Building Vyam.AI from scratch — what does your current GTM motion look like at this stage?",
      "Founder-led sales is brutal — have you started thinking about when to bring in outbound automation?",
    ]),
    outreach_channel: "email",
    source_url: "slack",
    created_at: "2026-10-14T10:00:00Z",
    updated_at: "2026-10-15T10:00:00Z",
    last_enriched_at: "2026-10-14T11:00:00Z",
  },
  {
    id: "lead-5",
    full_name: "Anisha Kapoor",
    linkedin_url: "https://linkedin.com/in/anisha-kapoor-gtm",
    email: "anisha@scaleup.in",
    current_title: "Head of Revenue",
    current_company: "ScaleUp",
    location: "Bangalore, India",
    stage: "call_booked",
    fit_score: 81,
    signals: JSON.stringify([
      { signal_type: "funding_round", detail: "$5M Series A — ScaleUp, Oct 2026", detected_at: "2026-10-12T10:00:00Z" },
      { signal_type: "hiring_signal", detail: "5 open roles incl. \"SDR Manager\"", detected_at: "2026-10-12T10:00:00Z" },
    ]),
    research: "Head of Revenue at ScaleUp, recently Series A funded. Building out the revenue team post-fundraise. Focus on scaling PLG motion with an outbound layer.",
    talking_points: JSON.stringify([
      "Congrats on the Series A — scaling revenue orgs post-fundraise is the hardest part.",
      "You're hiring SDR Managers — are you evaluating AI SDR tools to augment the team?",
    ]),
    outreach_channel: "both",
    hubspot_contact_id: "hs_005",
    heyreach_campaign_id: "hr_005",
    instantly_lead_id: "ins_005",
    source_url: "signal_detection",
    created_at: "2026-10-12T08:00:00Z",
    updated_at: "2026-10-18T09:00:00Z",
    last_enriched_at: "2026-10-12T09:00:00Z",
    last_contacted_at: "2026-10-14T10:00:00Z",
  },
  {
    id: "lead-6",
    full_name: "Marcus Chen",
    linkedin_url: "https://linkedin.com/in/marcus-chen-rev",
    current_title: "VP Sales",
    current_company: "NexusAI",
    location: "Singapore",
    stage: "new",
    fit_score: null,
    signals: "[]",
    talking_points: "[]",
    outreach_channel: "email",
    source_url: "manual",
    created_at: "2026-10-18T11:00:00Z",
    updated_at: "2026-10-18T11:00:00Z",
  },
];

const insertLead = db.prepare(`
  INSERT OR REPLACE INTO leads
  (id, full_name, linkedin_url, email, current_title, current_company, location,
   stage, fit_score, signals, research, talking_points, outreach_channel,
   hubspot_contact_id, heyreach_campaign_id, instantly_lead_id, source_url,
   created_at, updated_at, last_enriched_at, last_contacted_at)
  VALUES
  (@id, @full_name, @linkedin_url, @email, @current_title, @current_company, @location,
   @stage, @fit_score, @signals, @research, @talking_points, @outreach_channel,
   @hubspot_contact_id, @heyreach_campaign_id, @instantly_lead_id, @source_url,
   @created_at, @updated_at, @last_enriched_at, @last_contacted_at)
`);

const outreachMessages = [
  {
    id: "om-1",
    lead_id: "lead-2",
    channel: "email",
    subject: "IQ-Line's Series A + AI-native GTM",
    body: `Hi Prashant,\n\nCongrats on IQ-Line's seed round — building in AI healthcare is one of the hardest GTM motions out there.\n\nWe're helping AI-first teams set up signal-based outbound that actually converts. One founder went from 0 to 12 enterprise pilots in 60 days using a system like this.\n\nWould a 15-min call make sense to see if it applies to where IQ-Line is going?`,
    status: "approved",
    sent_at: "2026-10-17T11:00:00Z",
    created_at: "2026-10-17T10:30:00Z",
  },
  {
    id: "om-2",
    lead_id: "lead-5",
    channel: "linkedin",
    subject: null,
    body: "Anisha — saw ScaleUp just closed Series A and you're building out the SDR team. We help post-fundraise revenue orgs set up AI-assisted outbound before the first SDR hire. Worth a quick chat?",
    status: "sent",
    sent_at: "2026-10-13T10:00:00Z",
    replied_at: "2026-10-14T09:00:00Z",
    created_at: "2026-10-12T11:00:00Z",
  },
  {
    id: "om-3",
    lead_id: "lead-3",
    channel: "linkedin",
    subject: null,
    body: "Satya — your piece on AI-first GTM was spot on. We're building the orchestration layer that makes this real for mid-market teams — signal detection → enrichment → personalized outreach, all automated. Happy to share what we've built if you're curious.",
    status: "draft",
    created_at: "2026-10-18T09:00:00Z",
  },
];

const insertMsg = db.prepare(`
  INSERT OR REPLACE INTO outreach_messages (id, lead_id, channel, subject, body, status, sent_at, replied_at, created_at)
  VALUES (@id, @lead_id, @channel, @subject, @body, @status, @sent_at, @replied_at, @created_at)
`);

const seedAll = db.transaction(() => {
  for (const lead of leads) {
    insertLead.run({
      email: null,
      phone: null,
      research: null,
      hubspot_contact_id: null,
      heyreach_campaign_id: null,
      instantly_lead_id: null,
      last_enriched_at: null,
      last_contacted_at: null,
      ...lead,
    });
  }
  for (const msg of outreachMessages) {
    insertMsg.run({ subject: null, sent_at: null, replied_at: null, ...msg });
  }
});

seedAll();
console.log(`Seeded ${leads.length} leads and ${outreachMessages.length} outreach messages.`);
db.close();
