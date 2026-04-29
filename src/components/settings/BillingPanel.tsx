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
      <h2 className="text-sm font-medium text-gray-800 mb-1">Billing</h2>
      <p className="text-xs text-gray-400 mb-4">
        Current plan: <span className="font-medium text-gray-700">{plan}</span>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {PLANS.map((p) => {
          const isCurrent = p.id === plan;
          return (
            <div key={p.id}
              className={`border rounded-xl p-4 ${
                isCurrent
                  ? "border-violet-300 bg-violet-50"
                  : "border-gray-200 bg-white"
              }`}>
              <div className="flex items-baseline justify-between mb-3">
                <span className="text-sm font-medium">{p.name}</span>
                <span className="text-lg font-semibold">{p.price}<span className="text-xs text-gray-400 font-normal">/mo</span></span>
              </div>

              <ul className="space-y-1 mb-4">
                {p.features.map((f) => (
                  <li key={f} className="text-xs text-gray-600 flex items-center gap-1.5">
                    <span className="text-green-500">✓</span> {f}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className="text-xs text-center text-violet-600 font-medium py-1.5">
                  Current plan
                </div>
              ) : p.priceId ? (
                <button
                  onClick={() => upgrade(p.priceId!, p.id)}
                  disabled={!!loading}
                  className="w-full text-xs bg-violet-600 text-white py-2 rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
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
