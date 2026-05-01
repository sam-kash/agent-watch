type Agent = {
  id: string;
  name: string;
  costUsd: number;
};

export function TopAgents({ agents }: { agents: Agent[] }) {
  if (agents.length === 0) {
    return (
      <div className="glass-panel p-6 h-full flex items-center justify-center bg-white hover-lift">
        <span className="text-[14px] font-semibold text-t-secondary">No agent data yet</span>
      </div>
    );
  }

  const maxCost = Math.max(...agents.map((a) => a.costUsd), 0.0001);

  return (
    <div className="glass-panel p-6 h-full bg-white hover-lift">
      <p className="text-[11px] font-bold tracking-wide text-t-ghost uppercase mb-6">
        Top agents by cost (7d)
      </p>
      <div className="space-y-5">
        {agents.map((agent, i) => {
          const pct = (agent.costUsd / maxCost) * 100;
          return (
            <div key={agent.id} className="group cursor-default">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-[11px] font-bold text-t-secondary shrink-0 border border-dim-border shadow-sm group-hover:bg-acc-blue group-hover:text-white transition-colors">
                    {i + 1}
                  </span>
                  <span className="text-[14px] font-semibold text-t-primary truncate">{agent.name}</span>
                </div>
                <span className="text-[13px] font-mono font-bold text-t-secondary flex-shrink-0 group-hover:text-acc-blue transition-colors">
                  ${agent.costUsd.toFixed(4)}
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-dim-border/50 shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-acc-blue to-acc-violet rounded-full transition-all duration-700 ease-out"
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
