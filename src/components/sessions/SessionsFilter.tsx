"use client";

import { useRouter, useSearchParams } from "next/navigation";

type Props = {
  agents: { id: string; name: string }[];
  current: { status?: string; agentId?: string; search?: string };
};

export function SessionsFilter({ agents, current }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-3">
      {/* Status filter */}
      <select
        value={current.status ?? ""}
        onChange={(e) => update("status", e.target.value)}
        className="input-field text-[11px] py-1.5 w-36"
      >
        <option value="">All statuses</option>
        <option value="COMPLETED">Completed</option>
        <option value="RUNNING">Running</option>
        <option value="FAILED">Failed</option>
        <option value="TIMEOUT">Timeout</option>
      </select>

      {/* Agent filter */}
      <select
        value={current.agentId ?? ""}
        onChange={(e) => update("agentId", e.target.value)}
        className="input-field text-[11px] py-1.5 w-44"
      >
        <option value="">All agents</option>
        {agents.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>
    </div>
  );
}
