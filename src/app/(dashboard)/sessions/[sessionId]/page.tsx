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
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
          <Link href="/sessions" className="hover:text-gray-600">
            Sessions
          </Link>
          <span>/</span>
          <span className="font-mono">{session.id.slice(0, 16)}…</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">{session.agent.name}</h1>
          <StatusBadge status={session.status} />
        </div>
      </div>

      {/* Summary cards */}
      <SessionSummaryCard session={session} summary={summary} />

      {/* Trace timeline */}
      <div className="mt-6">
        <h2 className="text-sm font-medium text-gray-700 mb-3">Trace</h2>
        <TraceTimeline events={session.events as any} sessionStart={session.startedAt} />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    COMPLETED: "bg-green-50 text-green-700 border border-green-200",
    RUNNING: "bg-blue-50 text-blue-700 border border-blue-200",
    FAILED: "bg-red-50 text-red-700 border border-red-200",
    TIMEOUT: "bg-amber-50 text-amber-700 border border-amber-200",
  };
  return (
    <span
      className={`text-xs px-2.5 py-1 rounded-full ${
        styles[status] ?? "bg-gray-100 text-gray-500"
      }`}
    >
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
