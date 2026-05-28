import Link from "next/link";

const FEATURES = [
  {
    icon: "✦",
    title: "Cost attribution",
    desc: "Per-token, per-session, per-agent cost breakdown. Know exactly where your budget goes in real-time.",
  },
  {
    icon: "⌗",
    title: "Full trace explorer",
    desc: "Replay any session step by step — every LLM call, tool invocation, and error in sequence.",
  },
  {
    icon: "⎋",
    title: "Smart alerts",
    desc: "Receive notifications in Slack or email when cost spikes, error rate climbs, or latency degrades past your threshold.",
  },
  {
    icon: "⌘",
    title: "2-line integration",
    desc: "Drop the SDK into your agent. No config files, no heavy infra. First event in under 5 minutes.",
  },
];



export default function LandingPage() {
  return (
    <div className="min-h-screen bg-void text-t-primary relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="ambient-glow top-[-200px] left-[-100px] opacity-100 animate-float" />
      <div className="ambient-glow-purple top-[10%] right-[-150px] opacity-100 animate-float" style={{ animationDelay: "2s" }} />

      {/* Nav */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 glass-pill px-6 py-3 flex items-center justify-between w-[90%] max-w-5xl transition-all duration-300 hover:shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 rounded-[5px] bg-black shadow-md flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
          <span className="font-display text-[15px] font-bold tracking-tight text-t-primary">AgentWatch</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm font-medium text-t-secondary hover:text-black transition-colors">
            Log in
          </Link>
          <Link href="/signup" className="btn-primary text-sm px-4 py-1.5">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-40 pb-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left — text */}
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 text-[12px] font-semibold text-acc-blue mb-6 px-4 py-1.5 rounded-full border border-acc-blue/20 bg-acc-blue/5 shadow-sm">
              <span className="w-1.5 h-1.5 bg-acc-blue rounded-full animate-pulse" />
              Agent observability for modern teams
            </div>
            <h1 className="font-display text-5xl lg:text-[68px] font-bold tracking-tight mb-6 leading-[1.05] text-black">
              See what your agents
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-acc-blue to-acc-violet">
                are doing.
              </span>
            </h1>
            <p className="text-lg text-t-secondary mb-10 max-w-md leading-relaxed font-medium">
              Full visibility into every agent run — cost per session, step-by-step traces,
              failure alerts, and token usage. Integrates in two lines of code.
            </p>
            <div className="flex gap-4">
              <Link href="/signup" className="btn-primary text-[15px] px-8 py-3">
                Start building free
              </Link>
              <Link href="/dashboard" className="btn-secondary text-[15px] px-8 py-3 bg-white text-black hover:bg-slate-50">
                View dashboard →
              </Link>
            </div>
          </div>

          {/* Right — floating glass window */}
          <div className="relative animate-slide-up hover-lift" style={{ animationDelay: "0.2s" }}>
            <div className="absolute inset-0 bg-gradient-to-tr from-acc-blue/10 to-acc-violet/10 blur-[80px] rounded-full z-0" />
            <div className="glass-panel p-2 relative z-10 bg-white/60">
              {/* Window header */}
              <div className="flex items-center gap-2 px-3 py-2 border-b border-dim-border mb-2">
                <span className="w-3 h-3 rounded-full bg-red-400 shadow-sm" />
                <span className="w-3 h-3 rounded-full bg-amber-400 shadow-sm" />
                <span className="w-3 h-3 rounded-full bg-green-400 shadow-sm" />
                <span className="text-xs text-t-ghost ml-3 font-semibold tracking-wide uppercase">Session Trace</span>
              </div>
              
              {/* Mock Trace UI */}
              <div className="p-3 space-y-3">
                <div className="flex items-start gap-4 hover:-translate-y-0.5 transition-transform">
                  <div className="w-2 h-2 rounded-full bg-acc-green mt-1.5 shadow-sm" />
                  <div className="bg-white border border-dim-border shadow-sm rounded-lg p-3 flex-1 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-t-primary">Agent initialized</p>
                      <p className="text-xs text-t-secondary">order-processing-agent</p>
                    </div>
                    <span className="text-xs text-t-ghost font-mono">0ms</span>
                  </div>
                </div>

                <div className="flex items-start gap-4 hover:-translate-y-0.5 transition-transform">
                  <div className="w-2 h-2 rounded-full bg-acc-violet mt-1.5 shadow-sm" />
                  <div className="bg-white border border-dim-border shadow-sm rounded-lg p-3 flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-t-primary">LLM Call <span className="text-xs text-t-ghost font-medium bg-slate-100 px-2 py-0.5 rounded ml-2">gpt-4o</span></p>
                      <span className="text-xs text-amber-600 font-mono font-bold">$0.0034</span>
                    </div>
                    <div className="flex gap-4 text-xs font-mono text-t-secondary">
                      <span>1,204 in</span>
                      <span>340 out</span>
                      <span>820ms</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4 hover:-translate-y-0.5 transition-transform">
                  <div className="w-2 h-2 rounded-full bg-acc-blue mt-1.5 shadow-sm" />
                  <div className="bg-white border border-dim-border shadow-sm rounded-lg p-3 flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-t-primary flex items-center gap-2">
                        <span className="text-acc-blue">tool_call</span> search_web
                      </p>
                      <span className="text-xs text-t-ghost font-mono">1,240ms</span>
                    </div>
                    <code className="text-xs font-mono text-t-secondary bg-slate-50 px-2 py-1 rounded">"latest AI news"</code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-24 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="glass-panel p-8 group animate-fade-in hover-lift bg-white/80"
              style={{ animationDelay: `${0.1 * i}s` }}
            >
              <div className="w-12 h-12 rounded-xl bg-slate-100 border border-dim-border flex items-center justify-center text-t-primary text-xl mb-6 shadow-sm group-hover:scale-110 group-hover:bg-acc-blue group-hover:text-white group-hover:border-acc-blue transition-all duration-300">
                {f.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 text-black">
                {f.title}
              </h3>
              <p className="text-[15px] text-t-secondary leading-relaxed font-medium">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>



      {/* Footer */}
      <footer className="border-t border-dim-border py-12 px-6 mt-12 bg-slate-50 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-[5px] bg-black shadow-sm flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full" />
            </div>
            <span className="text-[15px] font-bold text-black">AgentWatch</span>
          </div>
          <p className="text-sm font-medium text-t-ghost">
            © 2026 AgentWatch. Observability for AI teams.
          </p>
        </div>
      </footer>
    </div>
  );
}
