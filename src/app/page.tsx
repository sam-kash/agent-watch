import Link from "next/link";

const FEATURES = [
  { icon: "💸", title: "Cost attribution",   desc: "See exactly which agent, session, and model call is burning your budget. Per-token, per-run, per-day." },
  { icon: "🔍", title: "Full trace explorer", desc: "Replay any agent session step by step. Every LLM call, tool invocation, and error — in order." },
  { icon: "🚨", title: "Smart alerts",        desc: "Get notified on Slack or email when cost spikes, error rate climbs, or latency degrades." },
  { icon: "⚡", title: "2-line integration",  desc: "Drop the SDK into your agent. No config files, no infrastructure. First event in under 5 minutes." },
];

const PRICING = [
  { name: "Starter", price: "$0",   sub: "forever free", features: ["1 agent", "7-day history", "10K events/mo", "Email alerts"], cta: "Start free" },
  { name: "Team",    price: "$99",  sub: "/month",        features: ["5 agents", "30-day history", "500K events/mo", "Slack alerts", "Team seats"], cta: "Start trial", featured: true },
  { name: "Scale",   price: "$249", sub: "/month",        features: ["Unlimited agents", "90-day history", "Unlimited events", "Audit logs", "SOC2 exports"], cta: "Contact us" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <span className="font-semibold text-sm"><span className="text-violet-600">●</span> AgentWatch</span>
        <div className="flex items-center gap-6">
          <a href="#pricing" className="text-sm text-gray-500 hover:text-gray-900">Pricing</a>
          <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900">Log in</Link>
          <Link href="/onboarding" className="text-sm bg-violet-600 text-white px-4 py-1.5 rounded-lg hover:bg-violet-700 transition-colors">
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-violet-50 text-violet-700 text-xs px-3 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 bg-violet-500 rounded-full" />
          Built for teams shipping AI agents in production
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-5 leading-tight">
          See what your AI agents<br />are doing. And what they cost.
        </h1>
        <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto leading-relaxed">
          Full visibility into every agent run — cost per session, step-by-step traces,
          failure alerts, and token usage. Two lines of code. No infrastructure.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/onboarding" className="bg-violet-600 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors">
            Start free — takes 5 minutes
          </Link>
          <Link href="/dashboard" className="border border-gray-200 text-gray-700 px-6 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
            View demo dashboard →
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="border border-gray-100 rounded-2xl p-6 hover:border-gray-200 transition-colors">
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="text-sm font-semibold mb-1.5">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 border-y border-gray-100 py-16 px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">Up in 5 minutes</h2>
          <div className="space-y-4">
            {[
              { n: "1", title: "Install",     code: `npm install @agentwatch/sdk` },
              { n: "2", title: "Wrap your agent", code: `const session = aw.session({ agentId: "..." });\nawait session.llmCall({ model: "gpt-4o", tokensIn, tokensOut });\nawait session.end();` },
              { n: "3", title: "See everything",  code: `// Dashboard shows cost, traces, and alerts — live.` },
            ].map((step) => (
              <div key={step.n} className="flex gap-4 items-start">
                <div className="w-7 h-7 rounded-full bg-violet-600 text-white text-xs font-medium flex items-center justify-center flex-shrink-0 mt-0.5">{step.n}</div>
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1.5">{step.title}</p>
                  <pre className="text-xs font-mono bg-gray-900 text-gray-100 rounded-xl px-4 py-3 overflow-x-auto">{step.code}</pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-bold text-center mb-2">Simple pricing</h2>
        <p className="text-sm text-gray-400 text-center mb-10">Start free. Upgrade when you need more.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PRICING.map((plan) => (
            <div key={plan.name} className={`border rounded-2xl p-6 ${plan.featured ? "border-violet-300 ring-2 ring-violet-100" : "border-gray-200"}`}>
              {plan.featured && <div className="text-xs bg-violet-600 text-white px-3 py-0.5 rounded-full inline-block mb-3">Most popular</div>}
              <p className="text-sm font-semibold mb-1">{plan.name}</p>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-sm text-gray-400">{plan.sub}</span>
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="text-xs text-gray-600 flex gap-2">
                    <span className="text-green-500 flex-shrink-0">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/onboarding" className={`block text-center text-sm py-2.5 rounded-xl transition-colors ${plan.featured ? "bg-violet-600 text-white hover:bg-violet-700" : "border border-gray-200 text-gray-700 hover:bg-gray-50"}`}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-sm text-gray-400"><span className="text-violet-600">●</span> AgentWatch</span>
          <p className="text-xs text-gray-400">© 2026 AgentWatch. Built for teams shipping AI agents.</p>
        </div>
      </footer>
    </div>
  );
}
