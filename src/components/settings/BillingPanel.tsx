"use client";

import { useState } from "react";

type Plan = "FREE" | "TEAM" | "SCALE";

const PLANS = [
  {
    id: "FREE" as Plan,
    name: "Starter",
    price: "$0",
    features: ["1 agent", "7-day history", "10K events/mo", "Email alerts"],
  },
  {
    id: "TEAM" as Plan,
    name: "Team",
    price: "$99",
    features: ["5 agents", "30-day history", "500K events/mo", "Slack alerts", "Team seats"],
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_TEAM,
  },
  {
    id: "SCALE" as Plan,
    name: "Scale",
    price: "$249",
    features: ["Unlimited agents", "90-day history", "Unlimited events", "Audit logs", "SOC2-ready exports"],
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_SCALE,
  },
];

export function BillingPanel({ plan }: { plan: Plan }) {
  const [loading, setLoading] = useState<string | null>(null);

  async function upgrade(priceId: string, planId: string) {
    setLoading(planId);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId }),
    });
    const { url } = await res.json();
    if (url) window.location.assign(url);
    setLoading(null);
  }

  return (
    <div>
      <h2 className="text-sm font-display font-semibold text-t-primary mb-1">Billing</h2>
      <p className="text-[10px] font-mono text-t-ghost mb-4">
        Current plan: <span className="text-cyan font-medium">{plan}</span>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {PLANS.map((p) => {
          const isCurrent = p.id === plan;
          return (
            <div key={p.id}
              className={`panel p-4 transition-all ${
                isCurrent
                  ? "border-cyan/30 border-glow-cyan"
                  : "hover:border-glow-border"
              }`}>
              <div className="flex items-baseline justify-between mb-3">
                <span className="text-[10px] font-mono font-bold tracking-[0.1em] text-t-ghost uppercase">
                  {p.name}
                </span>
                <span className="font-display text-lg font-semibold text-t-primary">
                  {p.price}
                  <span className="text-[10px] text-t-ghost font-mono font-normal">/mo</span>
                </span>
              </div>

              <ul className="space-y-1.5 mb-4">
                {p.features.map((f) => (
                  <li key={f} className="text-[10px] font-mono text-t-secondary flex items-center gap-1.5">
                    <span className="text-acc-green">✓</span> {f}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className="text-[10px] text-center text-cyan font-mono font-medium py-1.5 bg-cyan/5 border border-cyan/20 rounded-md">
                  Current plan
                </div>
              ) : p.priceId ? (
                <button
                  onClick={() => upgrade(p.priceId!, p.id)}
                  disabled={!!loading}
                  className="btn-primary w-full justify-center text-[10px] disabled:opacity-50"
                >
                  {loading === p.id ? "Redirecting…" : `Upgrade to ${p.name}`}
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
