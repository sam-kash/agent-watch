import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { workspace } = ctx;
  const { searchParams } = new URL(req.url);

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
  const agentId = searchParams.get("agentId");
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const where: Prisma.AgentSessionWhereInput = {
    workspaceId: workspace.id,
    ...(agentId && { agentId }),
    ...(status && { status: status as any }),
    ...(search && {
      OR: [
        { id: { contains: search, mode: "insensitive" } },
        { externalId: { contains: search, mode: "insensitive" } },
        { tags: { has: search } },
      ],
    }),
  };

  const [sessions, total] = await Promise.all([
    db.agentSession.findMany({
      where,
      include: {
        agent: { select: { id: true, name: true, framework: true } },
        _count: { select: { events: true } },
      },
      orderBy: { startedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.agentSession.count({ where }),
  ]);

  return NextResponse.json({
    sessions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}
