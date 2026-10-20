import { Badge } from "@/components/ui/badge";
import type { LeadStage } from "@/types";

const stageConfig: Record<LeadStage, { label: string; variant: "slate" | "blue" | "yellow" | "purple" | "green" | "emerald" | "red" | "orange" | "default" }> = {
  new: { label: "New", variant: "slate" },
  enriched: { label: "Enriched", variant: "blue" },
  scored: { label: "Scored", variant: "yellow" },
  outreach_sent: { label: "Outreach Sent", variant: "purple" },
  replied: { label: "Replied", variant: "green" },
  call_booked: { label: "Call Booked", variant: "emerald" },
  won: { label: "Won", variant: "green" },
  lost: { label: "Lost", variant: "red" },
  nurture: { label: "Nurture", variant: "orange" },
};

export function StageBadge({ stage }: { stage: LeadStage }) {
  const config = stageConfig[stage] ?? { label: stage, variant: "default" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
