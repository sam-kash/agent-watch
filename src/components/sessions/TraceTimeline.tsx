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
  LLM_CALL: { color: "text-violet-700", bg: "bg-violet-50 border-violet-100", dot: "bg-violet-400", label: "LLM call" },
  TOOL_CALL: { color: "text-blue-700", bg: "bg-blue-50 border-blue-100", dot: "bg-blue-400", label: "Tool call" },
  AGENT_START: { color: "text-green-700", bg: "bg-green-50 border-green-100", dot: "bg-green-400", label: "Start" },
  AGENT_END: { color: "text-green-700", bg: "bg-green-50 border-green-100", dot: "bg-green-400", label: "End" },
  ERROR: { color: "text-red-700", bg: "bg-red-50 border-red-100", dot: "bg-red-400", label: "Error" },
  CUSTOM: { color: "text-gray-700", bg: "bg-gray-50 border-gray-100", dot: "bg-gray-400", label: "Custom" },
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
      <div className="bg-white border border-gray-200 rounded-xl py-12 text-center text-sm text-gray-300">
        No events recorded for this session
      </div>
    );
  }

  const start = new Date(sessionStart).getTime();

  return (
    <div className="space-y-1.5">
      {events.map((event, idx) => {
        const cfg = TYPE_CONFIG[event.type] ?? TYPE_CONFIG.CUSTOM;
        const open = expanded.has(event.id);
        const offsetMs = new Date(event.occurredAt).getTime() - start;

        return (
          <div key={event.id}
            className={`border rounded-xl overflow-hidden transition-all ${cfg.bg}`}>
            <button
              onClick={() => toggle(event.id)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:brightness-95 transition-all"
            >
              <span className="text-xs text-gray-400 w-5 text-right">{idx + 1}</span>
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />

              <span className={`text-xs font-medium w-20 ${cfg.color}`}>{cfg.label}</span>

              <span className="text-xs text-gray-700 flex-1 truncate">
                {eventLabel(event)}
              </span>

              {event.costUsd != null && event.costUsd > 0 && (
                <span className="text-xs font-mono text-gray-500 w-20 text-right">
                  ${event.costUsd.toFixed(5)}
                </span>
              )}

              {event.latencyMs != null && (
                <span className="text-xs text-gray-400 w-16 text-right">
                  {event.latencyMs}ms
                </span>
              )}

              <span className="text-xs text-gray-300 w-16 text-right">
                +{(offsetMs / 1000).toFixed(2)}s
              </span>

              <span className={`text-gray-400 text-xs transition-transform ${open ? "rotate-90" : ""}`}>
                ▶
              </span>
            </button>

            {open && (
              <div className="border-t border-dashed border-current border-opacity-20 px-4 py-3 space-y-3">
                {event.type === "LLM_CALL" && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      ["Model", event.model ?? "—"],
                      ["Provider", event.provider ?? "—"],
                      ["Tokens in", String(event.tokensIn ?? 0)],
                      ["Tokens out", String(event.tokensOut ?? 0)],
                    ].map(([l, v]) => (
                      <div key={l}>
                        <p className="text-xs text-gray-400">{l}</p>
                        <p className="text-sm font-medium text-gray-800">{v}</p>
                      </div>
                    ))}
                  </div>
                )}

                {event.type === "TOOL_CALL" && (
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Input</p>
                      <pre className="text-xs bg-white bg-opacity-60 rounded p-2 overflow-x-auto">
                        {JSON.stringify(event.toolInput, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Output</p>
                      <pre className="text-xs bg-white bg-opacity-60 rounded p-2 overflow-x-auto">
                        {JSON.stringify(event.toolOutput, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {event.type === "ERROR" && (
                  <div className="space-y-2">
                    <p className="text-sm text-red-700">{event.errorMsg}</p>
                    {event.errorCode && (
                      <p className="text-xs text-gray-500">Code: {event.errorCode}</p>
                    )}
                    {event.errorStack && (
                      <pre className="text-xs bg-red-900 bg-opacity-5 rounded p-2 overflow-x-auto text-red-800">
                        {event.errorStack}
                      </pre>
                    )}
                  </div>
                )}

                <details className="text-xs">
                  <summary className="text-gray-400 cursor-pointer hover:text-gray-600">
                    Raw payload
                  </summary>
                  <pre className="mt-2 bg-white bg-opacity-60 rounded p-2 overflow-x-auto text-gray-600">
                    {JSON.stringify(event.payload, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function eventLabel(event: Event): string {
  switch (event.type) {
    case "LLM_CALL": return `${event.model ?? "unknown model"} · ${event.tokensIn ?? 0} in / ${event.tokensOut ?? 0} out`;
    case "TOOL_CALL": return event.toolName ?? "unnamed tool";
    case "ERROR": return event.errorMsg ?? "unknown error";
    case "AGENT_START": return "Agent started";
    case "AGENT_END": return "Agent finished";
    default: return event.type;
  }
}
