import { db } from "@/lib/db";
import Link from "next/link";
import { getServerAuthContext } from "@/lib/auth";
import { redirect } from "next/navigation";

const PLAN_LIMITS = {
  FREE: { events: Infinity, agents: Infinity, label: "Free (Unlimited)" },
  TEAM: { events: Infinity, agents: Infinity, label: "Free (Unlimited)" },
  SCALE: { events: Infinity, agents: Infinity, label: "Free (Unlimited)" },
};

export default async function UsagePage() {
  const ctx = await getServerAuthContext();
  if (!ctx) redirect("/login");

  const workspaceId = ctx.workspace.id;
  const plan = ctx.workspace.plan;
  const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.FREE;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [eventCount, agentCount, tokenResult, costResult, dailySeries] = await Promise.all([
    db.event.count({
      where: { workspaceId, occurredAt: { gte: startOfMonth } },
    }),
    db.agent.count({ where: { workspaceId } }),
    db.event.aggregate({
      where: { workspaceId, occurredAt: { gte: startOfMonth } },
      _sum: { tokensIn: true, tokensOut: true },
    }),
    db.event.aggregate({
      where: { workspaceId, occurredAt: { gte: startOfMonth } },
      _sum: { costUsd: true },
    }),
    // Daily events this month
    db.$queryRaw<{ day: string; count: number; cost: number }[]>`
      SELECT
        to_char(date_trunc('day', "occurredAt"), 'Mon DD') AS day,
        COUNT(*)::int                                       AS count,
        COALESCE(SUM("costUsd"), 0)::float                  AS cost
      FROM "Event"
      WHERE "workspaceId" = ${workspaceId}
        AND "occurredAt" >= ${startOfMonth}
      GROUP BY date_trunc('day', "occurredAt")
      ORDER BY date_trunc('day', "occurredAt") ASC
    `,
  ]);

  const eventPct = limits.events === Infinity ? 0 : Math.min(100, (eventCount / limits.events) * 100);
  const agentPct = limits.agents === Infinity ? 0 : Math.min(100, (agentCount / limits.agents) * 100);
  const totalTokens = (tokenResult._sum.tokensIn ?? 0) + (tokenResult._sum.tokensOut ?? 0);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Usage</h1>
        <p className="text-sm text-gray-500">
          Current billing period:{" "}
          {startOfMonth.toLocaleString("default", { month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Plan badge */}
      <div className="flex items-center justify-between bg-violet-50 border border-violet-100 rounded-xl px-4 py-3">
        <div>
          <p className="text-xs text-violet-500 font-medium">Current plan</p>
          <p className="text-sm font-semibold text-violet-900">{limits.label}</p>
        </div>
      </div>

      {/* Usage meters */}
      <div className="space-y-4">
        <UsageMeter
          label="Events this month"
          used={eventCount}
          limit={limits.events}
          pct={eventPct}
          format={(n) => n.toLocaleString()}
        />
        <UsageMeter
          label="Agents"
          used={agentCount}
          limit={limits.agents}
          pct={agentPct}
          format={(n) => String(n)}
        />
      </div>

      {/* Cost + tokens summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Cost this month</p>
          <p className="text-2xl font-semibold">${(costResult._sum.costUsd ?? 0).toFixed(4)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Tokens this month</p>
          <p className="text-2xl font-semibold">{fmtNum(totalTokens)}</p>
        </div>
      </div>

      {/* Daily breakdown table */}
      <div>
        <h2 className="text-sm font-medium text-gray-700 mb-3">Daily breakdown</h2>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {dailySeries.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No events yet this month</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-2.5 font-normal">Day</th>
                  <th className="text-right px-4 py-2.5 font-normal">Events</th>
                  <th className="text-right px-4 py-2.5 font-normal">Cost</th>
                </tr>
              </thead>
              <tbody>
                {dailySeries.map((row) => (
                  <tr key={row.day} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-2.5 text-gray-700">{row.day}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs text-gray-600">
                      {row.count.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs text-gray-600">
                      ${row.cost.toFixed(5)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function UsageMeter({
  label,
  used,
  limit,
  pct,
  format,
}: {
  label: string;
  used: number;
  limit: number;
  pct: number;
  format: (n: number) => string;
}) {
  const isUnlimited = limit === Infinity;
  const isWarning = pct >= 80;
  const isDanger = pct >= 95;

  const barColor = isDanger ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-violet-500";

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xs font-medium text-gray-700">
          {format(used)}
          {!isUnlimited && <span className="text-gray-400 font-normal"> / {format(limit)}</span>}
        </p>
      </div>
      {!isUnlimited && (
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
      {isUnlimited && <div className="h-1.5 bg-violet-100 rounded-full" />}
      {isDanger && !isUnlimited && (
        <p className="text-xs text-red-500 mt-1.5">
          Approaching limit — upgrade to avoid dropped events
        </p>
      )}
    </div>
  );
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
