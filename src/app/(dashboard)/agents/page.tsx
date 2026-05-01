import { db } from "@/lib/db";
import Link from "next/link";
import { CreateAgentButton } from "@/components/agents/CreateAgentButton";
import { getServerAuthContext } from "@/lib/auth";
import { redirect } from "next/navigation";

const FRAMEWORK_COLORS: Record<string, string> = {
  openai: "bg-acc-green/10 text-acc-green border-acc-green/20",
  langchain: "bg-acc-blue/10 text-acc-blue border-acc-blue/20",
  anthropic: "bg-acc-violet/10 text-acc-violet border-acc-violet/20",
  custom: "bg-elevated text-t-ghost border-dim-border",
};

export default async function AgentsPage() {
  const ctx = await getServerAuthContext();
  if (!ctx) redirect("/login");
  const workspaceId = ctx.workspace.id;
  const since = new Date();
  since.setDate(since.getDate() - 7);

  const agents = await db.agent.findMany({
    where: { workspaceId },
    include: {
      _count: { select: { sessions: true, events: true } },
      sessions: {
        where: { startedAt: { gte: since } },
        select: { totalCostUsd: true, status: true, errorCount: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Compute 7d stats per agent
  const enriched = agents.map((agent) => {
    const cost7d = agent.sessions.reduce((a, s) => a + s.totalCostUsd, 0);
    const errors7d = agent.sessions.reduce((a, s) => a + s.errorCount, 0);
    const failed7d = agent.sessions.filter((s) => s.status === "FAILED").length;
    return { ...agent, cost7d, errors7d, failed7d, sessions7d: agent.sessions.length };
  });

  return (
    <div className="p-5 max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-lg font-semibold text-t-primary">Agents</h1>
          <p className="text-[11px] font-mono text-t-ghost">
            {agents.length} agent{agents.length !== 1 ? "s" : ""} registered
          </p>
        </div>
        <CreateAgentButton />
      </div>

      {agents.length === 0 ? (
        <div className="panel border-dashed py-16 text-center">
          <p className="text-xs font-mono text-t-ghost mb-1">◆ No agents yet</p>
          <p className="text-[10px] font-mono text-t-ghost">Create an agent to get its ID for the SDK</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {enriched.map((agent) => (
            <div
              key={agent.id}
              className="panel p-0 overflow-hidden hover:border-glow-border transition-all duration-200 group"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-dim-border/50">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-cyan flex-shrink-0" />
                  <h3 className="text-sm font-display font-semibold text-t-primary truncate group-hover:text-cyan transition-colors">
                    {agent.name}
                  </h3>
                  {agent.framework && (
                    <span
                      className={`text-[9px] font-mono font-medium tracking-wider px-2 py-0.5 rounded border ${
                        FRAMEWORK_COLORS[agent.framework] ?? FRAMEWORK_COLORS.custom
                      }`}
                    >
                      {agent.framework.toUpperCase()}
                    </span>
                  )}
                </div>
                {agent.description && (
                  <p className="text-[10px] font-mono text-t-ghost truncate max-w-xs">
                    {agent.description}
                  </p>
                )}
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-4 divide-x divide-dim-border/50">
                {[
                  { label: "7d cost", value: `$${agent.cost7d.toFixed(4)}`, color: "text-amber" },
                  { label: "7d sessions", value: String(agent.sessions7d), color: "text-t-primary" },
                  { label: "7d errors", value: String(agent.errors7d), color: agent.errors7d > 0 ? "text-acc-red" : "text-acc-green" },
                  { label: "all time", value: `${agent._count.sessions} runs`, color: "text-t-secondary" },
                ].map((stat) => (
                  <div key={stat.label} className="px-5 py-3">
                    <p className="text-[9px] font-mono text-t-ghost uppercase tracking-wider mb-0.5">{stat.label}</p>
                    <p className={`text-sm font-mono font-medium ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-5 py-2.5 border-t border-dim-border/50 bg-elevated/30">
                {/* Agent ID */}
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-t-ghost uppercase tracking-wider">ID</span>
                  <code className="text-[10px] font-mono bg-void px-2 py-0.5 rounded border border-dim-border text-cyan/70">
                    {agent.id}
                  </code>
                </div>
                <div className="flex gap-4">
                  <Link
                    href={`/sessions?agentId=${agent.id}`}
                    className="text-[10px] font-mono text-cyan hover:underline"
                  >
                    Sessions →
                  </Link>
                  <Link
                    href={`/dashboard?agentId=${agent.id}`}
                    className="text-[10px] font-mono text-t-ghost hover:text-t-secondary"
                  >
                    Analytics →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
