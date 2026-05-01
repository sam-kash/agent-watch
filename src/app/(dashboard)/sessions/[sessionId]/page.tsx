import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { TraceTimeline } from "@/components/sessions/TraceTimeline";
import { SessionSummaryCard } from "@/components/sessions/SessionSummaryCard";
import { getServerAuthContext } from "@/lib/auth";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const ctx = await getServerAuthContext();
  if (!ctx) redirect("/login");
  const { sessionId } = await params;

  const session = await db.agentSession.findFirst({
    where: { id: sessionId, workspaceId: ctx.workspace.id },
    include: {
      agent: true,
      events: {
        orderBy: { occurredAt: "asc" },
      },
    },
  });

  if (!session) notFound();

  const summary = buildSummary(session);

  return (
    <div className="p-5 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-2 text-[10px] font-mono text-t-ghost mb-2">
          <Link href="/sessions" className="hover:text-cyan transition-colors">
            Sessions
          </Link>
          <span className="text-t-ghost">/</span>
          <span className="text-t-secondary">{session.id.slice(0, 16)}…</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="font-display text-lg font-semibold text-t-primary">
            {session.agent.name}
          </h1>
          <StatusBadge status={session.status} />
        </div>
      </div>

      {/* Summary */}
      <SessionSummaryCard session={session} summary={summary} />

      {/* Trace timeline */}
      <div className="mt-5">
        <h2 className="text-[9px] font-mono font-medium tracking-[0.12em] text-t-ghost uppercase mb-3">
          Trace timeline
        </h2>
        <TraceTimeline events={session.events as any} sessionStart={session.startedAt} />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { dot: string; text: string }> = {
    COMPLETED: { dot: "status-dot-completed", text: "text-acc-green" },
    RUNNING: { dot: "status-dot-running", text: "text-cyan" },
    FAILED: { dot: "status-dot-failed", text: "text-acc-red" },
    TIMEOUT: { dot: "status-dot-timeout", text: "text-amber" },
  };
  const cfg = config[status] ?? { dot: "status-dot-completed", text: "text-t-ghost" };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-medium border border-dim-border bg-elevated ${cfg.text}`}>
      <span className={`status-dot ${cfg.dot}`} />
      {status.toLowerCase()}
    </span>
  );
}

function buildSummary(session: any): string {
  const parts: string[] = [];
  const llm = session.events.filter((e: any) => e.type === "LLM_CALL");
  const tools = session.events.filter((e: any) => e.type === "TOOL_CALL");
  const errs = session.events.filter((e: any) => e.type === "ERROR");

  if (session.status === "COMPLETED") parts.push("Session completed successfully.");
  else if (session.status === "FAILED") parts.push("Session failed.");
  else if (session.status === "RUNNING") parts.push("Session is still running.");

  if (llm.length) {
    const models = [...new Set(llm.map((e: any) => e.model).filter(Boolean))];
    parts.push(
      `Made ${llm.length} LLM call${llm.length !== 1 ? "s" : ""}${
        models.length ? ` (${models.join(", ")})` : ""
      }.`
    );
  }
  if (tools.length) {
    const names = [...new Set(tools.map((e: any) => e.toolName).filter(Boolean))];
    parts.push(
      `Used ${tools.length} tool${tools.length !== 1 ? "s" : ""}${
        names.length ? `: ${names.slice(0, 3).join(", ")}` : ""
      }.`
    );
  }
  if (session.totalCostUsd > 0) parts.push(`Total cost: $${session.totalCostUsd.toFixed(5)}.`);
  if (errs.length) {
    parts.push(
      `${errs.length} error${errs.length !== 1 ? "s" : ""}. Last: "${
        session.lastErrorMsg ?? "unknown"
      }".`
    );
  }
  if (session.durationMs) parts.push(`Ran for ${(session.durationMs / 1000).toFixed(1)}s.`);

  return parts.join(" ");
}
