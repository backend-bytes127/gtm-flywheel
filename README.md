# GTM Flywheel Orchestrator

> One person running an entire company's GTM — signal to close, automated.

A full-stack AI-powered GTM platform that replaces the linear sales funnel with a self-reinforcing flywheel. Built to demonstrate how a single operator can orchestrate outbound prospecting, lead enrichment, ICP scoring, AI-written outreach, and CRM integration using modern AI infrastructure.

---

## Architecture Diagram

![GTM Flywheel Architecture](gtm-flywheel-architecture.png)

---

## What It Does

| Stage | What happens |
|---|---|
| **Signal** | Detect buying intent — funding rounds, job changes, hiring signals, tech stack shifts |
| **Enrich** | Research the lead: role, company context, recent activity via AI |
| **Score** | Claude scores 0–100 fit against your ICP based on signals + research |
| **Outreach** | Claude writes hyper-personalized email or LinkedIn message |
| **Track** | Approve → Send → Track reply sentiment, suggest next action |
| **Expand** | Push to HeyReach (LinkedIn) or Instantly (email) for multi-touch sequences |

---

## Screenshots

### Flywheel — Pipeline Funnel
![GTM Flywheel](docs/screenshots/flywheel.jpg)

### Leads — Full Pipeline Table
![Leads](docs/screenshots/leads.jpg)

### Lead Detail — Signals, Research, Talking Points
![Lead Detail](docs/screenshots/lead-detail.jpg)

### Buying Signals — Real-time Trigger Feed
![Signals](docs/screenshots/signals.jpg)

### Outreach — AI-Written Messages Queue
![Outreach](docs/screenshots/outreach.jpg)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        GTM Flywheel                             │
│                                                                 │
│  Next.js App Router                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │Flywheel  │  │ Leads    │  │ Signals  │  │Outreach  │       │
│  │/dashboard│  │/dashboard│  │/dashboard│  │/dashboard│       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│                                                                 │
│  API Routes                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐     │
│  │/api/leads    │  │/api/flywheel │  │/api/webhook/slack│     │
│  │GET/POST/PATCH│  │POST (steps)  │  │URL verify + events│    │
│  └──────────────┘  └──────────────┘  └──────────────────┘     │
│                                                                 │
│  AI Agents (src/agents/flywheel-agent.ts)                       │
│  ┌────────────┐  ┌────────────┐  ┌──────────────┐             │
│  │scoreLead() │  │writeOut-   │  │researchLead()│             │
│  │0-100 fit   │  │reach()     │  │summary +     │             │
│  │score       │  │email/li    │  │talking pts   │             │
│  └────────────┘  └────────────┘  └──────────────┘             │
│                         │                                       │
│                    Claude Sonnet                                 │
│                    (via AI SDK v7)                               │
│                                                                 │
│  Data Layer                                                     │
│  ┌──────────────────────────────────────────┐                  │
│  │  SQLite (better-sqlite3) · flywheel.db   │                  │
│  │  leads · outreach_messages · signals     │                  │
│  │  WAL mode · FK constraints · singleton  │                  │
│  └──────────────────────────────────────────┘                  │
│                                                                 │
│  Integrations (via n8n webhooks)                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  Slack   │  │HeyReach  │  │Instantly │  │HubSpot   │       │
│  │/prospect │  │LinkedIn  │  │Email seq │  │CRM sync  │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js App Router |
| AI | AI SDK v7 + `@ai-sdk/anthropic` (Claude Sonnet) |
| Database | SQLite via `better-sqlite3` (WAL mode, local file) |
| Styling | Tailwind CSS v4 |
| Icons | lucide-react |
| Workflow automation | n8n (self-hosted) |
| Outreach channels | HeyReach (LinkedIn), Instantly (email) |
| Slack trigger | `/prospect <linkedin_url>` command |

---

## Lead Stage Machine

```
new → enriched → scored → outreach_sent → replied → call_booked → won
                                                   ↘ nurture
                                                   ↘ lost
```

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

Required:
```
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Seed sample data

```bash
npm run seed
```

Seeds 6 leads across all pipeline stages + 3 outreach messages into `flywheel.db`.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — redirects to `/dashboard/flywheel`.

---

## API Reference

### `POST /api/flywheel`

Run a flywheel step for a lead.

```json
{
  "lead_id": "uuid",
  "step": "enrich" | "score" | "write_outreach"
}
```

### `GET /api/flywheel`

Returns funnel stats: count per stage, avg fit score, conversion rates.

### `GET /api/leads`

```
?stage=enriched
?icp_id=uuid
```

### `POST /api/leads`

```json
{ "linkedin_url": "https://linkedin.com/in/..." }
```

### `PATCH /api/leads`

```json
{ "id": "uuid", "stage": "call_booked", "fit_score": 87 }
```

### `POST /api/webhook/slack`

Handles Slack events:
- URL verification challenge
- `block_actions` — button clicks update lead stage
- `message` — `/prospect <url>` inserts new lead and triggers enrichment

---

## Project Structure

```
src/
  agents/          # AI agent functions (score, write, research)
  app/
    api/           # Route handlers
    dashboard/     # Pages: flywheel, leads, signals, outreach
  components/      # LeadDetailPanel, StageBadge, Badge, RelativeTime
  lib/             # SQLite adapter (db.ts), mock data, utils
  types/           # Shared TypeScript types
scripts/
  seed.ts          # Seeds flywheel.db with sample leads + outreach
docs/
  screenshots/     # UI screenshots
gtm-flywheel-architecture.excalidraw  # Architecture diagram source
gtm-flywheel-architecture.png         # Architecture diagram (rendered)
```
