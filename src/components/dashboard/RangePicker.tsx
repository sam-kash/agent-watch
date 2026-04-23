"use client";

import { useRouter, useSearchParams } from "next/navigation";

const RANGES = [
  { value: "24h", label: "24h" },
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
];

export function RangePicker({ current }: { current: string }) {
  const router = useRouter();
  const params = useSearchParams();

  function select(range: string) {
    const next = new URLSearchParams(params.toString());
    next.set("range", range);
    router.push(`?${next.toString()}`);
  }

  return (
    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
      {RANGES.map((r) => (
        <button
          key={r.value}
          onClick={() => select(r.value)}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            current === r.value
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
