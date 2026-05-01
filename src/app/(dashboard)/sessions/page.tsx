import { db } from "@/lib/db";
import Link from "next/link";
import { SessionsFilter } from "@/components/sessions/SessionsFilter";
import { getServerAuthContext } from "@/lib/auth";
import { redirect } from "next/navigation";

const STATUS_CONFIG: Record<string, { dot: string; border: string }> = {
  COMPLETED: { dot: "status-dot-completed", border: "border-l-acc-green" },
  RUNNING: { dot: "status-dot-running", border: "border-l-cyan" },
  FAILED: { dot: "status-dot-failed", border: "border-l-acc-red" },
  TIMEOUT: { dot: "status-dot-timeout", border: "border-l-amber" },
};

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; agentId?: string; search?: string }>;
}) {
  const params = await searchParams;
  const ctx = await getServerAuthContext();
  if (!ctx) redirect("/login");
  const workspaceId = ctx.workspace.id;
  const page = Math.max(1, parseInt(params.page ?? "1"));
  const limit = 25;
  const status = params.status;
  const agentId = params.agentId;

  const where = {
    workspaceId,
    ...(status && { status: status as any }),
    ...(agentId && { agentId }),
  };

  const [sessions, total, agents] = await Promise.all([
    db.agentSession.findMany({
      where,
      include: { agent: { select: { id: true, name: true } } },
      orderBy: { startedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.agentSession.count({ where }),
    db.agent.findMany({
      where: { workspaceId },
      select: { id: true, name: true },
    }),
  ]);

  const pages = Math.ceil(total / limit);

  return (
    <div className="p-5 max-w-7xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-lg font-semibold text-t-primary">Sessions</h1>
          <p className="text-[11px] font-mono text-t-ghost">{total} total sessions</p>
        </div>
      </div>

      <SessionsFilter agents={agents} current={params} />

      <div className="panel overflow-hidden mt-4">
        {sessions.length === 0 ? (
          <div className="py-16 text-center text-xs font-mono text-t-ghost">
            ◆ No sessions found. Try adjusting your filters.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                {[
                  "Session ID",
                  "Agent",
                  "Status",
                  "Cost",
                  "Tokens",
                  "Events",
                  "Errors",
                  "Duration",
                  "Started",
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => {
                const cfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.COMPLETED;
                return (
                  <tr key={s.id} className={`border-l-2 ${cfg.border}`}>
                    <td>
                      <Link
                        href={`/sessions/${s.id}`}
                        className="font-mono text-[11px] text-cyan hover:underline"
                      >
                        {s.id.slice(0, 14)}…
                      </Link>
                    </td>
                    <td className="text-[11px] text-t-secondary">{s.agent?.name ?? "—"}</td>
                    <td>
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`status-dot ${cfg.dot}`} />
                        <span className="text-[10px] text-t-secondary">
                          {s.status.toLowerCase()}
                        </span>
                      </span>
                    </td>
                    <td className="font-mono text-[11px] text-amber">
                      ${s.totalCostUsd.toFixed(5)}
                    </td>
                    <td className="text-[11px] text-t-ghost font-mono">
                      {((s.totalTokensIn + s.totalTokensOut) / 1000).toFixed(1)}K
                    </td>
                    <td className="text-[11px] text-t-ghost font-mono">{s.eventCount}</td>
                    <td>
                      <span
                        className={`text-[11px] font-mono ${
                          s.errorCount > 0 ? "text-acc-red font-medium" : "text-t-ghost"
                        }`}
                      >
                        {s.errorCount}
                      </span>
                    </td>
                    <td className="text-[11px] text-t-ghost font-mono">
                      {s.durationMs ? `${(s.durationMs / 1000).toFixed(1)}s` : "—"}
                    </td>
                    <td className="text-[11px] text-t-ghost font-mono">
                      {new Date(s.startedAt).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-[10px] font-mono text-t-ghost">
            Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
          </p>
          <div className="flex gap-1">
            {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`?${new URLSearchParams({ ...params, page: String(p) })}`}
                className={`px-3 py-1 rounded text-[10px] font-mono transition-all ${
                  p === page
                    ? "bg-cyan/10 text-cyan border border-cyan/20"
                    : "text-t-ghost border border-dim-border hover:text-t-secondary hover:border-glow-border"
                }`}
              >
                {p}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
