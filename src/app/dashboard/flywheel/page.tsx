"use client";

import { ArrowRight, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { MOCK_LEADS } from "@/lib/mock-data";

const STAGES = [
  { key: "new", label: "New", color: "bg-zinc-500" },
  { key: "enriched", label: "Enriched", color: "bg-blue-500" },
  { key: "scored", label: "Scored", color: "bg-yellow-500" },
  { key: "outreach_sent", label: "Outreach Sent", color: "bg-purple-500" },
  { key: "replied", label: "Replied", color: "bg-green-500" },
  { key: "call_booked", label: "Call Booked", color: "bg-emerald-500" },
  { key: "won", label: "Won 🎉", color: "bg-green-600" },
];

export default function FlywheelPage() {
  const leads = MOCK_LEADS;
  const total = leads.length;

  const counts = STAGES.map(s => ({
    ...s,
    count: leads.filter(l => l.stage === s.key).length,
  }));

  const scored = leads.filter(l => l.fit_score != null);
  const avgScore = scored.length > 0
    ? Math.round(scored.reduce((a, b) => a + (b.fit_score ?? 0), 0) / scored.length)
    : 0;

  const outreachSent = leads.filter(l => ["outreach_sent", "replied", "call_booked", "won"].includes(l.stage)).length;
  const won = leads.filter(l => l.stage === "won").length;

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">GTM Flywheel</h1>
        <p className="text-sm text-zinc-500 mt-1">Your full pipeline — signal to close, automated.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Leads" value={total} sub="across all stages" />
        <StatCard label="Avg Fit Score" value={`${avgScore}/100`} sub="of scored leads" accent="text-yellow-400" />
        <StatCard label="Outreach Sent" value={outreachSent} sub="total contacts reached" accent="text-purple-400" />
        <StatCard label="Won" value={won} sub="closed deals" accent="text-green-400" />
      </div>

      {/* Funnel */}
      <div className="rounded-xl bg-[#111111] border border-[#1f1f1f] p-6">
        <div className="flex items-center gap-1.5 mb-6">
          <TrendingUp className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-white">Pipeline Funnel</h2>
        </div>

        <div className="flex items-end gap-2">
          {counts.map((stage, i) => {
            const maxCount = Math.max(...counts.map(s => s.count), 1);
            const heightPct = Math.max((stage.count / maxCount) * 100, 8);
            const prev = i > 0 ? counts[i - 1].count : null;
            const convRate = prev != null && prev > 0 ? Math.round((stage.count / prev) * 100) : null;

            return (
              <div key={stage.key} className="flex-1 flex flex-col items-center gap-2">
                {convRate !== null && (
                  <div className="flex items-center gap-0.5 text-[10px] text-zinc-500">
                    <ArrowRight className="w-3 h-3" />
                    <span>{convRate}%</span>
                  </div>
                )}
                {convRate === null && <div className="h-4" />}
                <div className="w-full flex flex-col items-center gap-1">
                  <span className="text-sm font-bold text-white">{stage.count}</span>
                  <div
                    className={`w-full rounded-t-lg ${stage.color} transition-all`}
                    style={{ height: `${heightPct * 1.5}px`, opacity: 0.85 }}
                  />
                </div>
                <p className="text-[10px] text-zinc-400 text-center leading-tight">{stage.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent activity */}
      <div className="rounded-xl bg-[#111111] border border-[#1f1f1f] p-6">
        <h2 className="text-sm font-semibold text-white mb-4">Recent Leads</h2>
        <div className="space-y-2">
          {leads.slice(0, 5).map(lead => (
            <div key={lead.id} className="flex items-center justify-between py-2 border-b border-[#1f1f1f] last:border-0">
              <div>
                <p className="text-sm text-white font-medium">{lead.full_name}</p>
                <p className="text-xs text-zinc-500">{lead.current_title} · {lead.current_company}</p>
              </div>
              <div className="flex items-center gap-3">
                {lead.fit_score != null && (
                  <span className={`text-xs font-bold ${lead.fit_score >= 80 ? "text-green-400" : lead.fit_score >= 60 ? "text-yellow-400" : "text-red-400"}`}>
                    {lead.fit_score}
                  </span>
                )}
                <span className="text-xs text-zinc-500 capitalize">{lead.stage.replace("_", " ")}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
