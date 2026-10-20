import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "blue" | "yellow" | "green" | "red" | "purple" | "emerald" | "slate" | "orange";
  className?: string;
}

const variants: Record<string, string> = {
  default: "bg-zinc-800 text-zinc-300 border-zinc-700",
  blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  green: "bg-green-500/10 text-green-400 border-green-500/20",
  red: "bg-red-500/10 text-red-400 border-red-500/20",
  purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  slate: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  orange: "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", variants[variant], className)}>
      {children}
    </span>
  );
}
