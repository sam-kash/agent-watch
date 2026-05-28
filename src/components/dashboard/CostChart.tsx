"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type Props = {
  data: { label: string; costUsd: number }[];
};

export function CostChart({ data }: Props) {
  return (
    <div className="glass-panel p-6 h-full relative group">
      <div className="flex items-center justify-between mb-8">
        <p className="text-[14px] font-semibold text-t-secondary">
          Cost over time (USD)
        </p>
        <span className="text-[11px] font-semibold text-active-border px-2 py-1 rounded-md bg-active-border/10 border border-active-border/20">LIVE</span>
      </div>

      {data.length === 0 ? (
        <div className="h-40 flex items-center justify-center text-[13px] font-medium text-t-ghost">
          Awaiting telemetry data...
        </div>
      ) : (
        <div className="relative">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-active-border)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--color-active-border)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-dim-border)"
                vertical={false}
                opacity={0.5}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "var(--color-t-secondary)", fontFamily: "var(--font-sans)" }}
                axisLine={false}
                tickLine={false}
                tickMargin={16}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--color-t-secondary)", fontFamily: "var(--font-mono)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${Number(v).toFixed(2)}`}
                tickMargin={16}
              />
              <Tooltip
                contentStyle={{
                  background: "rgba(24, 24, 27, 0.9)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid var(--color-dim-border)",
                  borderRadius: "12px",
                  fontSize: 13,
                  fontFamily: "var(--font-sans)",
                  color: "var(--color-t-primary)",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
                }}
                itemStyle={{
                  color: "var(--color-active-border)",
                  fontWeight: 600,
                  fontFamily: "var(--font-mono)",
                }}
                formatter={(v) => [`$${Number(v ?? 0).toFixed(4)}`, "Cost"]}
              />
              <Area
                type="monotone"
                dataKey="costUsd"
                stroke="var(--color-active-border)"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorCost)"
                activeDot={{
                  r: 6,
                  stroke: "rgba(255, 85, 0, 0.3)",
                  strokeWidth: 4,
                  fill: "var(--color-active-border)",
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
