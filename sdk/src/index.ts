/**
 * AgentWatch SDK
 * Track your AI agent's cost, behavior, and failures in production.
 *
 * Usage:
 *   import { AgentWatch } from "@agentwatch/sdk";
 *
 *   const aw = new AgentWatch({ apiKey: "aw_live_..." });
 *
 *   const session = aw.session({ agentId: "your-agent-id" });
 *   await session.llmCall({ model: "gpt-4o", tokensIn: 1200, tokensOut: 340, latencyMs: 820 });
 *   await session.toolCall({ toolName: "search_web", input: { query: "..." }, output: { results: [...] } });
 *   await session.end();
 */

export type AgentWatchConfig = {
  apiKey: string;
  baseUrl?: string;
  /** Flush events every N ms. Default: 2000 */
  flushIntervalMs?: number;
  /** Max events to buffer before force-flushing. Default: 50 */
  maxBatchSize?: number;
  /** Disable SDK entirely (useful for local dev). Default: false */
  disabled?: boolean;
};

export type LlmCallEvent = {
  model: string;
  provider?: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs?: number;
  prompt?: string;
  completion?: string;
  metadata?: Record<string, unknown>;
};

export type ToolCallEvent = {
  toolName: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  latencyMs?: number;
  error?: string;
};

export type ErrorEvent = {
  message: string;
  code?: string;
  stack?: string;
  fatal?: boolean;
};

type QueuedEvent = {
  type: string;
  occurredAt: string;
  payload: Record<string, unknown>;
};

// ─── Session ──────────────────────────────────────────────────────────────────

export class AgentSession {
  private queue: QueuedEvent[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private flushing = false;

  constructor(
    private readonly client: AgentWatch,
    public readonly agentId: string,
    public readonly sessionId: string,
    private readonly metadata?: Record<string, unknown>
  ) {
    // Auto-flush every N ms
    const interval = client["config"].flushIntervalMs ?? 2000;
    this.flushTimer = setInterval(() => this.flush(), interval);

    // Track session start
    this.push("AGENT_START", { metadata: this.metadata });
  }

  /** Track an LLM call (OpenAI, Anthropic, Gemini, etc.) */
  async llmCall(event: LlmCallEvent): Promise<void> {
    this.push("LLM_CALL", {
      model: event.model,
      provider: event.provider ?? inferProvider(event.model),
      tokens_in: event.tokensIn,
      tokens_out: event.tokensOut,
      latency_ms: event.latencyMs,
      prompt: event.prompt,
      completion: event.completion,
      ...event.metadata,
    });

    if (this.queue.length >= (this.client["config"].maxBatchSize ?? 50)) {
      await this.flush();
    }
  }

  /** Track a tool / function call */
  async toolCall(event: ToolCallEvent): Promise<void> {
    this.push(event.error ? "ERROR" : "TOOL_CALL", {
      tool_name: event.toolName,
      tool_input: event.input,
      tool_output: event.output,
      latency_ms: event.latencyMs,
      error: event.error,
    });
  }

  /** Track an error */
  async error(event: ErrorEvent): Promise<void> {
    this.push("ERROR", {
      message: event.message,
      error_code: event.code,
      stack: event.stack,
      fatal: event.fatal ?? false,
    });
  }

  /** Track any custom event */
  async track(type: string, payload: Record<string, unknown>): Promise<void> {
    this.push("CUSTOM", { event_type: type, ...payload });
  }

  /** Mark session as complete and flush remaining events */
  async end(metadata?: Record<string, unknown>): Promise<void> {
    this.push("AGENT_END", { metadata });
    if (this.flushTimer) clearInterval(this.flushTimer);
    await this.flush();
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private push(type: string, payload: Record<string, unknown>): void {
    this.queue.push({ type, occurredAt: new Date().toISOString(), payload });
  }

  async flush(): Promise<void> {
    if (this.flushing || this.queue.length === 0) return;
    if (this.client["config"].disabled) {
      this.queue = [];
      return;
    }

    this.flushing = true;
    const batch = this.queue.splice(0, 100); // Take up to 100

    try {
      await this.client["send"]({
        agentId: this.agentId,
        sessionId: this.sessionId,
        events: batch,
      });
    } catch (err) {
      // Put events back on failure (prepend so order is maintained)
      this.queue.unshift(...batch);
      if (process.env.NODE_ENV !== "production") {
        console.warn("[AgentWatch] Failed to flush events:", err);
      }
    } finally {
      this.flushing = false;
    }
  }
}

// ─── Client ───────────────────────────────────────────────────────────────────

export class AgentWatch {
  private config: AgentWatchConfig;

  constructor(config: AgentWatchConfig) {
    this.config = {
      baseUrl: "https://your-agentwatch-domain.com",
      flushIntervalMs: 2000,
      maxBatchSize: 50,
      disabled: false,
      ...config,
    };
  }

  /**
   * Start a new tracking session for one agent run.
   *
   * @param agentId   - The agent ID from your AgentWatch dashboard
   * @param sessionId - Your own run ID (optional — we generate one if omitted)
   */
  session(opts: {
    agentId: string;
    sessionId?: string;
    metadata?: Record<string, unknown>;
  }): AgentSession {
    const sessionId = opts.sessionId ?? generateId();
    return new AgentSession(this, opts.agentId, sessionId, opts.metadata);
  }

  private async send(payload: {
    agentId: string;
    sessionId: string;
    events: QueuedEvent[];
  }): Promise<void> {
    const url = `${this.config.baseUrl}/api/ingest`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`AgentWatch ingest failed: ${res.status} ${text}`);
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return `ses_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function inferProvider(model: string): string {
  if (model.startsWith("gpt-") || model.startsWith("o1") || model.startsWith("o3")) return "openai";
  if (model.startsWith("claude-")) return "anthropic";
  if (model.startsWith("gemini-")) return "google";
  if (model.startsWith("mistral-")) return "mistral";
  return "unknown";
}

// ─── Default export convenience ───────────────────────────────────────────────

export default AgentWatch;
