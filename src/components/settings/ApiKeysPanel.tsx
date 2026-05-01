"use client";

import { useState } from "react";

type Key = {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: Date | null;
  createdAt: Date;
};

export function ApiKeysPanel({ keys: initial }: { keys: Key[] }) {
  const [keys, setKeys] = useState<Key[]>(initial);
  const [name, setName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const res = await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (data.key) {
      setNewKey(data.key);
      setKeys((k) => [{ id: data.key, name, keyPrefix: data.prefix, lastUsedAt: null, createdAt: new Date() }, ...k]);
      setName("");
    }
    setCreating(false);
  }

  async function revoke(id: string) {
    if (!confirm("Revoke this key? This cannot be undone.")) return;
    setKeys((k) => k.filter((x) => x.id !== id));
    await fetch("/api/keys", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  function copy() {
    if (!newKey) return;
    navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <h2 className="text-sm font-display font-semibold text-t-primary mb-1">API keys</h2>
      <p className="text-[10px] font-mono text-t-ghost mb-4">
        Use these keys to authenticate the AgentWatch SDK from your agents.
      </p>

      {newKey && (
        <div className="mb-4 panel border-acc-green/30 p-4 animate-slide-down">
          <p className="text-[10px] font-mono text-acc-green font-medium mb-2 glow-green">
            ◉ Copy this key now — it won&apos;t be shown again.
          </p>
          <div className="flex gap-2">
            <code className="flex-1 text-[11px] bg-void border border-dim-border rounded-md px-3 py-2 font-mono truncate text-cyan">
              {newKey}
            </code>
            <button onClick={copy}
              className="btn-primary text-[10px] px-3">
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <button onClick={() => setNewKey(null)}
            className="text-[10px] font-mono text-acc-green mt-2 hover:underline">
            I&apos;ve saved it, dismiss
          </button>
        </div>
      )}

      <form onSubmit={create} className="flex gap-2 mb-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Key name (e.g. Production)"
          required
          className="input-field flex-1"
        />
        <button type="submit" disabled={creating}
          className="btn-primary text-[11px] disabled:opacity-50">
          {creating ? "Creating…" : "Create key"}
        </button>
      </form>

      <div className="panel overflow-hidden">
        {keys.length === 0 ? (
          <p className="text-xs font-mono text-t-ghost text-center py-8">◆ No API keys yet</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Prefix</th>
                <th>Last used</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id}>
                  <td className="text-[11px] text-t-primary">{k.name}</td>
                  <td className="font-mono text-[10px] text-cyan">{k.keyPrefix}…</td>
                  <td className="text-[10px] text-t-ghost">
                    {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : "Never"}
                  </td>
                  <td className="text-[10px] text-t-ghost">
                    {new Date(k.createdAt).toLocaleDateString()}
                  </td>
                  <td className="text-right">
                    <button onClick={() => revoke(k.id)}
                      className="text-[10px] font-mono text-t-ghost hover:text-acc-red transition-colors">
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
