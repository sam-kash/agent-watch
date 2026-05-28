export default function LandingPage() {
  return (
    <div className="min-h-screen bg-void text-t-primary relative overflow-hidden font-sans">
      <div className="ambient-glow top-[-100px] left-[-100px] opacity-60 animate-float" />
      <div className="ambient-glow-purple top-[10%] right-[-50px] opacity-60 animate-float" style={{ animationDelay: "2s" }} />

      {/* Nav */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 glass-pill px-6 py-3 flex items-center justify-between w-[90%] max-w-5xl transition-all duration-300">
        <div className="flex items-center gap-3 group">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-active-border to-orange-400 shadow-md flex items-center justify-center transition-transform group-hover:scale-105">
            <div className="w-2 h-2 bg-white rounded-full shadow-inner" />
          </div>
          <span className="text-[16px] font-semibold tracking-tight text-t-primary">AgentWatch</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm font-medium text-t-secondary hover:text-white transition-colors">
            Log In
          </Link>
          <Link href="/signup" className="btn-primary">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-40 pb-24 relative z-10 min-h-[80vh] flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left — text */}
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-active-border mb-6 px-4 py-2 rounded-full border border-active-border/20 bg-active-border/5 shadow-inner">
              <span className="w-2 h-2 bg-active-border rounded-full animate-pulse-slow shadow-[0_0_8px_var(--color-active-border)]" />
              Agent observability, redefined
            </div>
            <h1 className="text-5xl lg:text-[72px] font-semibold tracking-tight mb-8 leading-[1.05] text-white">
              Observe<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-active-border">
                every run.
              </span>
            </h1>
            <p className="text-[16px] text-t-secondary mb-10 max-w-md leading-relaxed">
              Full visibility into your AI agents. Precision cost metrics, step-by-step traces, 
              and token usage — built for high-performance teams.
            </p>
            <div className="flex gap-4">
              <Link href="/signup" className="btn-primary px-8 py-3.5 text-[15px]">
                Start Building Free
              </Link>
              <Link href="/dashboard" className="btn-secondary px-8 py-3.5 text-[15px]">
                View Dashboard
              </Link>
            </div>
          </div>

          {/* Right — smooth window */}
          <div className="relative animate-slide-up hover-lift" style={{ animationDelay: "0.2s" }}>
            <div className="absolute inset-0 bg-gradient-to-tr from-active-border/20 to-orange-500/10 blur-[60px] rounded-full z-0" />
            <div className="glass-panel p-2 relative z-10">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/5 rounded-t-xl mb-2">
                <span className="text-[12px] font-mono text-t-ghost uppercase tracking-wider">Session_Trace</span>
                <span className="w-2.5 h-2.5 rounded-full bg-active-border shadow-[0_0_6px_var(--color-active-border)]" />
              </div>
              
              <div className="p-3 space-y-3">
                <div className="flex items-start gap-4 hover:-translate-y-0.5 transition-transform">
                  <div className="w-2.5 h-2.5 rounded-full bg-acc-green mt-1.5 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                  <div className="bg-white/5 border border-white/5 shadow-sm rounded-xl p-3 flex-1 flex items-center justify-between backdrop-blur-sm">
                    <div>
                      <p className="text-[13px] font-medium text-white">Agent Initialized</p>
                      <p className="text-[11px] text-t-secondary font-mono mt-0.5">order-processing</p>
                    </div>
                    <span className="text-[11px] text-t-ghost font-mono">0ms</span>
                  </div>
                </div>

                <div className="flex items-start gap-4 hover:-translate-y-0.5 transition-transform">
                  <div className="w-2.5 h-2.5 rounded-full bg-active-border mt-1.5 shadow-[0_0_8px_rgba(255,85,0,0.4)]" />
                  <div className="bg-white/5 border border-white/5 shadow-sm rounded-xl p-3 flex-1 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[13px] font-medium text-white flex items-center gap-2">
                        LLM Call <span className="text-[10px] text-white bg-white/10 px-2 py-0.5 rounded-md font-mono">gpt-4o</span>
                      </p>
                      <span className="text-[11px] text-active-border font-mono font-medium">$0.0034</span>
                    </div>
                    <div className="flex gap-4 text-[11px] font-mono text-t-secondary">
                      <span>1,204 in</span>
                      <span>340 out</span>
                      <span>820ms</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4 hover:-translate-y-0.5 transition-transform">
                  <div className="w-2.5 h-2.5 rounded-full bg-t-primary mt-1.5 shadow-sm" />
                  <div className="bg-white/5 border border-white/5 shadow-sm rounded-xl p-3 flex-1 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[13px] font-medium text-white">
                        <span className="text-t-secondary mr-2 font-mono">tool_call</span>search_web
                      </p>
                      <span className="text-[11px] text-t-ghost font-mono">1,240ms</span>
                    </div>
                    <code className="text-[11px] font-mono text-t-secondary bg-black/40 border border-white/5 px-2 py-1 rounded-md block">"latest AI news"</code>
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
              className="glass-panel p-8 group animate-fade-in hover-lift"
              style={{ animationDelay: `${0.1 * i}s` }}
            >
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-t-primary text-xl mb-6 shadow-inner group-hover:bg-active-border group-hover:text-black group-hover:border-active-border transition-all duration-300">
                {f.icon}
              </div>
              <h3 className="text-[16px] font-medium mb-3 text-white">
                {f.title}
              </h3>
              <p className="text-[14px] text-t-secondary leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dim-border py-12 px-6 bg-surface/50 backdrop-blur-lg relative z-10 mt-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-[5px] bg-gradient-to-tr from-active-border to-orange-400 shadow-sm flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
            </div>
            <span className="text-[14px] font-semibold text-t-primary">AgentWatch</span>
          </div>
          <p className="text-[13px] text-t-ghost font-medium">
            © 2026 AgentWatch. Premium observability.
          </p>
        </div>
      </footer>
    </div>
  );
}
