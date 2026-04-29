import Link from "next/link";
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerAuthContext } from "@/lib/auth";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: "▦" },
  { href: "/sessions", label: "Sessions", icon: "◈" },
  { href: "/agents", label: "Agents", icon: "⬡" },
  { href: "/alerts", label: "Alerts", icon: "◎" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const ctx = await getServerAuthContext();
  if (!ctx) redirect("/login");

  const plan = ctx.workspace.plan;
  const workspaceName = ctx.workspace.name;

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-gray-100">
          <span className="font-semibold text-sm tracking-tight">
            <span className="text-violet-600">●</span> AgentWatch
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <span className="text-xs opacity-60">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Workspace + plan footer */}
        <div className="px-4 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-600 font-medium truncate">{workspaceName}</p>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-xs text-gray-400">{plan} plan</span>
            {plan !== "SCALE" && (
              <Link href="/settings" className="text-xs text-violet-600 hover:underline">
                Upgrade →
              </Link>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
