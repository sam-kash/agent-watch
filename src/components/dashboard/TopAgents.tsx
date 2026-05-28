type Agent = {
  id: string;
  name: string;
  costUsd: number;
};

export function TopAgents({ agents }: { agents: Agent[] }) {
  if (agents.length === 0) {
    return (
      <div className="glass-panel p-6 h-full flex items-center justify-center">
        <span className="text-[13px] font-medium text-t-ghost">No agent data available</span>
      </div>
    );
  }

  const maxCost = Math.max(...agents.map((a) => a.costUsd), 0.0001);

  return (
    <div className="glass-panel p-6 h-full relative">
      <p className="text-[14px] font-semibold text-t-secondary mb-8">
        Top agents by cost (7d)
      </p>
      <div className="space-y-6">
        {agents.map((agent, i) => {
          const pct = (agent.costUsd / maxCost) * 100;
          return (
            <div key={agent.id} className="group/row cursor-default">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center text-[11px] font-semibold text-t-secondary border border-white/5 group-hover/row:border-active-border/30 group-hover/row:text-active-border transition-colors shadow-sm">
                    {i + 1}
                  </span>
                  <span className="text-[14px] font-semibold text-t-primary truncate">{agent.name}</span>
                </div>
                <span className="text-[13px] font-mono font-medium text-t-secondary flex-shrink-0 group-hover/row:text-active-border transition-colors">
                  ${agent.costUsd.toFixed(4)}
                </span>
              </div>
              <div className="h-1.5 bg-dim-border overflow-hidden rounded-full shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-orange-400 to-active-border rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,85,0,0.5)]"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
