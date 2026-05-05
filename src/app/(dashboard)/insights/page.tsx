import { db } from "@/lib/db";
import { getServerAuthContext } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

type Insight = {
  id: string;
  type: "COST" | "PERFORMANCE" | "RELIABILITY";
  title: string;
  description: string;
  action: string;
  impact: string;
  agentName?: string;
  icon: string;
  color: string;
};

export default async function InsightsPage() {
  const ctx = await getServerAuthContext();
  if (!ctx) redirect("/login");

  const workspaceId = ctx.workspace.id;

  // ── 1. Deep dive DB Analytics ─────────────────────────────────────────────
  
  // Model usage by Agent
  const agentModels = await db.event.groupBy({
    by: ["agentId", "model"],
    where: { workspaceId, type: "LLM_CALL", model: { not: null } },
    _sum: { costUsd: true, tokensIn: true, tokensOut: true },
    _avg: { latencyMs: true },
    _count: { id: true },
  });

  // Slowest tools
  const slowTools = await db.event.groupBy({
    by: ["agentId", "toolName"],
    where: { workspaceId, type: "TOOL_CALL", toolName: { not: null } },
    _avg: { latencyMs: true },
    _count: { id: true },
    having: { latencyMs: { _avg: { gt: 1000 } } }, // Only tools taking > 1s
  });

  // Frequent errors
  const errors = await db.event.groupBy({
    by: ["agentId", "errorMsg"],
    where: { workspaceId, type: "ERROR", errorMsg: { not: null } },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 3,
  });

  // Fetch agent names for mapping
  const agents = await db.agent.findMany({ where: { workspaceId } });
  const getAgentName = (id: string) => agents.find((a) => a.id === id)?.name ?? "Unknown Agent";

  // ── 2. Dynamically Generate Insights ──────────────────────────────────────
  const insights: Insight[] = [];

  // A. Analyze Models for Cost & Performance
  agentModels.forEach((stat) => {
    const model = stat.model!.toLowerCase();
    const cost = stat._sum.costUsd ?? 0;
    const calls = stat._count.id;
    const latency = stat._avg.latencyMs ?? 0;
    const agentName = getAgentName(stat.agentId);

    // Insight: Downgrade Heavy Models
    if ((model.includes("gpt-4") || model.includes("claude-3-opus")) && !model.includes("mini") && cost > 0) {
      const estimatedSavings = cost * 0.85; // Roughly 85% cheaper to move to mini/haiku
      insights.push({
        id: `cost-${stat.agentId}-${model}`,
        type: "COST",
        title: `Downgrade ${model} to a faster, cheaper variant`,
        description: `Your agent is using ${model} heavily (${calls} calls). For many routing, extraction, and synthesis tasks, a smaller model performs just as well.`,
        action: `Switch to gpt-4o-mini or claude-3-haiku in the agent's LLM router.`,
        impact: `Est. Savings: $${estimatedSavings.toFixed(4)}`,
        agentName,
        icon: "💸",
        color: "blue",
      });
    }

    // Insight: High Latency / Streaming
    if (latency > 2000) {
      insights.push({
        id: `lat-${stat.agentId}-${model}`,
        type: "PERFORMANCE",
        title: `High Time-To-First-Token on ${model}`,
        description: `Average latency for this model is ${(latency / 1000).toFixed(1)}s, causing users to wait too long for the AI to start typing.`,
        action: `Enable streaming (SSE) to send chunks instantly, and utilize Prompt Caching for the system prompt.`,
        impact: `Improve UX significantly`,
        agentName,
        icon: "⏳",
        color: "amber",
      });
    }
  });

  // B. Analyze Tools for Bottlenecks
  slowTools.forEach((tool) => {
    const avgLat = tool._avg.latencyMs ?? 0;
    const agentName = getAgentName(tool.agentId);
    
    insights.push({
      id: `tool-${tool.agentId}-${tool.toolName}`,
      type: "PERFORMANCE",
      title: `Tool Bottleneck: ${tool.toolName}`,
      description: `The tool "${tool.toolName}" takes an average of ${(avgLat / 1000).toFixed(1)}s to execute. This is blocking the agent's reasoning loop.`,
      action: `Cache the output of ${tool.toolName} if data isn't highly volatile, or optimize the underlying database query.`,
      impact: `Reduce total session time by ${(avgLat / 1000).toFixed(1)}s`,
      agentName,
      icon: "⚙️",
      color: "purple",
    });
  });

  // C. Analyze Errors for Reliability
  errors.forEach((err) => {
    const agentName = getAgentName(err.agentId);
    insights.push({
      id: `err-${err.agentId}-${err.errorMsg?.substring(0, 10)}`,
      type: "RELIABILITY",
      title: `Recurring Agent Failure`,
      description: `The error "${err.errorMsg}" has occurred ${err._count.id} times. This is actively breaking user sessions.`,
      action: `Implement fallback routing (e.g., try another provider if rate limited) and wrap the LLM call in a retry loop.`,
      impact: `Prevent ${err._count.id} session crashes`,
      agentName,
      icon: "🛡️",
      color: "red",
    });
  });

  // Sort insights: Reliability first, then Cost, then Performance
  const order = { RELIABILITY: 1, COST: 2, PERFORMANCE: 3 };
  insights.sort((a, b) => order[a.type] - order[b.type]);

  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    amber: "bg-amber-50 text-amber-600 border-amber-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    red: "bg-red-50 text-red-600 border-red-200",
  };

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-t-primary mb-2 flex items-center gap-2">
          Dynamic Optimization Engine <span className="text-acc-blue text-xl">⚡</span>
        </h1>
        <p className="text-sm text-t-secondary max-w-2xl">
          We analyzed every token, tool call, and latency spike across your workspaces to generate custom, actionable blueprints.
        </p>
      </div>

      {insights.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-dim-border rounded-2xl bg-white/50">
          <span className="text-4xl mb-4 block">✨</span>
          <h3 className="font-bold text-lg mb-2">Your agents are highly optimized</h3>
          <p className="text-sm text-t-secondary">No major bottlenecks or cost leaks detected in recent traffic.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {insights.map((insight) => (
            <div key={insight.id} className="glass-panel p-5 relative overflow-hidden group hover:border-black transition-colors flex flex-col h-full bg-white">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                <span className="text-8xl grayscale">{insight.icon}</span>
              </div>
              
              <div className="flex items-center gap-2 mb-4">
                <span className={`px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase rounded-full border ${colorClasses[insight.color as keyof typeof colorClasses]}`}>
                  {insight.type}
                </span>
                {insight.agentName && (
                  <span className="text-[11px] font-medium text-t-ghost bg-slate-100 px-2 py-1 rounded">
                    {insight.agentName}
                  </span>
                )}
              </div>

              <h3 className="font-bold text-black text-lg mb-2 leading-snug pr-8">
                {insight.title}
              </h3>
              
              <p className="text-[13px] text-t-secondary mb-5 leading-relaxed flex-grow">
                {insight.description}
              </p>
              
              <div className="mt-auto space-y-2">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <p className="text-[11px] font-bold text-t-ghost uppercase mb-1">Recommended Action</p>
                  <p className="text-[13px] font-medium text-black">{insight.action}</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-acc-green bg-green-50/50 px-3 py-2 rounded-lg">
                  <span>📈</span> {insight.impact}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
