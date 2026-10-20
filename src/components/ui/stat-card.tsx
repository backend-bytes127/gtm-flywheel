import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  className?: string;
}

export function StatCard({ label, value, sub, accent, className }: StatCardProps) {
  return (
    <div className={cn("rounded-xl bg-[#111111] border border-[#1f1f1f] p-5 flex flex-col gap-1", className)}>
      <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">{label}</p>
      <p className={cn("text-3xl font-bold", accent ?? "text-white")}>{value}</p>
      {sub && <p className="text-xs text-zinc-500">{sub}</p>}
    </div>
  );
}
