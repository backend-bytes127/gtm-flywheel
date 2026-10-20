"use client";

import { X, Zap, Loader2, ExternalLink, Mail, Phone } from "lucide-react";
import { useState } from "react";
import { StageBadge } from "@/components/stage-badge";
import { Badge } from "@/components/ui/badge";
import type { Lead, SignalType } from "@/types";

const signalColors: Record<SignalType, "blue" | "yellow" | "green" | "purple" | "orange"> = {
  job_change: "blue",
  funding_round: "yellow",
  hiring_signal: "green",
  tech_stack_change: "purple",
  intent_signal: "orange",
};

const signalLabels: Record<SignalType, string> = {
  job_change: "Job Change",
  funding_round: "Funding",
  hiring_signal: "Hiring",
  tech_stack_change: "Tech Stack",
  intent_signal: "Intent",
};

interface LeadDetailPanelProps {
  lead: Lead;
  onClose: () => void;
  onLeadUpdate?: (updated: Partial<Lead>) => void;
}

export function LeadDetailPanel({ lead, onClose, onLeadUpdate }: LeadDetailPanelProps) {
  const [loadingStep, setLoadingStep] = useState<string | null>(null);

  async function runStep(step: string) {
    setLoadingStep(step);
    try {
      const res = await fetch("/api/flywheel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: lead.id, step }),
      });
      if (res.ok) {
        const d = await res.json();
        onLeadUpdate?.(d.lead ?? {});
      }
    } catch {
      // silently ignore for demo
    } finally {
      setLoadingStep(null);
    }
  }

  const scoreColor = lead.fit_score == null ? "text-zinc-500"
    : lead.fit_score >= 80 ? "text-green-400"
    : lead.fit_score >= 60 ? "text-yellow-400"
    : "text-red-400";

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-[#111111] border-l border-[#1f1f1f] flex flex-col z-50 shadow-2xl">
      {/* Header */}
      <div className="flex items-start justify-between p-5 border-b border-[#1f1f1f]">
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-white truncate">{lead.full_name}</h2>
          <p className="text-xs text-zinc-400 mt-0.5 truncate">{lead.current_title} · {lead.current_company}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <StageBadge stage={lead.stage} />
            {lead.fit_score != null && (
              <span className={`text-sm font-bold ${scoreColor}`}>{lead.fit_score}/100</span>
            )}
          </div>
        </div>
        <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors ml-3 mt-0.5 flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Contact info */}
        <div className="space-y-1.5">
          {lead.email && (
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Mail className="w-3.5 h-3.5" />
              <span>{lead.email}</span>
            </div>
          )}
          {lead.phone && (
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Phone className="w-3.5 h-3.5" />
              <span>{lead.phone}</span>
            </div>
          )}
          {lead.linkedin_url && (
            <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>LinkedIn Profile</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          {lead.location && <p className="text-xs text-zinc-500">{lead.location}</p>}
        </div>

        {/* Signals */}
        {lead.signals.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Buying Signals</p>
            <div className="space-y-1.5">
              {lead.signals.map((s, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg bg-[#0a0a0a] border border-[#1f1f1f] px-3 py-2">
                  <Zap className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <Badge variant={signalColors[s.signal_type]} className="mb-1">{signalLabels[s.signal_type]}</Badge>
                    <p className="text-xs text-zinc-300">{s.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Research */}
        {lead.research && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Research</p>
            <p className="text-xs text-zinc-300 leading-relaxed bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-3">
              {lead.research}
            </p>
          </div>
        )}

        {/* Talking points */}
        {lead.talking_points && lead.talking_points.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Talking Points</p>
            <ul className="space-y-1.5">
              {lead.talking_points.map((tp, i) => (
                <li key={i} className="text-xs text-zinc-300 flex items-start gap-2">
                  <span className="text-indigo-400 font-bold flex-shrink-0">{i + 1}.</span>
                  <span>{tp}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CRM links */}
        <div className="flex items-center gap-2 flex-wrap">
          {lead.hubspot_contact_id && (
            <Badge variant="orange">HubSpot ✓</Badge>
          )}
          {lead.heyreach_campaign_id && (
            <Badge variant="blue">HeyReach ✓</Badge>
          )}
          {lead.instantly_lead_id && (
            <Badge variant="purple">Instantly ✓</Badge>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="p-5 border-t border-[#1f1f1f] space-y-2">
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => runStep("enrich")}
            disabled={loadingStep !== null}
            className="flex items-center justify-center gap-1 rounded-lg border border-[#1f1f1f] bg-[#0a0a0a] hover:bg-[#1a1a1a] px-3 py-2 text-xs font-medium text-zinc-300 transition-colors disabled:opacity-40"
          >
            {loadingStep === "enrich" ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
            Enrich
          </button>
          <button
            onClick={() => runStep("score")}
            disabled={loadingStep !== null}
            className="flex items-center justify-center gap-1 rounded-lg border border-[#1f1f1f] bg-[#0a0a0a] hover:bg-[#1a1a1a] px-3 py-2 text-xs font-medium text-zinc-300 transition-colors disabled:opacity-40"
          >
            {loadingStep === "score" ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
            Score
          </button>
          <button
            onClick={() => runStep("write_outreach")}
            disabled={loadingStep !== null}
            className="flex items-center justify-center gap-1 rounded-lg border border-[#1f1f1f] bg-[#0a0a0a] hover:bg-[#1a1a1a] px-3 py-2 text-xs font-medium text-zinc-300 transition-colors disabled:opacity-40"
          >
            {loadingStep === "write_outreach" ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
            Outreach
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button className="rounded-lg border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 px-3 py-2 text-xs font-medium text-blue-400 transition-colors">
            Push to HeyReach
          </button>
          <button className="rounded-lg border border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 px-3 py-2 text-xs font-medium text-purple-400 transition-colors">
            Push to Instantly
          </button>
        </div>
      </div>
    </div>
  );
}
