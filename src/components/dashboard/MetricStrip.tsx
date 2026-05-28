type Metric = {
  label: string;
  value: string;
  sub?: string;
  color?: "cyan" | "amber" | "red" | "green" | "default";
  delta?: string;
  deltaUp?: boolean;
};

export function MetricStrip({ metrics }: { metrics: Metric[] }) {
  const colorMap = {
    cyan: "text-active-border",
    amber: "text-active-border",
    red: "text-acc-red",
    green: "text-acc-green",
    default: "text-t-primary",
  };

  return (
    <div className="glass-panel flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-dim-border overflow-hidden">
      {metrics.map((m) => (
        <div key={m.label} className="flex-1 px-8 py-6 relative group hover:bg-white/5 transition-colors">
          <p className="text-[12px] font-semibold text-t-secondary tracking-wide mb-2">
            {m.label}
          </p>
          <div className="flex items-baseline gap-3 mb-1">
            <span className={`text-3xl font-semibold tracking-tight ${colorMap[m.color ?? "default"]}`}>
              {m.value}
            </span>
            {m.delta && (
              <span className={`text-[11px] font-semibold px-2 py-1 rounded-md border ${m.deltaUp ? "bg-acc-red/10 border-acc-red/20 text-acc-red" : "bg-acc-green/10 border-acc-green/20 text-acc-green"}`}>
                {m.deltaUp ? "↗" : "↘"} {m.delta}
              </span>
            )}
          </div>
          {m.sub && (
            <p className="text-[13px] text-t-ghost font-medium truncate">{m.sub}</p>
          )}
        </div>
      ))}
    </div>
  );
}
