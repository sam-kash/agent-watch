"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/sessions", label: "Sessions" },
  { href: "/agents", label: "Agents" },
  { href: "/insights", label: "Insights ⚡" },
  { href: "/alerts", label: "Alerts" },
  { href: "/settings", label: "Settings" },
];

type Props = {
  workspaceName: string;
  plan: string;
  runningAgents?: number;
};

export function CommandBar({ workspaceName, plan, runningAgents = 0 }: Props) {
  const pathname = usePathname();

  return (
    <header className="flex-shrink-0 sticky top-0 z-50 px-6 py-4">
      <div className="glass-pill px-6 max-w-[1600px] mx-auto flex items-center h-14 transition-all">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-3 mr-12 group">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-active-border to-orange-400 shadow-sm flex items-center justify-center transition-transform group-hover:scale-105">
            <div className="w-2 h-2 bg-white rounded-full shadow-inner" />
          </div>
          <span className="font-semibold text-t-primary tracking-tight group-hover:text-active-border transition-colors">
            AgentWatch
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-2 flex-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-4 py-1.5 text-[13px] font-medium rounded-full transition-all ${
                  isActive
                    ? "text-white bg-white/10 shadow-inner"
                    : "text-t-secondary hover:text-t-primary hover:bg-white/5"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Status strip */}
        <div className="flex items-center gap-6 text-[13px] font-medium">
          {runningAgents > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-acc-green/10 border border-acc-green/20">
              <span className="w-2 h-2 rounded-full bg-acc-green shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
              <span className="text-acc-green text-xs font-semibold">{runningAgents} Online</span>
            </div>
          )}
          <div className="flex items-center gap-2 border-l border-dim-border pl-6">
            <span className="text-t-primary">{workspaceName}</span>
          </div>
          <span className="px-3 py-1 rounded-full bg-active-border/10 border border-active-border/20 text-active-border text-xs font-semibold uppercase tracking-wider">
            {plan}
          </span>
        </div>
      </div>
    </header>
  );
}
