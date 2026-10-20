"use client";

import { useState } from "react";
import { Mail, ExternalLink, Check, Send, Clock, CheckCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MOCK_OUTREACH } from "@/lib/mock-data";
import { RelativeTime } from "@/components/relative-time";

const STATUS_GROUPS = [
  { key: "draft", label: "Drafts", icon: Clock, color: "text-zinc-400" },
  { key: "approved", label: "Approved", icon: Check, color: "text-green-400" },
  { key: "sent", label: "Sent", icon: Send, color: "text-purple-400" },
];

export default function OutreachPage() {
  const [messages, setMessages] = useState(MOCK_OUTREACH);

  function approve(id: string) {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, status: "approved" as const } : m));
  }

  function markSent(id: string) {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, status: "sent" as const, sent_at: new Date().toISOString() } : m));
  }

  const totalDrafts = messages.filter(m => m.status === "draft").length;
  const totalSent = messages.filter(m => m.status === "sent").length;
  const totalReplied = messages.filter(m => m.status === "replied").length;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Outreach</h1>
          <p className="text-sm text-zinc-500 mt-1">AI-written messages — review and send</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-zinc-500">
          <span><span className="text-white font-bold">{totalDrafts}</span> drafts</span>
          <span><span className="text-purple-400 font-bold">{totalSent}</span> sent</span>
          <span><span className="text-green-400 font-bold">{totalReplied}</span> replied</span>
        </div>
      </div>

      {/* Grouped by status */}
      {STATUS_GROUPS.map(group => {
        const groupMessages = messages.filter(m => m.status === group.key);
        if (groupMessages.length === 0) return null;
        const Icon = group.icon;

        return (
          <div key={group.key} className="space-y-3">
            <div className="flex items-center gap-2">
              <Icon className={`w-4 h-4 ${group.color}`} />
              <h2 className="text-sm font-semibold text-white">{group.label}</h2>
              <span className="text-xs text-zinc-600">({groupMessages.length})</span>
            </div>

            <div className="space-y-3">
              {groupMessages.map(msg => (
                <div key={msg.id} className="rounded-xl bg-[#111111] border border-[#1f1f1f] hover:border-[#2a2a2a] p-5 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-white">{msg.lead_name}</span>
                        <span className="text-xs text-zinc-500">·</span>
                        <span className="text-xs text-zinc-400">{msg.lead_company}</span>
                        <Badge variant={msg.channel === "email" ? "purple" : "blue"}>
                          <span className="flex items-center gap-1">
                            {msg.channel === "email" ? <Mail className="w-2.5 h-2.5" /> : <ExternalLink className="w-2.5 h-2.5" />}
                            {msg.channel === "email" ? "Email" : "LinkedIn"}
                          </span>
                        </Badge>
                        {msg.sent_at && (
                          <span className="text-xs text-zinc-600">Sent <RelativeTime date={msg.sent_at} /></span>
                        )}
                      </div>

                      {/* Subject */}
                      {msg.subject && (
                        <p className="text-xs font-semibold text-zinc-300 mb-1.5">Subject: {msg.subject}</p>
                      )}

                      {/* Body preview */}
                      <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap line-clamp-4">
                        {msg.body}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      {msg.status === "draft" && (
                        <>
                          <button
                            onClick={() => approve(msg.id)}
                            className="flex items-center gap-1.5 rounded-lg border border-green-500/30 bg-green-500/5 hover:bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-400 transition-colors"
                          >
                            <Check className="w-3 h-3" />
                            Approve
                          </button>
                          <button className="flex items-center gap-1.5 rounded-lg border border-[#1f1f1f] hover:bg-[#1a1a1a] px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors">
                            Edit
                          </button>
                        </>
                      )}
                      {msg.status === "approved" && (
                        <button
                          onClick={() => markSent(msg.id)}
                          className="flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-400 transition-colors"
                        >
                          <Send className="w-3 h-3" />
                          Send
                        </button>
                      )}
                      {msg.status === "sent" && (
                        <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                          <CheckCheck className="w-3 h-3" />
                          Sent
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
