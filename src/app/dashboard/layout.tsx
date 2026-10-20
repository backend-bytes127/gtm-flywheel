"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Users, Zap, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard/flywheel", label: "Flywheel", icon: Activity },
  { href: "/dashboard/leads", label: "Leads", icon: Users },
  { href: "/dashboard/signals", label: "Signals", icon: Zap },
  { href: "/dashboard/outreach", label: "Outreach", icon: Send },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-[#111111] border-r border-[#1f1f1f] flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-[#1f1f1f]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">GTM Flywheel</p>
              <p className="text-[10px] text-zinc-500">Solo operator mode</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/20"
                    : "text-zinc-400 hover:bg-[#1a1a1a] hover:text-white border border-transparent"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-[#1f1f1f]">
          <div className="text-[10px] text-zinc-600 space-y-0.5">
            <p>Powered by Claude Sonnet</p>
            <p>+ n8n · Supabase · Slack</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-[#0a0a0a]">
        {children}
      </main>
    </div>
  );
}
