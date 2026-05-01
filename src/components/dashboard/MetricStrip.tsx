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
    cyan: "text-acc-blue",
    amber: "text-amber",
    red: "text-acc-red",
    green: "text-acc-green",
    default: "text-black",
  };

  return (
    <div className="glass-panel flex items-center divide-x divide-dim-border overflow-x-auto scrollbar-thin hover-lift">
      {metrics.map((m) => (
        <div key={m.label} className="flex-1 min-w-0 px-6 py-5 bg-white">
          <p className="text-[11px] font-bold tracking-wider text-t-ghost uppercase mb-2">
            {m.label}
          </p>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold tracking-tight ${colorMap[m.color ?? "default"]}`}>
              {m.value}
            </span>
            {m.delta && (
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${m.deltaUp ? "bg-acc-red/10 text-acc-red" : "bg-acc-green/10 text-acc-green"}`}>
                {m.deltaUp ? "↑" : "↓"} {m.delta}
              </span>
            )}
          </div>
          {m.sub && (
            <p className="text-[13px] font-medium text-t-secondary mt-1 truncate">{m.sub}</p>
          )}
        </div>
      ))}
    </div>
  );
}
