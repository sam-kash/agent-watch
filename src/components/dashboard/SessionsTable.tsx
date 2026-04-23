import Link from "next/link";

type Session = {
  id: string;
  status: string;
  startedAt: Date;
  totalCostUsd: number;
  totalTokensIn: number;
  totalTokensOut: number;
  errorCount: number;
  eventCount: number;
  agent: { name: string } | null;
};

const STATUS_STYLES: Record<string, string> = {
  COMPLETED: "bg-green-50 text-green-700",
  RUNNING: "bg-blue-50 text-blue-700",
  FAILED: "bg-red-50 text-red-700",
  TIMEOUT: "bg-amber-50 text-amber-700",
};

export function SessionsTable({ sessions }: { sessions: Session[] }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <p className="text-xs text-gray-400">Recent sessions</p>
        <Link href="/sessions" className="text-xs text-violet-600 hover:underline">
          View all →
        </Link>
      </div>

      {sessions.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-300">
          No sessions yet — integrate the SDK to start tracking
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-100">
              <th className="text-left px-4 py-2 font-normal">Session</th>
              <th className="text-left px-4 py-2 font-normal">Agent</th>
              <th className="text-left px-4 py-2 font-normal">Status</th>
              <th className="text-right px-4 py-2 font-normal">Cost</th>
              <th className="text-right px-4 py-2 font-normal">Events</th>
              <th className="text-right px-4 py-2 font-normal">Errors</th>
              <th className="text-right px-4 py-2 font-normal">Started</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr
                key={s.id}
                className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-2.5">
                  <Link
                    href={`/sessions/${s.id}`}
                    className="font-mono text-xs text-violet-600 hover:underline"
                  >
                    {s.id.slice(0, 12)}…
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-gray-700 text-xs">
                  {s.agent?.name ?? "—"}
                </td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[s.status] ?? "bg-gray-100 text-gray-500"}`}>
                    {s.status.toLowerCase()}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-xs text-gray-700">
                  ${s.totalCostUsd.toFixed(4)}
                </td>
                <td className="px-4 py-2.5 text-right text-xs text-gray-500">
                  {s.eventCount}
                </td>
                <td className="px-4 py-2.5 text-right text-xs">
                  <span className={s.errorCount > 0 ? "text-red-500" : "text-gray-400"}>
                    {s.errorCount}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right text-xs text-gray-400">
                  {new Date(s.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
