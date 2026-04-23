type Agent = { id: string; name: string; costUsd: number };

export function TopAgents({ agents }: { agents: Agent[] }) {
  const max = Math.max(...agents.map((a) => a.costUsd), 0.000001);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <p className="text-xs text-gray-400 mb-4">Top agents by cost</p>
      {agents.length === 0 ? (
        <p className="text-sm text-gray-300 text-center py-8">No data yet</p>
      ) : (
        <ul className="space-y-3">
          {agents.map((a) => (
            <li key={a.id}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-700 truncate max-w-[120px]">{a.name}</span>
                <span className="text-gray-500 font-mono">${a.costUsd.toFixed(4)}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full"
                  style={{ width: `${(a.costUsd / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
