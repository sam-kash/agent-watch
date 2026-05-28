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
  COMPLETED: { dot: "bg-acc-green", label: "COMPLETED", text: "text-t-primary" },
  RUNNING: { dot: "bg-active-border animate-pulse-slow", label: "RUNNING", text: "text-active-border" },
  FAILED: { dot: "bg-acc-red", label: "FAILED", text: "text-acc-red" },
  TIMEOUT: { dot: "bg-active-border", label: "TIMEOUT", text: "text-active-border" },
};

export function SessionsTable({ sessions }: { sessions: Session[] }) {
  return (
    <div className="glass-panel overflow-hidden relative">
      <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/5">
        <p className="text-[14px] font-semibold text-t-secondary">
          Recent Sessions
        </p>
        <Link href="/sessions" className="text-[13px] font-medium text-active-border hover:text-white transition-colors flex items-center gap-1">
          View All <span className="text-[10px]">↗</span>
        </Link>
      </div>

      {sessions.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-[13px] font-medium text-t-ghost">
          <span>Awaiting session telemetry...</span>
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {sessions.map((s) => {
            const cfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.COMPLETED;
            return (
              <Link
                key={s.id}
                href={`/sessions/${s.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-colors group/row"
              >
                {/* Status dot */}
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm ${cfg.dot}`} />

                {/* Agent name */}
                <span className={`text-[14px] font-semibold w-40 truncate group-hover/row:text-white transition-colors ${cfg.text}`}>
                  {s.agent?.name ?? "Unknown Agent"}
                </span>

                {/* Session ID */}
                <span className="text-[12px] font-mono text-t-ghost w-24 truncate hidden sm:block">
                  {s.id.slice(0, 12)}
                </span>

                {/* Event count */}
                <span className="text-[13px] font-medium text-t-secondary w-20 text-right">
                  {s.eventCount} evt
                </span>

                {/* Cost */}
                <span className="text-[13px] font-mono font-semibold text-active-border w-24 text-right">
                  ${s.totalCostUsd.toFixed(4)}
                </span>

                {/* Duration */}
                <span className="text-[13px] font-medium text-t-ghost w-16 text-right hidden md:block">
                  {s.durationMs ? `${(s.durationMs / 1000).toFixed(1)}s` : "—"}
                </span>

                {/* Errors */}
                {s.errorCount > 0 && (
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md border border-acc-red/20 bg-acc-red/10 text-acc-red ml-4 uppercase tracking-wider">
                    {s.errorCount} Err
                  </span>
                )}

                {/* Time */}
                <span className="text-[13px] font-medium text-t-ghost ml-auto hidden md:block group-hover/row:text-t-primary transition-colors">
                  {new Date(s.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
