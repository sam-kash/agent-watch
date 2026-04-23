import { db } from "@/lib/db";
import Link from "next/link";
import { SessionsFilter } from "@/components/sessions/SessionsFilter";

const STATUS_STYLES: Record<string, string> = {
  COMPLETED: "bg-green-50 text-green-700",
  RUNNING: "bg-blue-50 text-blue-700",
  FAILED: "bg-red-50 text-red-700",
  TIMEOUT: "bg-amber-50 text-amber-700",
};

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: { page?: string; status?: string; agentId?: string; search?: string };
}) {
  const WORKSPACE_ID = process.env.SEED_WORKSPACE_ID ?? "demo";
  const page = Math.max(1, parseInt(searchParams.page ?? "1"));
  const limit = 25;
  const status = searchParams.status;
  const agentId = searchParams.agentId;

  const where = {
    workspaceId: WORKSPACE_ID,
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
      where: { workspaceId: WORKSPACE_ID },
      select: { id: true, name: true },
    }),
  ]);

  const pages = Math.ceil(total / limit);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold">Sessions</h1>
          <p className="text-sm text-gray-500">{total} total sessions</p>
        </div>
      </div>

      <SessionsFilter agents={agents} current={searchParams} />

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mt-4">
        {sessions.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">
            No sessions found. Try adjusting your filters.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-100 bg-gray-50">
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
                  <th key={h} className="text-left px-4 py-2.5 font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/sessions/${s.id}`}
                      className="font-mono text-xs text-violet-600 hover:underline"
                    >
                      {s.id.slice(0, 14)}…
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700">{s.agent?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        STATUS_STYLES[s.status] ?? "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {s.status.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">
                    ${s.totalCostUsd.toFixed(5)}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {((s.totalTokensIn + s.totalTokensOut) / 1000).toFixed(1)}K
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{s.eventCount}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className={s.errorCount > 0 ? "text-red-500 font-medium" : "text-gray-400"}>
                      {s.errorCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {s.durationMs ? `${(s.durationMs / 1000).toFixed(1)}s` : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(s.startedAt).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-400">
            Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
          </p>
          <div className="flex gap-1">
            {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`?${new URLSearchParams({ ...searchParams, page: String(p) })}`}
                className={`px-3 py-1 rounded text-xs ${
                  p === page
                    ? "bg-violet-600 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
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
