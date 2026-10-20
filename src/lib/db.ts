import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "flywheel.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  ensureSchema(_db);
  return _db;
}

function ensureSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS icps (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
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
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
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
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
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
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
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
}

// Helper: parse JSON fields from SQLite TEXT columns
export function parseLead(row: any) {
  if (!row) return null;
  return {
    ...row,
    signals: safeJson(row.signals, []),
    talking_points: safeJson(row.talking_points, []),
  };
}

function safeJson(val: any, fallback: any) {
  try { return val ? JSON.parse(val) : fallback; } catch { return fallback; }
}

export function serializeJson(val: any): string {
  return JSON.stringify(val ?? []);
}

// Generate a UUID-like ID
export function newId(): string {
  return crypto.randomUUID();
}
