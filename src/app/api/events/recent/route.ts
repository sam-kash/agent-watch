import { db } from "@/lib/db";
import { getServerAuthContext } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const ctx = await getServerAuthContext();
  if (!ctx) return NextResponse.json({ events: [] });

  const recentEvents = await db.event.findMany({
    where: { workspaceId: ctx.workspace.id },
    include: { agent: { select: { name: true } } },
    orderBy: { occurredAt: "desc" },
    take: 20,
  });

  const events = recentEvents.map((e) => ({
    id: e.id,
    time: new Date(e.occurredAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }),
    agent: e.agent?.name ?? "unknown",
    type: e.type,
    detail: buildDetail(e),
    status: e.type === "ERROR" ? ("error" as const) : ("ok" as const),
  }));

  return NextResponse.json({ events });
}

function buildDetail(e: any): string {
  switch (e.type) {
    case "LLM_CALL":
      return `${e.model ?? "llm"} → $${(e.costUsd ?? 0).toFixed(4)}`;
    case "TOOL_CALL":
      return `tool:${e.toolName ?? "?"}`;
    case "ERROR":
      return e.errorMsg?.slice(0, 40) ?? "error";
    case "AGENT_START":
      return "started";
    case "AGENT_END":
      return "ended";
    default:
      return e.type.toLowerCase();
  }
}
