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

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-primary text-[11px]"
      >
        + New agent
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="panel-elevated w-full max-w-md p-6 animate-slide-down shadow-2xl shadow-black/40">
            {newId ? (
              <div className="text-center">
                <div className="w-10 h-10 rounded-lg bg-acc-green/10 border border-acc-green/20 flex items-center justify-center mx-auto mb-3">
                  <span className="text-acc-green text-sm glow-green">✓</span>
                </div>
                <h3 className="text-sm font-display font-semibold text-t-primary mb-1">Agent created</h3>
                <p className="text-[10px] font-mono text-t-ghost mb-4">Use this ID in the AgentWatch SDK</p>
                <code className="block text-[11px] font-mono bg-void px-3 py-2 rounded-md border border-dim-border text-cyan mb-4 break-all">
                  {newId}
                </code>
                <div className="bg-void border border-dim-border rounded-md p-3 text-left mb-4">
                  <p className="text-[9px] font-mono text-t-ghost uppercase tracking-wider mb-1">Quick start:</p>
                  <pre className="text-[10px] font-mono text-acc-green overflow-x-auto">{`const session = aw.session({
  agentId: "${newId}"
});`}</pre>
                </div>
                <button
                  onClick={() => { setOpen(false); setNewId(null); setForm({ name: "", description: "", framework: "custom" }); }}
                  className="btn-primary w-full justify-center"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <h3 className="text-sm font-display font-semibold text-t-primary">New agent</h3>

                <div>
                  <label className="text-[9px] font-mono text-t-ghost uppercase tracking-wider block mb-1.5">Name *</label>
                  <input required value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Support Agent" className="input-field" />
                </div>

                <div>
                  <label className="text-[9px] font-mono text-t-ghost uppercase tracking-wider block mb-1.5">Description</label>
                  <input value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="What does this agent do?" className="input-field" />
                </div>

                <div>
                  <label className="text-[9px] font-mono text-t-ghost uppercase tracking-wider block mb-1.5">Framework</label>
                  <select value={form.framework}
                    onChange={(e) => setForm({ ...form, framework: e.target.value })}
                    className="input-field">
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
                    className="btn-secondary flex-1 justify-center">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving}
                    className="btn-primary flex-1 justify-center disabled:opacity-50">
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
