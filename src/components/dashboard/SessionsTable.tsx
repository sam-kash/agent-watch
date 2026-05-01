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
  durationMs?: number | null;
  agent: { name: string } | null;
};

const STATUS_CONFIG: Record<string, { dot: string; label: string; text: string }> = {
  COMPLETED: { dot: "bg-acc-green", label: "completed", text: "text-t-primary" },
  RUNNING: { dot: "bg-acc-blue shadow-[0_0_8px_var(--color-acc-blue)] animate-pulse", label: "running", text: "text-acc-blue" },
  FAILED: { dot: "bg-acc-red", label: "failed", text: "text-acc-red" },
  TIMEOUT: { dot: "bg-amber", label: "timeout", text: "text-amber" },
};

export function SessionsTable({ sessions }: { sessions: Session[] }) {
  return (
    <div className="glass-panel overflow-hidden hover-lift bg-white">
      <div className="px-6 py-5 border-b border-dim-border flex items-center justify-between bg-slate-50">
        <p className="text-[11px] font-bold tracking-wider text-t-secondary uppercase">
          Recent sessions
        </p>
        <Link href="/sessions" className="text-[13px] font-semibold text-acc-blue hover:text-blue-700 transition-colors flex items-center gap-1">
          View all
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {sessions.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center text-t-ghost bg-white">
          <svg className="w-10 h-10 mb-4 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="text-[14px] font-semibold text-t-secondary">No sessions yet — integrate the SDK to start tracking</span>
        </div>
      ) : (
        <div className="divide-y divide-dim-border bg-white">
          {sessions.map((s) => {
            const cfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.COMPLETED;
            return (
              <Link
                key={s.id}
                href={`/sessions/${s.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors group"
              >
                {/* Status dot */}
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dot}`} />

                {/* Agent name */}
                <span className={`text-[14px] font-semibold w-40 truncate group-hover:text-acc-blue transition-colors ${cfg.text}`}>
                  {s.agent?.name ?? "Unknown Agent"}
                </span>

                {/* Session ID */}
                <span className="text-[12px] font-mono text-t-ghost w-24 truncate hidden sm:block">
                  {s.id.slice(0, 12)}…
                </span>

                {/* Event count */}
                <span className="text-[13px] font-medium text-t-secondary w-20 text-right">
                  {s.eventCount} events
                </span>

                {/* Cost */}
                <span className="text-[13px] font-mono font-bold text-t-primary w-24 text-right">
                  ${s.totalCostUsd.toFixed(4)}
                </span>

                {/* Duration */}
                <span className="text-[13px] font-medium text-t-ghost w-16 text-right hidden md:block">
                  {s.durationMs ? `${(s.durationMs / 1000).toFixed(1)}s` : "—"}
                </span>

                {/* Errors */}
                {s.errorCount > 0 && (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-acc-red/10 border border-acc-red/20 text-acc-red ml-4 shadow-sm">
                    {s.errorCount} error
                  </span>
                )}

                {/* Time */}
                <span className="text-[13px] font-medium text-t-ghost ml-auto hidden md:block">
                  {new Date(s.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
