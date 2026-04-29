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
      <h2 className="text-sm font-medium text-gray-800 mb-1">API keys</h2>
      <p className="text-xs text-gray-400 mb-4">
        Use these keys to authenticate the AgentWatch SDK from your agents.
      </p>

      {newKey && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-xs text-green-700 font-medium mb-2">
            Copy this key now — it won&apos;t be shown again.
          </p>
          <div className="flex gap-2">
            <code className="flex-1 text-xs bg-white border border-green-200 rounded-lg px-3 py-2 font-mono truncate">
              {newKey}
            </code>
            <button onClick={copy}
              className="text-xs px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <button onClick={() => setNewKey(null)}
            className="text-xs text-green-600 mt-2 hover:underline">
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
          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <button type="submit" disabled={creating}
          className="text-sm bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors">
          {creating ? "Creating…" : "Create key"}
        </button>
      </form>

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        {keys.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-8">No API keys yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-2 font-normal">Name</th>
                <th className="text-left px-4 py-2 font-normal">Prefix</th>
                <th className="text-left px-4 py-2 font-normal">Last used</th>
                <th className="text-left px-4 py-2 font-normal">Created</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-2.5 text-gray-700">{k.name}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{k.keyPrefix}…</td>
                  <td className="px-4 py-2.5 text-xs text-gray-400">
                    {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : "Never"}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-400">
                    {new Date(k.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button onClick={() => revoke(k.id)}
                      className="text-xs text-gray-300 hover:text-red-400 transition-colors">
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
