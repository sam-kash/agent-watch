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
    <div className="h-10 bg-surface/50 backdrop-blur-md border-b border-dim-border flex items-center overflow-hidden relative text-[12px] font-medium tracking-wide">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-void to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-void to-transparent z-10 pointer-events-none" />

      <div className="flex animate-[ticker-scroll_50s_linear_infinite] whitespace-nowrap">
        {/* Double the content for seamless loop */}
        {[...events, ...events].map((event, i) => (
          <span key={`${event.id}-${i}`} className="inline-flex items-center gap-2 mx-6 text-t-secondary border-r border-dim-border pr-6">
            <span className="text-t-ghost font-mono text-[11px]">{event.time}</span>
            <span className="text-white font-semibold">{event.agent}</span>
            <span className="text-t-secondary truncate max-w-[200px]">{event.detail}</span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${
              event.status === "ok" 
                ? "bg-acc-green/10 text-acc-green border border-acc-green/20" 
                : "bg-acc-red/10 text-acc-red border border-acc-red/20"
            }`}>
              {event.status}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
