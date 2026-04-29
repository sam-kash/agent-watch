import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { CreateAgentSchema } from "@/lib/schemas";
import { checkAgentLimit } from "@/lib/plan-limits";
import { getAuthContext } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const agents = await db.agent.findMany({
    where: { workspaceId: ctx.workspace.id },
    include: { _count: { select: { sessions: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ agents });
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (ctx.role === "MEMBER") {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = CreateAgentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 422 }
    );
  }

  const limitCheck = await checkAgentLimit(ctx.workspace.id, ctx.workspace.plan);
  if (!limitCheck.allowed) {
    return NextResponse.json({ error: limitCheck.reason }, { status: 402 });
  }

  const agent = await db.agent.create({
    data: { ...parsed.data, workspaceId: ctx.workspace.id },
  });

  return NextResponse.json({ agent }, { status: 201 });
}
