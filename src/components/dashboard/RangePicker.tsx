"use client";

import { useRouter, useSearchParams } from "next/navigation";

const RANGES = [
  { value: "24h", label: "24H" },
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
];

export function RangePicker({ current }: { current: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleClick(range: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", range);
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-0.5 p-0.5 rounded-md bg-elevated border border-dim-border">
      {RANGES.map((r) => (
        <button
          key={r.value}
          onClick={() => handleClick(r.value)}
          className={`px-3 py-1 text-[10px] font-mono font-medium tracking-[0.1em] rounded transition-all ${
            current === r.value
              ? "bg-cyan/10 text-cyan border border-cyan/20 shadow-[0_0_6px_rgba(0,229,255,0.15)]"
              : "text-t-ghost hover:text-t-secondary border border-transparent"
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
