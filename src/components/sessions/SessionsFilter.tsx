"use client";

import { useRouter, useSearchParams } from "next/navigation";

type Props = {
  agents: { id: string; name: string }[];
  current: { status?: string; agentId?: string };
};

const STATUSES = ["", "COMPLETED", "FAILED", "RUNNING", "TIMEOUT"];

export function SessionsFilter({ agents, current }: Props) {
  const router = useRouter();
  const params = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    router.push(`?${next.toString()}`);
  }

  return (
    <div className="flex gap-3 flex-wrap">
      <select
        value={current.status ?? ""}
        onChange={(e) => update("status", e.target.value)}
        className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
      >
        <option value="">All statuses</option>
        {STATUSES.filter(Boolean).map((s) => (
          <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
        ))}
      </select>

      <select
        value={current.agentId ?? ""}
        onChange={(e) => update("agentId", e.target.value)}
        className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
      >
        <option value="">All agents</option>
        {agents.map((a) => (
          <option key={a.id} value={a.id}>{a.name}</option>
        ))}
      </select>

      {(current.status || current.agentId) && (
        <button
          onClick={() => router.push("?")}
          className="text-xs text-gray-400 hover:text-gray-600 px-2"
        >
          Clear filters ✕
        </button>
      )}
    </div>
  );
}
