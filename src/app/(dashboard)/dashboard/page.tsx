import { db } from "@/lib/db";
import { MetricStrip } from "@/components/dashboard/MetricStrip";
import { CostChart } from "@/components/dashboard/CostChart";
import { SessionsTable } from "@/components/dashboard/SessionsTable";
import { TopAgents } from "@/components/dashboard/TopAgents";
import { RangePicker } from "@/components/dashboard/RangePicker";
import { getServerAuthContext } from "@/lib/auth";
import { redirect } from "next/navigation";

// This is a server component — data fetched at request time, no client JS needed
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const range = params.range ?? "24h";
  const since = getRangeStart(range);

  const ctx = await getServerAuthContext();
  if (!ctx) redirect("/login");
  const workspaceId = ctx.workspace.id;

  const [costResult, sessionStats, topAgentsRaw, errorCount, recentSessions, costSeries, latencyResult] =
    await Promise.all([
      db.event.aggregate({
        where: { workspaceId, occurredAt: { gte: since } },
        _sum: { costUsd: true, tokensIn: true, tokensOut: true },
        _count: { id: true },
      }),
      db.agentSession.groupBy({
        by: ["status"],
        where: { workspaceId, startedAt: { gte: since } },
        _count: { id: true },
      }),
      db.event.groupBy({
        by: ["agentId"],
        where: { workspaceId, occurredAt: { gte: since }, costUsd: { gt: 0 } },
        _sum: { costUsd: true },
        orderBy: { _sum: { costUsd: "desc" } },
        take: 5,
      }),
      db.event.count({
        where: { workspaceId, type: "ERROR", occurredAt: { gte: since } },
      }),
      db.agentSession.findMany({
        where: { workspaceId },
        include: { agent: { select: { name: true } } },
        orderBy: { startedAt: "desc" },
        take: 8,
      }),
      db.$queryRaw<{ label: string; cost: number }[]>`
        SELECT
          to_char(date_trunc('hour', "occurredAt"), 'HH24:00') AS label,
          COALESCE(SUM("costUsd"), 0)::float AS cost
        FROM "Event"
        WHERE "workspaceId" = ${workspaceId}
          AND "occurredAt" >= ${since}
        GROUP BY date_trunc('hour', "occurredAt")
        ORDER BY date_trunc('hour', "occurredAt") ASC
      `,
      db.event.aggregate({
        where: { workspaceId, type: "LLM_CALL", occurredAt: { gte: since } },
        _avg: { latencyMs: true },
      }),
    ]);

  const totalSessions = sessionStats.reduce((a, s) => a + s._count.id, 0);
  const failedSessions = sessionStats.find((s) => s.status === "FAILED")?._count.id ?? 0;

  const agentIds = topAgentsRaw.map((a) => a.agentId);
  const agentNames = await db.agent.findMany({
    where: { id: { in: agentIds } },
    select: { id: true, name: true },
  });
  const agentMap = Object.fromEntries(agentNames.map((a) => [a.id, a.name]));

  const topAgents = topAgentsRaw.map((a) => ({
    id: a.agentId,
    name: agentMap[a.agentId] ?? "Unknown",
    costUsd: a._sum.costUsd ?? 0,
  }));

  const totalCost = costResult._sum.costUsd ?? 0;
  const totalTokens = (costResult._sum.tokensIn ?? 0) + (costResult._sum.tokensOut ?? 0);

  const avgCostPerSession = totalSessions > 0 ? totalCost / totalSessions : 0;
  const avgLatency = latencyResult._avg.latencyMs ?? 0;

  return (
    <div className="p-5 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-lg font-semibold text-t-primary">Overview</h1>
          <p className="text-[11px] font-mono text-t-ghost">
            Agent activity in the last {rangeLabel(range)}
          </p>
        </div>
        <RangePicker current={range} />
      </div>

      {/* Metric strip */}
      <div className="mb-5">
        <MetricStrip
          metrics={[
            {
              label: "Unit Economics",
              value: `$${avgCostPerSession.toFixed(4)}`,
              sub: "avg cost per session",
              color: "green",
            },
            {
              label: "Avg Latency",
              value: `${avgLatency.toFixed(0)}ms`,
              sub: "per LLM call",
              color: avgLatency > 2000 ? "amber" : "cyan",
            },
            {
              label: "Total cost",
              value: `$${totalCost.toFixed(4)}`,
              sub: `${formatNumber(costResult._sum.tokensIn ?? 0)} tokens in`,
              color: "default",
            },
            {
              label: "Sessions",
              value: String(totalSessions),
              sub: failedSessions > 0 ? `${failedSessions} failed` : "all healthy",
              color: failedSessions > 0 ? "red" : "default",
            },
            {
              label: "Errors",
              value: String(errorCount),
              sub:
                totalSessions > 0
                  ? `${((failedSessions / totalSessions) * 100).toFixed(1)}% failure rate`
                  : "—",
              color: errorCount > 0 ? "red" : "green",
            },
          ]}
        />
      </div>

      {/* Chart + Top agents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-5">
        <div className="lg:col-span-2">
          <CostChart data={costSeries.map((r) => ({ label: r.label, costUsd: r.cost }))} />
        </div>
        <TopAgents agents={topAgents} />
      </div>

      {/* Recent sessions */}
      <SessionsTable sessions={recentSessions} />
    </div>
  );
}

function getRangeStart(range: string): Date {
  const now = new Date();
  switch (range) {
    case "7d":
      return new Date(now.getTime() - 7 * 86400_000);
    case "30d":
      return new Date(now.getTime() - 30 * 86400_000);
    default:
      return new Date(now.getTime() - 86400_000);
  }
}

function rangeLabel(range: string): string {
  return { "24h": "24 hours", "7d": "7 days", "30d": "30 days" }[range] ?? "24 hours";
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
