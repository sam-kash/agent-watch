type Session = {
  totalCostUsd: number;
  totalTokensIn: number;
  totalTokensOut: number;
  eventCount: number;
  errorCount: number;
  durationMs: number | null;
  startedAt: Date;
  endedAt: Date | null;
  agent: { name: string; framework: string | null };
};

export function SessionSummaryCard({
  session,
  summary,
}: {
  session: Session;
  summary: string;
}) {
  const metrics = [
    { label: "Cost", value: `$${session.totalCostUsd.toFixed(5)}` },
    { label: "Tokens in", value: fmtNum(session.totalTokensIn) },
    { label: "Tokens out", value: fmtNum(session.totalTokensOut) },
    { label: "Events", value: String(session.eventCount) },
    { label: "Errors", value: String(session.errorCount), red: session.errorCount > 0 },
    { label: "Duration", value: session.durationMs ? `${(session.durationMs / 1000).toFixed(2)}s` : "—" },
  ];

  return (
    <div className="space-y-3">
      <div className="bg-violet-50 border border-violet-100 rounded-xl px-4 py-3">
        <p className="text-xs text-violet-500 font-medium mb-1">Summary</p>
        <p className="text-sm text-violet-900">{summary}</p>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className="bg-white border border-gray-200 rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-1">{m.label}</p>
            <p className={`text-lg font-semibold ${m.red ? "text-red-500" : ""}`}>{m.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-4 text-xs text-gray-400 px-1">
        <span>Agent: <span className="text-gray-600">{session.agent.name}</span></span>
        {session.agent.framework && (
          <span>Framework: <span className="text-gray-600">{session.agent.framework}</span></span>
        )}
        <span>Started: <span className="text-gray-600">{new Date(session.startedAt).toLocaleString()}</span></span>
        {session.endedAt && (
          <span>Ended: <span className="text-gray-600">{new Date(session.endedAt).toLocaleString()}</span></span>
        )}
      </div>
    </div>
  );
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
