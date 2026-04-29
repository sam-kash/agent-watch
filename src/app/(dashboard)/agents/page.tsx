import { db } from "@/lib/db";
import Link from "next/link";
import { CreateAgentButton } from "@/components/agents/CreateAgentButton";
import { getServerAuthContext } from "@/lib/auth";
import { redirect } from "next/navigation";

const FRAMEWORK_COLORS: Record<string, string> = {
  openai: "bg-green-50 text-green-700",
  langchain: "bg-blue-50 text-blue-700",
  anthropic: "bg-violet-50 text-violet-700",
  custom: "bg-gray-100 text-gray-600",
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
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold">Agents</h1>
          <p className="text-sm text-gray-500">
            {agents.length} agent{agents.length !== 1 ? "s" : ""} registered
          </p>
        </div>
        <CreateAgentButton />
      </div>

      {agents.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl py-16 text-center">
          <p className="text-sm text-gray-400 mb-2">No agents yet</p>
          <p className="text-xs text-gray-400">Create an agent to get its ID for the SDK</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {enriched.map((agent) => (
            <div
              key={agent.id}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-medium text-gray-900">{agent.name}</h3>
                    {agent.framework && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          FRAMEWORK_COLORS[agent.framework] ?? FRAMEWORK_COLORS.custom
                        }`}
                      >
                        {agent.framework}
                      </span>
                    )}
                  </div>
                  {agent.description && (
                    <p className="text-xs text-gray-400 mb-3 truncate">{agent.description}</p>
                  )}
                  {/* Agent ID for SDK */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Agent ID:</span>
                    <code className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                      {agent.id}
                    </code>
                  </div>
                </div>

                {/* 7d stats */}
                <div className="flex gap-6 ml-6 flex-shrink-0">
                  {[
                    { label: "7d cost", value: `$${agent.cost7d.toFixed(4)}` },
                    { label: "7d sessions", value: String(agent.sessions7d) },
                    { label: "7d errors", value: String(agent.errors7d), red: agent.errors7d > 0 },
                    { label: "all time", value: `${agent._count.sessions} runs` },
                  ].map((stat) => (
                    <div key={stat.label} className="text-right">
                      <p className="text-xs text-gray-400">{stat.label}</p>
                      <p
                        className={`text-sm font-medium ${
                          stat.red ? "text-red-500" : "text-gray-800"
                        }`}
                      >
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick links */}
              <div className="mt-3 pt-3 border-t border-gray-100 flex gap-4">
                <Link
                  href={`/sessions?agentId=${agent.id}`}
                  className="text-xs text-violet-600 hover:underline"
                >
                  View sessions →
                </Link>
                <Link
                  href={`/dashboard?agentId=${agent.id}`}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Analytics →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
