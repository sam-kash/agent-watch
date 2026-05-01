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
    <div className="glass-panel p-6 h-full relative overflow-hidden hover-lift bg-white">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white pointer-events-none z-0" />
      <p className="text-[11px] font-bold tracking-wider text-t-ghost uppercase mb-6 relative z-10">
        Cost over time (USD)
      </p>
      {data.length === 0 ? (
        <div className="h-40 flex items-center justify-center text-sm font-medium text-t-ghost relative z-10">
          No data yet — send events to see your cost chart
        </div>
      ) : (
        <div className="relative z-10">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="costGradLight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-dim-border)"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "var(--color-t-secondary)", fontFamily: "var(--font-sans)", fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                tickMargin={12}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--color-t-secondary)", fontFamily: "var(--font-sans)", fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${Number(v).toFixed(3)}`}
                tickMargin={12}
              />
              <Tooltip
                contentStyle={{
                  background: "#ffffff",
                  border: "1px solid var(--color-dim-border)",
                  borderRadius: 12,
                  fontSize: 13,
                  fontFamily: "var(--font-sans)",
                  fontWeight: 600,
                  color: "#000",
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
                }}
                itemStyle={{
                  color: "var(--color-acc-blue)",
                  fontWeight: 700,
                }}
                formatter={(v) => [`$${Number(v ?? 0).toFixed(6)}`, "Cost"]}
              />
              <Area
                type="monotone"
                dataKey="costUsd"
                stroke="var(--color-acc-blue)"
                strokeWidth={3}
                fill="url(#costGradLight)"
                dot={false}
                activeDot={{
                  r: 5,
                  stroke: "var(--color-acc-blue)",
                  strokeWidth: 2,
                  fill: "#ffffff",
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
