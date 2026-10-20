const HEYREACH_BASE = "https://api.heyreach.io/api/public";
const INSTANTLY_BASE = "https://api.instantly.ai/api/v2";
const HUBSPOT_BASE = "https://api.hubapi.com";

// ── HeyReach ──────────────────────────────────────────────────────────────────

export async function addLeadToHeyReachCampaign(lead: {
  linkedin_url: string;
  full_name: string;
  current_title?: string | null;
  current_company?: string | null;
  email?: string | null;
}) {
  const key = process.env.HEYREACH_API_KEY;
  const campaignId = process.env.HEYREACH_CAMPAIGN_ID;
  const accountId = process.env.HEYREACH_LINKEDIN_ACCOUNT_ID;
  if (!key || !campaignId || !accountId) return { ok: false, error: "HeyReach not configured" };

  const [firstName, ...rest] = lead.full_name.split(" ");
  const lastName = rest.join(" ");

  const res = await fetch(`${HEYREACH_BASE}/v1/campaign/AddLeadsToCampaign`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-KEY": key },
    body: JSON.stringify({
      campaignId: Number(campaignId),
      accountId: Number(accountId),
      leadsToAdd: [{
        profileUrl: lead.linkedin_url,
        firstName,
        lastName,
        position: lead.current_title ?? "",
        companyName: lead.current_company ?? "",
        email: lead.email ?? "",
      }],
    }),
  });

  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

// ── Instantly ─────────────────────────────────────────────────────────────────

export async function addLeadToInstantlyCampaign(lead: {
  email: string;
  full_name: string;
  current_company?: string | null;
  current_title?: string | null;
}) {
  const key = process.env.INSTANTLY_API_KEY;
  const campaignId = process.env.INSTANTLY_CAMPAIGN_ID;
  if (!key || !campaignId) return { ok: false, error: "Instantly not configured" };

  const res = await fetch(`${INSTANTLY_BASE}/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      campaign_id: campaignId,
      email: lead.email,
      first_name: lead.full_name.split(" ")[0],
      last_name: lead.full_name.split(" ").slice(1).join(" "),
      company_name: lead.current_company ?? "",
      personalization: `${lead.current_title ?? ""} at ${lead.current_company ?? ""}`.trim(),
    }),
  });

  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

// ── HubSpot ───────────────────────────────────────────────────────────────────

export async function upsertHubSpotContact(lead: {
  full_name: string;
  email?: string | null;
  current_title?: string | null;
  current_company?: string | null;
  location?: string | null;
  linkedin_url: string;
  fit_score?: number | null;
  stage: string;
}) {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) return { ok: false, error: "HubSpot not configured" };

  const [firstName, ...rest] = lead.full_name.split(" ");
  const props: Record<string, string> = {
    firstname: firstName,
    lastname: rest.join(" "),
    jobtitle: lead.current_title ?? "",
    company: lead.current_company ?? "",
    city: lead.location ?? "",
    linkedin_url: lead.linkedin_url,
    hs_lead_status: lead.stage.toUpperCase(),
  };
  if (lead.email) props.email = lead.email;
  if (lead.fit_score != null) props.gtm_fit_score = String(lead.fit_score);

  // Search for existing contact by linkedin_url
  const searchRes = await fetch(`${HUBSPOT_BASE}/crm/v3/objects/contacts/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      filterGroups: [{ filters: [{ propertyName: "linkedin_url", operator: "EQ", value: lead.linkedin_url }] }],
      limit: 1,
    }),
  });
  const searchData = await searchRes.json().catch(() => ({ results: [] }));
  const existing = searchData.results?.[0];

  if (existing) {
    const patchRes = await fetch(`${HUBSPOT_BASE}/crm/v3/objects/contacts/${existing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ properties: props }),
    });
    const data = await patchRes.json().catch(() => ({}));
    return { ok: patchRes.ok, action: "updated", contactId: existing.id, data };
  }

  const createRes = await fetch(`${HUBSPOT_BASE}/crm/v3/objects/contacts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ properties: props }),
  });
  const data = await createRes.json().catch(() => ({}));
  return { ok: createRes.ok, action: "created", contactId: data.id, data };
}

// ── Slack notify ──────────────────────────────────────────────────────────────

export async function postSlackLeadCard(lead: {
  id: string;
  full_name: string;
  current_title?: string | null;
  current_company?: string | null;
  fit_score?: number | null;
  stage: string;
  linkedin_url: string;
  research?: string | null;
}) {
  const token = process.env.SLACK_BOT_TOKEN;
  const channel = process.env.SLACK_CHANNEL_ID;
  if (!token || !channel) return { ok: false, error: "Slack not configured" };

  const scoreEmoji = lead.fit_score == null ? "⬜" : lead.fit_score >= 80 ? "🟢" : lead.fit_score >= 60 ? "🟡" : "🔴";

  const res = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      channel,
      text: `New lead ready: ${lead.full_name}`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*${lead.full_name}* · ${lead.current_title ?? "—"} @ ${lead.current_company ?? "—"}\n${scoreEmoji} Fit score: *${lead.fit_score ?? "—"}* · Stage: \`${lead.stage}\``,
          },
        },
        ...(lead.research ? [{
          type: "section",
          text: { type: "mrkdwn", text: `_${lead.research.slice(0, 300)}…_` },
        }] : []),
        {
          type: "actions",
          elements: [
            { type: "button", text: { type: "plain_text", text: "✅ Replied" }, action_id: "mark_replied", value: lead.id },
            { type: "button", text: { type: "plain_text", text: "📅 Call Booked" }, action_id: "mark_call_booked", value: lead.id, style: "primary" },
            { type: "button", text: { type: "plain_text", text: "❌ Lost" }, action_id: "mark_lost", value: lead.id, style: "danger" },
          ],
        },
      ],
    }),
  });

  const data = await res.json().catch(() => ({}));
  return { ok: res.ok && data.ok, data };
}
