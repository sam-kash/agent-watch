"use client";

import { useState } from "react";

type Event = {
  id: string;
  type: string;
  occurredAt: string;
  model?: string | null;
  provider?: string | null;
  tokensIn?: number | null;
  tokensOut?: number | null;
  costUsd?: number | null;
  latencyMs?: number | null;
  toolName?: string | null;
  toolInput?: any;
  toolOutput?: any;
  errorCode?: string | null;
  errorMsg?: string | null;
  errorStack?: string | null;
  payload: any;
};

const TYPE_CONFIG: Record<string, { color: string; bg: string; dot: string; label: string }> = {
  LLM_CALL: {
    color: "text-acc-violet",
    bg: "bg-acc-violet/10 border-acc-violet/20",
    dot: "bg-acc-violet shadow-[0_0_8px_rgba(124,58,237,0.4)]",
    label: "LLM",
  },
  TOOL_CALL: {
    color: "text-acc-blue",
    bg: "bg-acc-blue/10 border-acc-blue/20",
    dot: "bg-acc-blue shadow-[0_0_8px_rgba(37,99,235,0.4)]",
    label: "Tool",
  },
  AGENT_START: {
    color: "text-t-primary",
    bg: "bg-slate-100 border-dim-border",
    dot: "bg-t-ghost",
    label: "Start",
  },
  AGENT_END: {
    color: "text-acc-green",
    bg: "bg-acc-green/10 border-acc-green/20",
    dot: "bg-acc-green shadow-[0_0_8px_rgba(22,163,74,0.4)]",
    label: "End",
  },
  ERROR: {
    color: "text-acc-red",
    bg: "bg-acc-red/10 border-acc-red/20",
    dot: "bg-acc-red shadow-[0_0_8px_rgba(225,29,72,0.4)]",
    label: "Error",
  },
  CUSTOM: {
    color: "text-t-secondary",
    bg: "bg-slate-100 border-dim-border",
    dot: "bg-t-ghost",
    label: "Event",
  },
};

export function TraceTimeline({
  events,
  sessionStart,
}: {
  events: Event[];
  sessionStart: Date;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  if (events.length === 0) {
    return (
      <div className="glass-panel py-16 flex flex-col items-center justify-center text-t-ghost bg-white hover-lift">
        <svg className="w-10 h-10 mb-4 opacity-40 text-t-ghost" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-[14px] font-semibold text-t-secondary">No events recorded yet</p>
      </div>
    );
  }

  const start = new Date(sessionStart).getTime();

  return (
    <div className="relative pl-6">
      {/* Trace wire — soft glass line */}
      <div className="absolute left-[34px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-slate-200 via-slate-100 to-transparent rounded-full" />

      <div className="space-y-4">
        {events.map((event, idx) => {
          const cfg = TYPE_CONFIG[event.type] ?? TYPE_CONFIG.CUSTOM;
          const open = expanded.has(event.id);
          const offsetMs = new Date(event.occurredAt).getTime() - start;

          return (
            <div key={event.id} className="relative z-10">
              <button
                onClick={() => toggle(event.id)}
                className={`w-full flex items-center gap-4 px-4 py-3 text-left rounded-xl border transition-all group ${
                  open ? "bg-white border-dim-border shadow-md" : "border-transparent hover:bg-white hover:border-dim-border hover:shadow-sm"
                }`}
              >
                {/* Dot on the trace wire */}
                <span className={`w-3 h-3 rounded-full flex-shrink-0 ${cfg.dot} relative ring-4 ring-void transition-transform ${open ? "scale-125" : ""}`} />

                {/* Type label */}
                <span className={`text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-md border ${cfg.color} ${cfg.bg}`}>
                  {cfg.label}
                </span>

                {/* Event description */}
                <span className="text-[14px] font-semibold text-t-primary flex-1 truncate">
                  {eventLabel(event)}
                </span>

                {/* Cost */}
                {event.costUsd != null && event.costUsd > 0 && (
                  <span className="text-[13px] font-mono font-bold text-t-secondary w-20 text-right">
                    ${event.costUsd.toFixed(5)}
                  </span>
                )}

                {/* Time / Latency */}
                <div className="text-[13px] text-t-ghost w-24 text-right flex flex-col items-end">
                  <span className="font-mono font-medium">{event.latencyMs ? `${event.latencyMs}ms` : "—"}</span>
                  <span className="text-[11px] font-medium">+{ (offsetMs / 1000).toFixed(2) }s</span>
                </div>

                {/* Expand indicator */}
                <span className={`text-t-ghost transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </button>

              {/* Expanded details */}
              {open && (
                <div className="ml-10 mr-4 mb-2 mt-3 p-5 bg-slate-50 border border-dim-border rounded-xl shadow-inner animate-slide-down">
                  {event.type === "LLM_CALL" && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      {[
                        ["Model", event.model ?? "—"],
                        ["Provider", event.provider ?? "—"],
                        ["Tokens In", String(event.tokensIn ?? 0)],
                        ["Tokens Out", String(event.tokensOut ?? 0)],
                      ].map(([l, v]) => (
                        <div key={l}>
                          <p className="text-[12px] font-semibold text-t-ghost mb-1">{l}</p>
                          <p className="text-[14px] font-bold text-t-primary">{v}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {event.type === "TOOL_CALL" && (
                    <div className="space-y-4">
                      <div>
                        <p className="text-[12px] font-bold text-t-secondary mb-1.5 flex items-center gap-2">
                          <svg className="w-4 h-4 text-acc-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                          </svg>
                          Payload Input
                        </p>
                        <pre className="text-[13px] font-mono bg-white border border-dim-border shadow-sm rounded-lg px-4 py-3 overflow-x-auto text-t-primary">
                          {JSON.stringify(event.toolInput, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <p className="text-[12px] font-bold text-t-secondary mb-1.5 flex items-center gap-2">
                          <svg className="w-4 h-4 text-acc-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                          </svg>
                          Return Output
                        </p>
                        <pre className="text-[13px] font-mono bg-white border border-dim-border shadow-sm rounded-lg px-4 py-3 overflow-x-auto text-t-primary">
                          {JSON.stringify(event.toolOutput, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {event.type === "ERROR" && (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 bg-acc-red/10 border border-acc-red/20 rounded-lg p-4 shadow-sm">
                        <svg className="w-6 h-6 text-acc-red flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="text-[14px] font-bold text-acc-red">{event.errorMsg}</p>
                          {event.errorCode && (
                            <p className="text-[12px] font-semibold text-acc-red/80 mt-1">Code: {event.errorCode}</p>
                          )}
                        </div>
                      </div>
                      {event.errorStack && (
                        <pre className="text-[12px] font-mono bg-white border border-dim-border shadow-sm rounded-lg px-4 py-3 overflow-x-auto text-t-secondary">
                          {event.errorStack}
                        </pre>
                      )}
                    </div>
                  )}

                  <details className="text-[12px] font-mono mt-5 pt-5 border-t border-dim-border">
                    <summary className="text-t-ghost font-medium cursor-pointer hover:text-t-primary transition-colors flex items-center gap-1.5 w-max outline-none">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                      View raw JSON payload
                    </summary>
                    <pre className="mt-3 bg-white border border-dim-border shadow-sm rounded-lg px-4 py-3 overflow-x-auto text-t-secondary">
                      {JSON.stringify(event.payload, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function eventLabel(event: Event): string {
  switch (event.type) {
    case "LLM_CALL":
      return `Generative Call: ${event.model ?? "unknown model"}`;
    case "TOOL_CALL":
      return `Executed Tool: ${event.toolName ?? "unnamed"}`;
    case "ERROR":
      return "Execution Failed";
    case "AGENT_START":
      return "Agent Initialized";
    case "AGENT_END":
      return "Agent Terminated Successfully";
    default:
      return event.type;
  }
}
