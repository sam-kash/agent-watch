import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { workspace } = ctx;

  const session = await db.agentSession.findFirst({
    where: { id: params.sessionId, workspaceId: workspace.id },
    include: {
      agent: true,
      events: {
        orderBy: { occurredAt: "asc" },
        select: {
          id: true,
          type: true,
          occurredAt: true,
          model: true,
          provider: true,
          tokensIn: true,
          tokensOut: true,
          costUsd: true,
          latencyMs: true,
          toolName: true,
          toolInput: true,
          toolOutput: true,
          errorCode: true,
          errorMsg: true,
          errorStack: true,
          payload: true,
        },
      },
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Build a plain-language summary of what happened
  const summary = buildSessionSummary(session);

  return NextResponse.json({ session, summary });
}

function buildSessionSummary(session: any): string {
  const parts: string[] = [];

  const llmCalls = session.events.filter((e: any) => e.type === "LLM_CALL");
  const toolCalls = session.events.filter((e: any) => e.type === "TOOL_CALL");
  const errors = session.events.filter((e: any) => e.type === "ERROR");

  if (session.status === "COMPLETED") {
    parts.push(`Session completed successfully.`);
  } else if (session.status === "FAILED") {
    parts.push(`Session failed.`);
  } else if (session.status === "RUNNING") {
    parts.push(`Session is still running.`);
  }

  if (llmCalls.length > 0) {
    const models = [...new Set(llmCalls.map((e: any) => e.model).filter(Boolean))];
    parts.push(
      `Made ${llmCalls.length} LLM call${llmCalls.length !== 1 ? "s" : ""} ` +
        (models.length > 0 ? `using ${models.join(", ")}` : "") +
        "."
    );
  }

  if (toolCalls.length > 0) {
    const tools = [...new Set(toolCalls.map((e: any) => e.toolName).filter(Boolean))];
    parts.push(
      `Called ${toolCalls.length} tool${toolCalls.length !== 1 ? "s" : ""}` +
        (tools.length > 0 ? `: ${tools.slice(0, 3).join(", ")}${tools.length > 3 ? "..." : ""}` : "") +
        "."
    );
  }

  if (session.totalCostUsd > 0) {
    parts.push(`Total cost: $${session.totalCostUsd.toFixed(4)}.`);
  }

  if (errors.length > 0) {
    parts.push(
      `Encountered ${errors.length} error${errors.length !== 1 ? "s" : ""}. ` +
        (session.lastErrorMsg ? `Last error: "${session.lastErrorMsg}".` : "")
    );
  }

  if (session.durationMs) {
    parts.push(`Ran for ${(session.durationMs / 1000).toFixed(1)}s.`);
  }

  return parts.join(" ");
}
