"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreateAgentButton() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newId, setNewId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "", framework: "custom" });
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.agent) {
      setNewId(data.agent.id);
      router.refresh();
    }
    setSaving(false);
  }

  const inputCls = "w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 transition-colors"
      >
        + New agent
      </button>

      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            {newId ? (
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-600 text-xl">✓</span>
                </div>
                <h3 className="text-sm font-medium mb-1">Agent created</h3>
                <p className="text-xs text-gray-400 mb-4">Use this ID in the AgentWatch SDK</p>
                <code className="block text-xs font-mono bg-gray-100 px-3 py-2 rounded-lg text-gray-800 mb-4 break-all">
                  {newId}
                </code>
                <div className="text-xs bg-gray-50 border border-gray-100 rounded-lg p-3 text-left mb-4">
                  <p className="text-gray-500 mb-1">Quick start:</p>
                  <pre className="text-gray-700 overflow-x-auto">{`const session = aw.session({
  agentId: "${newId}"
});`}</pre>
                </div>
                <button
                  onClick={() => { setOpen(false); setNewId(null); setForm({ name: "", description: "", framework: "custom" }); }}
                  className="w-full text-sm bg-violet-600 text-white py-2 rounded-lg hover:bg-violet-700"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <h3 className="text-sm font-medium">New agent</h3>

                <div>
                  <label className="text-xs text-gray-500 block mb-1">Name *</label>
                  <input required value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Support Agent" className={inputCls} />
                </div>

                <div>
                  <label className="text-xs text-gray-500 block mb-1">Description</label>
                  <input value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="What does this agent do?" className={inputCls} />
                </div>

                <div>
                  <label className="text-xs text-gray-500 block mb-1">Framework</label>
                  <select value={form.framework}
                    onChange={(e) => setForm({ ...form, framework: e.target.value })}
                    className={inputCls}>
                    <option value="custom">Custom / Other</option>
                    <option value="openai">OpenAI</option>
                    <option value="langchain">LangChain</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="crewai">CrewAI</option>
                    <option value="autogen">AutoGen</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setOpen(false)}
                    className="flex-1 text-sm border border-gray-200 py-2 rounded-lg hover:bg-gray-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex-1 text-sm bg-violet-600 text-white py-2 rounded-lg hover:bg-violet-700 disabled:opacity-50">
                    {saving ? "Creating…" : "Create agent"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
