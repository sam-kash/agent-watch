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

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShowForm(!showForm)}
        className={showForm ? "btn-secondary text-[11px]" : "btn-primary text-[11px]"}
      >
        {showForm ? "Cancel" : "+ New alert rule"}
      </button>

      {showForm && (
        <form onSubmit={createRule} className="panel p-5 space-y-4 animate-slide-down">
          <h3 className="text-sm font-display font-semibold text-t-primary">New alert rule</h3>

          <div>
            <label className="text-[9px] font-mono text-t-ghost uppercase tracking-wider block mb-1.5">Rule name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Daily cost spike" className="input-field" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] font-mono text-t-ghost uppercase tracking-wider block mb-1.5">Metric</label>
              <select value={form.metric} onChange={(e) => setForm({ ...form, metric: e.target.value })} className="input-field">
                {METRICS.map((m) => <option key={m} value={m}>{metricLabels[m] ?? m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] font-mono text-t-ghost uppercase tracking-wider block mb-1.5">Channel</label>
              <select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })} className="input-field">
                <option value="email">Email</option>
                <option value="slack">Slack</option>
                <option value="webhook">Webhook</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[9px] font-mono text-t-ghost uppercase tracking-wider block mb-1.5">Condition</label>
              <select value={form.operator} onChange={(e) => setForm({ ...form, operator: e.target.value })} className="input-field">
                {OPERATORS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] font-mono text-t-ghost uppercase tracking-wider block mb-1.5">Threshold</label>
              <input required type="number" step="any" value={form.threshold}
                onChange={(e) => setForm({ ...form, threshold: e.target.value })}
                placeholder="0.50" className="input-field" />
            </div>
            <div>
              <label className="text-[9px] font-mono text-t-ghost uppercase tracking-wider block mb-1.5">Window (min)</label>
              <input type="number" value={form.windowMin}
                onChange={(e) => setForm({ ...form, windowMin: e.target.value })}
                className="input-field" />
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="btn-primary w-full justify-center disabled:opacity-50">
            {saving ? "Saving…" : "Create rule"}
          </button>
        </form>
      )}

      {rules.length === 0 ? (
        <div className="panel py-12 text-center text-xs font-mono text-t-ghost">
          ◆ No alert rules yet. Create one to get notified when things go wrong.
        </div>
      ) : (
        <div className="space-y-1.5">
          {rules.map((rule) => (
            <div key={rule.id}
              className="panel px-4 py-3 flex items-center gap-4 hover:border-glow-border transition-all">
              {/* Toggle */}
              <button
                onClick={() => toggleRule(rule.id, !rule.enabled)}
                className={`w-9 h-5 rounded-full transition-all flex-shrink-0 relative ${
                  rule.enabled
                    ? "bg-cyan/20 border border-cyan/30"
                    : "bg-elevated border border-dim-border"
                }`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full shadow transition-all ${
                  rule.enabled
                    ? "translate-x-4 bg-cyan shadow-[0_0_6px_var(--glow-cyan)]"
                    : "translate-x-0.5 bg-t-ghost"
                }`} />
              </button>

              {/* Rule info */}
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-mono font-medium ${rule.enabled ? "text-t-primary" : "text-t-ghost"}`}>
                  {rule.name}
                </p>
                <p className="text-[10px] font-mono text-t-ghost">
                  <span className="text-amber">{metricLabels[rule.metric]}</span>
                  {" "}{rule.operator}{" "}
                  <span className="text-t-secondary">{rule.threshold}</span>
                  <span className="text-t-ghost"> · {rule.windowMin}min window · {rule.channel}</span>
                </p>
              </div>

              {/* Last fired */}
              {rule.lastFiredAt && (
                <span className="text-[10px] font-mono text-amber bg-amber/10 border border-amber/20 px-2 py-0.5 rounded flex-shrink-0">
                  fired {timeAgo(new Date(rule.lastFiredAt))}
                </span>
              )}

              {/* Delete */}
              <button onClick={() => deleteRule(rule.id)}
                className="text-t-ghost hover:text-acc-red text-xs transition-colors flex-shrink-0">
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
