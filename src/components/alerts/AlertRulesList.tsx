"use client";

import { useState } from "react";

type Rule = {
  id: string;
  name: string;
  metric: string;
  operator: string;
  threshold: number;
  windowMin: number;
  channel: string;
  enabled: boolean;
  lastFiredAt: Date | null;
};

const METRICS = ["COST_USD", "ERROR_RATE", "TOKEN_COUNT", "LATENCY_P95"];
const OPERATORS = [
  { value: "gt", label: "greater than" },
  { value: "gte", label: "≥" },
  { value: "lt", label: "less than" },
  { value: "lte", label: "≤" },
];

type Props = {
  rules: Rule[];
  metricLabels: Record<string, string>;
};

export function AlertRulesList({ rules: initial, metricLabels }: Props) {
  const [rules, setRules] = useState<Rule[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", metric: "COST_USD", operator: "gt",
    threshold: "", windowMin: "60", channel: "email",
  });

  async function toggleRule(id: string, enabled: boolean) {
    setRules((r) => r.map((x) => x.id === id ? { ...x, enabled } : x));
    await fetch("/api/alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, enabled }),
    });
  }

  async function deleteRule(id: string) {
    setRules((r) => r.filter((x) => x.id !== id));
    await fetch("/api/alerts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  async function createRule(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        threshold: parseFloat(form.threshold),
        windowMin: parseInt(form.windowMin),
      }),
    });
    const data = await res.json();
    if (data.rule) {
      setRules((r) => [data.rule, ...r]);
      setShowForm(false);
      setForm({ name: "", metric: "COST_USD", operator: "gt", threshold: "", windowMin: "60", channel: "email" });
    }
    setSaving(false);
  }

  const inputCls = "w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white";

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShowForm(!showForm)}
        className="text-sm bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 transition-colors"
      >
        {showForm ? "Cancel" : "+ New alert rule"}
      </button>

      {showForm && (
        <form onSubmit={createRule}
          className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-medium">New alert rule</h3>

          <div>
            <label className="text-xs text-gray-500 block mb-1">Rule name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Daily cost spike" className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Metric</label>
              <select value={form.metric} onChange={(e) => setForm({ ...form, metric: e.target.value })} className={inputCls}>
                {METRICS.map((m) => <option key={m} value={m}>{metricLabels[m] ?? m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Channel</label>
              <select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })} className={inputCls}>
                <option value="email">Email</option>
                <option value="slack">Slack</option>
                <option value="webhook">Webhook</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Condition</label>
              <select value={form.operator} onChange={(e) => setForm({ ...form, operator: e.target.value })} className={inputCls}>
                {OPERATORS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Threshold</label>
              <input required type="number" step="any" value={form.threshold}
                onChange={(e) => setForm({ ...form, threshold: e.target.value })}
                placeholder="0.50" className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Window (min)</label>
              <input type="number" value={form.windowMin}
                onChange={(e) => setForm({ ...form, windowMin: e.target.value })}
                className={inputCls} />
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="w-full text-sm bg-violet-600 text-white py-2 rounded-lg hover:bg-violet-700 disabled:opacity-50">
            {saving ? "Saving…" : "Create rule"}
          </button>
        </form>
      )}

      {rules.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl py-12 text-center text-sm text-gray-400">
          No alert rules yet. Create one to get notified when things go wrong.
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map((rule) => (
            <div key={rule.id}
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-4">
              <button
                onClick={() => toggleRule(rule.id, !rule.enabled)}
                className={`w-9 h-5 rounded-full transition-colors flex-shrink-0 relative ${
                  rule.enabled ? "bg-violet-600" : "bg-gray-200"
                }`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  rule.enabled ? "translate-x-4" : "translate-x-0.5"
                }`} />
              </button>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{rule.name}</p>
                <p className="text-xs text-gray-400">
                  {metricLabels[rule.metric]} {rule.operator} {rule.threshold}
                  {" · "}{rule.windowMin}min window
                  {" · "}{rule.channel}
                </p>
              </div>

              {rule.lastFiredAt && (
                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex-shrink-0">
                  fired {timeAgo(new Date(rule.lastFiredAt))}
                </span>
              )}

              <button onClick={() => deleteRule(rule.id)}
                className="text-gray-300 hover:text-red-400 text-sm transition-colors flex-shrink-0">
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
