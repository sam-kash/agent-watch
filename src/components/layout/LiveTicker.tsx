"use client";

import { useEffect, useState } from "react";

type TickerEvent = {
  id: string;
  time: string;
  agent: string;
  type: string;
  detail: string;
  status: "ok" | "error";
};

export function LiveTicker() {
  const [events, setEvents] = useState<TickerEvent[]>([]);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch("/api/events/recent");
        if (res.ok) {
          const data = await res.json();
          setEvents(data.events ?? []);
        }
      } catch {
        // silently fail — ticker is non-critical
      }
    }

    fetchEvents();
    const interval = setInterval(fetchEvents, 10000);
    return () => clearInterval(interval);
  }, []);

  if (events.length === 0) {
    return null;
  }

  return (
    <div className="h-9 bg-slate-50 border-b border-dim-border flex items-center overflow-hidden relative shadow-[inset_0_-1px_2px_rgba(0,0,0,0.02)]">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-slate-50 to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-slate-50 to-transparent z-10" />

      <div className="flex animate-[ticker-scroll_40s_linear_infinite] whitespace-nowrap">
        {/* Double the content for seamless loop */}
        {[...events, ...events].map((event, i) => (
          <span key={`${event.id}-${i}`} className="inline-flex items-center gap-2 mx-6 text-[12px] font-sans">
            <span className="text-t-ghost font-mono text-[11px] font-medium">{event.time}</span>
            <span className="text-black font-semibold">{event.agent}</span>
            <span className="text-t-ghost px-1">·</span>
            <span className="text-t-secondary font-medium">{event.detail}</span>
            <span className={event.status === "ok" ? "text-acc-green" : "text-acc-red"}>
              {event.status === "ok" ? (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
