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
    <div className="flex items-center gap-1 bg-white/5 border border-white/10 p-1 rounded-full shadow-inner">
      {RANGES.map((r) => (
        <button
          key={r.value}
          onClick={() => handleClick(r.value)}
          className={`px-4 py-1.5 text-[12px] font-medium rounded-full transition-all ${
            current === r.value
              ? "bg-active-border text-white shadow-[0_2px_10px_rgba(255,85,0,0.3)]"
              : "text-t-secondary hover:text-white hover:bg-white/5"
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
