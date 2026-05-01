"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/sessions", label: "Sessions" },
  { href: "/agents", label: "Agents" },
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
    <header className="flex-shrink-0 border-b border-dim-border bg-white/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="flex items-center h-14 px-6 max-w-[1600px] mx-auto">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 mr-10 group">
          <div className="w-5 h-5 rounded-[5px] bg-black shadow-md flex items-center justify-center transition-transform group-hover:scale-105">
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
          <span className="font-display text-[15px] font-bold tracking-tight text-t-primary group-hover:text-acc-blue transition-colors">
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
                className={`relative px-4 py-1.5 text-[13px] font-semibold rounded-md transition-all ${
                  isActive
                    ? "text-acc-blue bg-acc-blue/10 shadow-sm"
                    : "text-t-secondary hover:text-black hover:bg-slate-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Status strip */}
        <div className="flex items-center gap-5 text-[13px] font-semibold">
          {runningAgents > 0 && (
            <div className="flex items-center gap-2 bg-white border border-dim-border shadow-sm px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-acc-green shadow-[0_0_8px_var(--color-acc-green)] animate-pulse" />
              <span className="text-t-primary text-xs">
                {runningAgents} active
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-gradient-to-tr from-acc-blue to-acc-violet opacity-90 shadow-sm" />
            <span className="text-t-primary">{workspaceName}</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wide bg-slate-100 border border-dim-border text-t-secondary uppercase">
            {plan}
          </span>
        </div>
      </div>
    </header>
  );
}
