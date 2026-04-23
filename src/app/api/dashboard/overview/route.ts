import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { workspace } = ctx;
  const { searchParams } = new URL(req.url);

  // Default: last 24 hours. Support ?range=7d | 30d | 90d
  const range = searchParams.get("range") ?? "24h";
  const since = getRangeStart(range);

  const [
    costResult,
    sessionStats,
    topAgents,
    errorRate,
    costSeries,
  ] = await Promise.all([
    // Total cost in range
    db.event.aggregate({
      where: { workspaceId: workspace.id, occurredAt: { gte: since } },
      _sum: { costUsd: true, tokensIn: true, tokensOut: true },
      _count: { id: true },
    }),

    // Session counts by status
    db.agentSession.groupBy({
      by: ["status"],
      where: { workspaceId: workspace.id, startedAt: { gte: since } },
      _count: { id: true },
    }),

    // Top 5 agents by cost
    db.event.groupBy({
      by: ["agentId"],
      where: {
        workspaceId: workspace.id,
        occurredAt: { gte: since },
        costUsd: { gt: 0 },
      },
      _sum: { costUsd: true, tokensIn: true, tokensOut: true },
      _count: { id: true },
      orderBy: { _sum: { costUsd: "desc" } },
      take: 5,
    }),

    // Error count
    db.event.count({
      where: {
        workspaceId: workspace.id,
        type: "ERROR",
        occurredAt: { gte: since },
      },
    }),

    // Cost per hour (last 24h) or per day (7d/30d) for the chart
    getCostSeries(workspace.id, since, range),
  ]);

  // Enrich top agents with names
  const agentIds = topAgents.map((a) => a.agentId);
  const agents = await db.agent.findMany({
    where: { id: { in: agentIds } },
    select: { id: true, name: true, framework: true },
  });
  const agentMap = Object.fromEntries(agents.map((a) => [a.id, a]));

  const totalSessions = sessionStats.reduce((acc, s) => acc + s._count.id, 0);
  const failedSessions =
    sessionStats.find((s) => s.status === "FAILED")?._count.id ?? 0;

  return NextResponse.json({
    range,
    since: since.toISOString(),
    totals: {
      costUsd: costResult._sum.costUsd ?? 0,
      tokensIn: costResult._sum.tokensIn ?? 0,
      tokensOut: costResult._sum.tokensOut ?? 0,
      events: costResult._count.id,
      sessions: totalSessions,
      errors: errorRate,
      failedSessions,
      errorRate: totalSessions > 0 ? failedSessions / totalSessions : 0,
    },
    topAgents: topAgents.map((a) => ({
      agent: agentMap[a.agentId] ?? { id: a.agentId, name: "Unknown" },
      costUsd: a._sum.costUsd ?? 0,
      tokensIn: a._sum.tokensIn ?? 0,
      tokensOut: a._sum.tokensOut ?? 0,
      events: a._count.id,
    })),
    costSeries,
  });
}

function getRangeStart(range: string): Date {
  const now = new Date();
  switch (range) {
    case "7d":
      return new Date(now.getTime() - 7 * 86400_000);
    case "30d":
      return new Date(now.getTime() - 30 * 86400_000);
    case "90d":
      return new Date(now.getTime() - 90 * 86400_000);
    default:
      return new Date(now.getTime() - 86400_000); // 24h
  }
}

async function getCostSeries(
  workspaceId: string,
  since: Date,
  range: string
): Promise<{ label: string; costUsd: number }[]> {
  // Use raw SQL for time-series bucketing — Prisma doesn't support date_trunc natively
  const bucket = range === "24h" ? "hour" : "day";

  const rows = await db.$queryRaw<{ label: string; cost: number }[]>`
    SELECT
      to_char(date_trunc(${bucket}, "occurredAt"), 
        CASE WHEN ${bucket} = 'hour' THEN 'HH24:00' ELSE 'Mon DD' END
      ) AS label,
      COALESCE(SUM("costUsd"), 0)::float AS cost
    FROM "Event"
    WHERE "workspaceId" = ${workspaceId}
      AND "occurredAt" >= ${since}
    GROUP BY date_trunc(${bucket}, "occurredAt")
    ORDER BY date_trunc(${bucket}, "occurredAt") ASC
  `;

  return rows.map((r) => ({ label: r.label, costUsd: r.cost }));
}
