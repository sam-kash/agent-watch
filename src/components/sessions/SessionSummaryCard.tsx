type Props = {
  session: {
    totalCostUsd: number;
    totalTokensIn: number;
    totalTokensOut: number;
    errorCount: number;
    eventCount: number;
    durationMs?: number | null;
    tags: string[];
  };
  summary: string;
};

export function SessionSummaryCard({ session, summary }: Props) {
  const metrics = [
    { label: "Cost", value: `$${session.totalCostUsd.toFixed(5)}`, color: "text-amber" },
    { label: "Tokens in", value: String(session.totalTokensIn), color: "text-t-primary" },
    { label: "Tokens out", value: String(session.totalTokensOut), color: "text-t-primary" },
    { label: "Events", value: String(session.eventCount), color: "text-cyan" },
    {
      label: "Errors",
      value: String(session.errorCount),
      color: session.errorCount > 0 ? "text-acc-red" : "text-acc-green",
    },
    {
      label: "Duration",
      value: session.durationMs ? `${(session.durationMs / 1000).toFixed(1)}s` : "—",
      color: "text-t-primary",
    },
  ];

  return (
    <div className="panel overflow-hidden">
      {/* Metrics strip */}
      <div className="flex items-center divide-x divide-dim-border border-b border-dim-border">
        {metrics.map((m) => (
          <div key={m.label} className="flex-1 px-4 py-3">
            <p className="text-[9px] font-mono font-medium tracking-[0.12em] text-t-ghost uppercase mb-0.5">
              {m.label}
            </p>
            <p className={`text-sm font-mono font-semibold ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* AI Summary */}
      <div className="px-4 py-3">
        <p className="text-[9px] font-mono font-medium tracking-[0.12em] text-t-ghost uppercase mb-1">
          Summary
        </p>
        <p className="text-[11px] font-mono text-t-secondary leading-relaxed">{summary}</p>
      </div>

      {/* Tags */}
      {session.tags.length > 0 && (
        <div className="px-4 pb-3 flex items-center gap-2">
          {session.tags.map((tag) => (
            <span
              key={tag}
              className="text-[9px] font-mono px-2 py-0.5 rounded bg-elevated border border-dim-border text-t-ghost"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
