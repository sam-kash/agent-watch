import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateApiKey } from "@/lib/api-keys";
import { CreateApiKeySchema } from "@/lib/schemas";

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const keys = await db.apiKey.findMany({
    where: { workspaceId: ctx.workspace.id, revokedAt: null },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      lastUsedAt: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ keys });
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only owners/admins can create keys
  if (ctx.role === "MEMBER") {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = CreateApiKeySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 422 });
  }

  const { raw, hash, prefix } = generateApiKey();

  await db.apiKey.create({
    data: {
      name: parsed.data.name,
      keyHash: hash,
      keyPrefix: prefix,
      userId: ctx.user.id,
      workspaceId: ctx.workspace.id,
    },
  });

  // Return the raw key ONCE — never stored, never retrievable again
  return NextResponse.json({ key: raw, prefix }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (ctx.role === "MEMBER") {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const { id } = await req.json();
  await db.apiKey.updateMany({
    where: { id, workspaceId: ctx.workspace.id },
    data: { revokedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
