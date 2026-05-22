"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Step = 1 | 2 | 3 | 4;

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>(1);
  const [agentName, setAgentName] = useState("");
  const [agentId, setAgentId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [keyName, setKeyName] = useState("Production");
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const router = useRouter();

  async function createAgent() {
    setCreating(true);
    const res = await fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: agentName, framework: "custom" }),
    });
    const data = await res.json();
    setAgentId(data.agent.id);
    setCreating(false);
    setStep(2);
  }

  async function createKey() {
    setCreating(true);
    const res = await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: keyName }),
    });
    const data = await res.json();
    setApiKey(data.key);
    setCreating(false);
    setStep(3);
  }

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }

  const snippetInstall = `npm install agentwatch-telemetry`;
  const snippetUsage = `import AgentWatch from "agentwatch-telemetry";

const aw = new AgentWatch({
  apiKey: "${apiKey || "aw_live_..."}",
  baseUrl: "${process.env.NEXT_PUBLIC_APP_URL || "https://your-agentwatch.app"}",
});

const session = aw.session({ agentId: "${agentId || "your-agent-id"}" });

// Wrap your LLM call
await session.llmCall({
  model: "gpt-4o",
  tokensIn: response.usage.prompt_tokens,
  tokensOut: response.usage.completion_tokens,
  latencyMs: Date.now() - start,
});

await session.end();`;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-lg font-semibold">
            <span className="text-violet-600">●</span> AgentWatch
          </span>
          <p className="text-sm text-gray-400 mt-1">Let&apos;s get your first agent tracked</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  s < step
                    ? "bg-violet-600 text-white"
                    : s === step
                      ? "bg-violet-600 text-white ring-4 ring-violet-100"
                      : "bg-gray-200 text-gray-400"
                }`}
              >
                {s < step ? "✓" : s}
              </div>
              {s < 4 && (
                <div className={`w-8 h-0.5 ${s < step ? "bg-violet-600" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          {step === 1 && (
            <div>
              <h2 className="text-base font-semibold mb-1">Name your first agent</h2>
              <p className="text-sm text-gray-400 mb-5">
                Give it a name that matches what it does in your product.
              </p>
              <input
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="e.g. Support Agent, Research Pipeline"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 mb-4"
                onKeyDown={(e) => e.key === "Enter" && agentName && createAgent()}
              />
              <button
                onClick={createAgent}
                disabled={!agentName || creating}
                className="w-full text-sm bg-violet-600 text-white py-2.5 rounded-lg hover:bg-violet-700 disabled:opacity-40 transition-colors"
              >
                {creating ? "Creating…" : "Create agent →"}
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-base font-semibold mb-1">Create an API key</h2>
              <p className="text-sm text-gray-400 mb-5">
                Your SDK uses this to authenticate with AgentWatch.
              </p>

              <div className="bg-green-50 border border-green-100 rounded-xl p-3 mb-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-green-800">Agent created</p>
                  <code className="text-xs text-green-700 font-mono">{agentId}</code>
                </div>
                <button
                  onClick={() => copy(agentId, "agentId")}
                  className="ml-auto text-xs text-green-600 hover:underline flex-shrink-0"
                >
                  {copied === "agentId" ? "Copied!" : "Copy"}
                </button>
              </div>

              <input
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="Key name"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 mb-4"
              />
              <button
                onClick={createKey}
                disabled={creating}
                className="w-full text-sm bg-violet-600 text-white py-2.5 rounded-lg hover:bg-violet-700 disabled:opacity-40 transition-colors"
              >
                {creating ? "Generating…" : "Generate API key →"}
              </button>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-base font-semibold mb-1">Add the SDK to your agent</h2>
              <p className="text-sm text-gray-400 mb-5">
                Copy your API key now — it won&apos;t be shown again.
              </p>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-gray-500">Your API key</label>
                  <button
                    onClick={() => copy(apiKey, "key")}
                    className="text-xs text-violet-600 hover:underline"
                  >
                    {copied === "key" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <code className="block text-xs font-mono bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-amber-800 break-all">
                  {apiKey}
                </code>
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-gray-500">1. Install</label>
                  <button
                    onClick={() => copy(snippetInstall, "install")}
                    className="text-xs text-violet-600 hover:underline"
                  >
                    {copied === "install" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <pre className="text-xs font-mono bg-gray-900 text-gray-100 rounded-lg px-3 py-2 overflow-x-auto">
                  {snippetInstall}
                </pre>
              </div>

              <div className="mb-5">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-gray-500">2. Track your agent</label>
                  <button
                    onClick={() => copy(snippetUsage, "usage")}
                    className="text-xs text-violet-600 hover:underline"
                  >
                    {copied === "usage" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <pre className="text-xs font-mono bg-gray-900 text-gray-100 rounded-lg px-3 py-2 overflow-x-auto max-h-48">
                  {snippetUsage}
                </pre>
              </div>

              <button
                onClick={() => setStep(4)}
                className="w-full text-sm bg-violet-600 text-white py-2.5 rounded-lg hover:bg-violet-700 transition-colors"
              >
                I&apos;ve added the SDK →
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="text-center">
              <div className="w-16 h-16 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⏳</span>
              </div>
              <h2 className="text-base font-semibold mb-2">Waiting for your first event</h2>
              <p className="text-sm text-gray-400 mb-6">
                Run your agent with the SDK installed. As soon as it fires an event, you&apos;ll see it in
                your dashboard.
              </p>

              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-left mb-6">
                <p className="text-xs text-gray-500 font-medium mb-2">Checklist</p>
                {[
                  "SDK installed and imported",
                  "API key set in environment variables",
                  `Agent ID "${agentId.slice(0, 16)}…" used in session()`,
                  "session.end() called at the end of your agent run",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2 mb-1.5">
                    <span className="text-gray-300 mt-0.5">☐</span>
                    <span className="text-xs text-gray-600">{item}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => router.push("/dashboard")}
                className="w-full text-sm bg-violet-600 text-white py-2.5 rounded-lg hover:bg-violet-700 transition-colors"
              >
                Go to dashboard →
              </button>
            </div>
          )}
        </div>

        {step > 1 && step < 4 && (
          <button
            onClick={() => setStep((s) => (s - 1) as Step)}
            className="mt-4 text-xs text-gray-400 hover:text-gray-600 mx-auto block"
          >
            ← Back
          </button>
        )}
      </div>
    </div>
  );
}
