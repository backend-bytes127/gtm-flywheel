"use client";

import { useState } from "react";
import { Zap, Loader2, TrendingUp, Briefcase, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MOCK_SIGNALS } from "@/lib/mock-data";
import { RelativeTime } from "@/components/relative-time";
import type { SignalType } from "@/types";

const signalConfig: Record<SignalType, { label: string; variant: "blue" | "yellow" | "green" | "purple" | "orange"; icon: React.ElementType }> = {
  job_change: { label: "Job Change", variant: "blue", icon: Briefcase },
  funding_round: { label: "Funding Round", variant: "yellow", icon: TrendingUp },
  hiring_signal: { label: "Hiring Signal", variant: "green", icon: Users },
  tech_stack_change: { label: "Tech Stack", variant: "purple", icon: Zap },
  intent_signal: { label: "Intent Signal", variant: "orange", icon: Zap },
};

export default function SignalsPage() {
  const [signals] = useState(MOCK_SIGNALS);
  const [detecting, setDetecting] = useState(false);

  async function detectSignals() {
    setDetecting(true);
    await new Promise(r => setTimeout(r, 2000));
    setDetecting(false);
  }

  const counts = {
    funding_round: signals.filter(s => s.signal_type === "funding_round").length,
    job_change: signals.filter(s => s.signal_type === "job_change").length,
    hiring_signal: signals.filter(s => s.signal_type === "hiring_signal").length,
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Buying Signals</h1>
          <p className="text-sm text-zinc-500 mt-1">Real-time triggers — funding, job changes, hiring intent</p>
        </div>
        <button
          onClick={detectSignals}
          disabled={detecting}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {detecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {detecting ? "Detecting..." : "Detect Signals"}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-[#111111] border border-yellow-500/20 p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-yellow-500/10 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-yellow-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{counts.funding_round}</p>
            <p className="text-xs text-zinc-500">Funding Rounds</p>
          </div>
        </div>
        <div className="rounded-xl bg-[#111111] border border-blue-500/20 p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{counts.job_change}</p>
            <p className="text-xs text-zinc-500">Job Changes</p>
          </div>
        </div>
        <div className="rounded-xl bg-[#111111] border border-green-500/20 p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center">
            <Users className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{counts.hiring_signal}</p>
            <p className="text-xs text-zinc-500">Hiring Signals</p>
          </div>
        </div>
      </div>

      {/* Signal feed */}
      <div className="space-y-3">
        {signals.map(signal => {
          const config = signalConfig[signal.signal_type];
          const Icon = config.icon;
          return (
            <div key={signal.id} className="rounded-xl bg-[#111111] border border-[#1f1f1f] hover:border-[#2a2a2a] p-4 transition-colors">
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  config.variant === "blue" ? "bg-blue-500/10" :
                  config.variant === "yellow" ? "bg-yellow-500/10" :
                  config.variant === "green" ? "bg-green-500/10" :
                  "bg-orange-500/10"
                }`}>
                  <Icon className={`w-4 h-4 ${
                    config.variant === "blue" ? "text-blue-400" :
                    config.variant === "yellow" ? "text-yellow-400" :
                    config.variant === "green" ? "text-green-400" :
                    "text-orange-400"
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white">{signal.lead_name}</p>
                      <span className="text-xs text-zinc-500">·</span>
                      <p className="text-xs text-zinc-400">{signal.company}</p>
                    </div>
                    <RelativeTime date={signal.detected_at} className="text-xs text-zinc-600 flex-shrink-0" />
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant={config.variant}>{config.label}</Badge>
                    <p className="text-xs text-zinc-300">{signal.detail}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
