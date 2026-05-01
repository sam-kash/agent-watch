import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerAuthContext } from "@/lib/auth";
import { CommandBar } from "@/components/layout/CommandBar";
import { LiveTicker } from "@/components/layout/LiveTicker";
import { db } from "@/lib/db";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const ctx = await getServerAuthContext();
  if (!ctx) redirect("/login");

  const plan = ctx.workspace.plan;
  const workspaceName = ctx.workspace.name;

  // Count running sessions for the status indicator
  const runningCount = await db.agentSession.count({
    where: { workspaceId: ctx.workspace.id, status: "RUNNING" },
  });

  return (
    <div className="flex flex-col h-screen bg-void text-t-primary">
      <CommandBar
        workspaceName={workspaceName}
        plan={plan}
        runningAgents={runningCount}
      />
      <LiveTicker />
      <main className="flex-1 overflow-y-auto scrollbar-thin">{children}</main>
    </div>
  );
}
