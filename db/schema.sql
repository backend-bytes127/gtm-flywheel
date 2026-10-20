-- GTM Flywheel Schema

create extension if not exists "uuid-ossp";

-- ICP definitions
create table if not exists icps (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  target_titles      text[]    default '{}',
  target_companies   text[]    default '{}',
  location           text[]    default '{}',
  keywords           text[]    default '{}',
  signals_to_watch   text[]    default '{}',
  outreach_channel   text      default 'email',
  created_at   timestamptz default now()
);

-- Leads (the flywheel's core entity)
create table if not exists leads (
  id                   uuid primary key default uuid_generate_v4(),
  full_name            text,
  linkedin_url         text,
  email                text,
  phone                text,
  current_title        text,
  current_company      text,
  location             text,
  stage                text not null default 'new',
  fit_score            int,
  signals              jsonb default '[]',
  research             text,
  talking_points       text[] default '{}',
  outreach_channel     text default 'email',
  hubspot_contact_id   text,
  heyreach_campaign_id text,
  instantly_lead_id    text,
  source_url           text,
  icp_id               uuid references icps(id),
  created_at           timestamptz default now(),
  updated_at           timestamptz default now(),
  last_enriched_at     timestamptz,
  last_contacted_at    timestamptz
);

-- Outreach messages (drafts + sent)
create table if not exists outreach_messages (
  id         uuid primary key default uuid_generate_v4(),
  lead_id    uuid references leads(id) on delete cascade,
  channel    text not null,
  subject    text,
  body       text not null,
  status     text not null default 'draft',
  sent_at    timestamptz,
  replied_at timestamptz,
  created_at timestamptz default now()
);

-- Signal events (buying triggers detected)
create table if not exists signal_events (
  id           uuid primary key default uuid_generate_v4(),
  lead_id      uuid references leads(id) on delete cascade,
  signal_type  text not null,
  detail       text,
  source       text,
  detected_at  timestamptz default now()
);

-- Flywheel runs (audit log)
create table if not exists flywheel_runs (
  id          uuid primary key default uuid_generate_v4(),
  lead_id     uuid references leads(id) on delete cascade,
  step        text not null,
  status      text not null default 'success',
  output      jsonb,
  ran_at      timestamptz default now()
);

-- Indexes
create index if not exists leads_stage_idx on leads(stage);
create index if not exists leads_icp_idx on leads(icp_id);
create index if not exists leads_score_idx on leads(fit_score desc);
create index if not exists outreach_lead_idx on outreach_messages(lead_id);
