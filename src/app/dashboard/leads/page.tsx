"use client";

import { useState, useEffect } from "react";
import { Plus, Loader2, X, ExternalLink } from "lucide-react";
import { StageBadge } from "@/components/stage-badge";
import { LeadDetailPanel } from "@/components/lead-detail-panel";
import { relativeTime } from "@/lib/utils";
import type { Lead, LeadStage } from "@/types";

const STAGE_TABS: { key: "all" | LeadStage; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "enriched", label: "Enriched" },
  { key: "scored", label: "Scored" },
  { key: "outreach_sent", label: "Outreach Sent" },
  { key: "replied", label: "Replied" },
  { key: "call_booked", label: "Call Booked" },
  { key: "won", label: "Won" },
];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    fetch("/api/leads")
      .then((r) => r.json())
      .then((d) => setLeads(d.leads ?? []));
  }, []);
  const [activeStage, setActiveStage] = useState<"all" | LeadStage>("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addUrl, setAddUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [runningStep, setRunningStep] = useState<{ leadId: string; step: string } | null>(null);

  const filtered = activeStage === "all" ? leads : leads.filter(l => l.stage === activeStage);

  async function handleAddLead() {
    if (!addUrl.includes("linkedin.com")) return;
    setAdding(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkedin_url: addUrl }),
      });
      if (res.ok) {
        const d = await res.json();
        setLeads(prev => [d.lead, ...prev]);
        setAddUrl("");
        setShowAddModal(false);
      }
    } catch {
      // silently handle for demo
    } finally {
      setAdding(false);
    }
  }

  async function runStep(lead: Lead, step: string) {
    setRunningStep({ leadId: lead.id, step });
    try {
      const res = await fetch("/api/flywheel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: lead.id, step }),
      });
      if (res.ok) {
        const d = await res.json();
        if (d.lead) {
          setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, ...d.lead } : l));
          if (selectedLead?.id === lead.id) setSelectedLead(prev => prev ? { ...prev, ...d.lead } : prev);
        }
      }
    } catch {
      // silently handle for demo
    } finally {
      setRunningStep(null);
    }
  }

  function handleLeadUpdate(updated: Partial<Lead>) {
    if (!selectedLead) return;
    const merged = { ...selectedLead, ...updated };
    setLeads(prev => prev.map(l => l.id === selectedLead.id ? merged : l));
    setSelectedLead(merged);
  }

  const scoreColor = (score: number | null) =>
    score == null ? "text-zinc-500"
    : score >= 80 ? "text-green-400"
    : score >= 60 ? "text-yellow-400"
    : "text-red-400";

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Leads</h1>
          <p className="text-sm text-zinc-500 mt-1">{leads.length} total · {leads.filter(l => l.fit_score != null).length} scored</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Lead
        </button>
      </div>

      {/* Stage tabs */}
      <div className="flex items-center gap-1 overflow-x-auto">
        {STAGE_TABS.map(tab => {
          const count = tab.key === "all" ? leads.length : leads.filter(l => l.stage === tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveStage(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeStage === tab.key
                  ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                  : "text-zinc-500 hover:text-zinc-300 border border-transparent"
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className="bg-zinc-800 text-zinc-400 rounded-full px-1.5 text-[10px]">{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="rounded-xl bg-[#111111] border border-[#1f1f1f] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1f1f1f]">
              {["Name", "Company", "Title", "Location", "Score", "Stage", "Enriched", "Actions"].map(h => (
                <th key={h} className="text-left text-xs font-medium text-zinc-500 px-4 py-3 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1f1f1f]">
            {filtered.map(lead => (
              <tr
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className="hover:bg-[#1a1a1a] cursor-pointer transition-colors group"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center text-[11px] font-bold text-indigo-400 flex-shrink-0">
                      {lead.full_name.charAt(0)}
                    </div>
                    <span className="font-medium text-white">{lead.full_name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-300">{lead.current_company ?? "—"}</td>
                <td className="px-4 py-3 text-zinc-400 text-xs max-w-[140px] truncate">{lead.current_title ?? "—"}</td>
                <td className="px-4 py-3 text-zinc-500 text-xs">{lead.location ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`font-bold text-sm ${scoreColor(lead.fit_score)}`}>
                    {lead.fit_score != null ? lead.fit_score : "—"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <StageBadge stage={lead.stage} />
                </td>
                <td className="px-4 py-3 text-zinc-500 text-xs">
                  {lead.last_enriched_at ? relativeTime(lead.last_enriched_at) : "—"}
                </td>
                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {["enrich", "score", "write_outreach"].map(step => {
                      const isRunning = runningStep?.leadId === lead.id && runningStep.step === step;
                      const labels: Record<string, string> = { enrich: "E", score: "S", write_outreach: "W" };
                      return (
                        <button
                          key={step}
                          onClick={() => runStep(lead, step)}
                          disabled={runningStep !== null}
                          className="w-6 h-6 rounded bg-[#0a0a0a] border border-[#2a2a2a] hover:border-indigo-500/50 text-zinc-400 hover:text-indigo-400 text-[10px] font-bold transition-colors disabled:opacity-40 flex items-center justify-center"
                          title={step.replace("_", " ")}
                        >
                          {isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : labels[step]}
                        </button>
                      );
                    })}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-zinc-500">
            <ExternalLink className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No leads in this stage</p>
          </div>
        )}
      </div>

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
          <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-6 w-[420px] shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white">Add Lead</h2>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 font-medium mb-1.5 block">LinkedIn URL</label>
                <input
                  value={addUrl}
                  onChange={e => setAddUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                  className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  onKeyDown={e => { if (e.key === "Enter") handleAddLead(); }}
                />
              </div>
              <button
                onClick={handleAddLead}
                disabled={adding || !addUrl.includes("linkedin.com")}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {adding ? "Adding..." : "Add to Flywheel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Panel */}
      {selectedLead && (
        <LeadDetailPanel
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onLeadUpdate={handleLeadUpdate}
        />
      )}
    </div>
  );
}
