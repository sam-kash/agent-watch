import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { CreateAgentSchema } from "@/lib/schemas";
import { checkAgentLimit } from "@/lib/plan-limits";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId") ?? process.env.SEED_WORKSPACE_ID ?? "demo";

  const agents = await db.agent.findMany({
    where: { workspaceId },
    include: { _count: { select: { sessions: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ agents });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = CreateAgentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 422 }
    );
  }

  const workspaceId = body.workspaceId ?? process.env.SEED_WORKSPACE_ID ?? "demo";

  // Enforce plan agent limit
  const workspace = await db.workspace.findUnique({
    where: { id: workspaceId },
    select: { plan: true },
  });

  if (workspace) {
    const limitCheck = await checkAgentLimit(workspaceId, workspace.plan);
    if (!limitCheck.allowed) {
      return NextResponse.json({ error: limitCheck.reason }, { status: 402 });
    }
  }

  const agent = await db.agent.create({
    data: { ...parsed.data, workspaceId },
  });

  return NextResponse.json({ agent }, { status: 201 });
}
