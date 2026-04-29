import { db } from "@/lib/db";
import { MetricCard } from "@/components/dashboard/MetricCard";
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
  searchParams: { range?: string };
}) {
  const range = searchParams.range ?? "24h";
  const since = getRangeStart(range);

  const ctx = await getServerAuthContext();
  if (!ctx) redirect("/login");
  const workspaceId = ctx.workspace.id;

  const [costResult, sessionStats, topAgentsRaw, errorCount, recentSessions, costSeries] =
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold">Overview</h1>
          <p className="text-sm text-gray-500">What your agents did in the last {rangeLabel(range)}</p>
        </div>
        <RangePicker current={range} />
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          label="Total cost"
          value={`$${(costResult._sum.costUsd ?? 0).toFixed(4)}`}
          sub={`${formatNumber(costResult._sum.tokensIn ?? 0)} tokens in`}
        />
        <MetricCard
          label="Sessions"
          value={String(totalSessions)}
          sub={`${failedSessions} failed`}
          subColor={failedSessions > 0 ? "red" : "gray"}
        />
        <MetricCard label="LLM calls" value={formatNumber(costResult._count.id)} sub="events tracked" />
        <MetricCard
          label="Errors"
          value={String(errorCount)}
          sub={
            totalSessions > 0
              ? `${((failedSessions / totalSessions) * 100).toFixed(1)}% session failure rate`
              : "—"
          }
          subColor={errorCount > 0 ? "red" : "gray"}
        />
      </div>

      {/* Chart + Top agents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
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
