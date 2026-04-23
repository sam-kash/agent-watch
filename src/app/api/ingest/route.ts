import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ingestQueue } from "@/lib/queue";
import { hashApiKey, extractBearerToken } from "@/lib/api-keys";
import { IngestPayloadSchema } from "@/lib/schemas";
import { rateLimit, getPlanLimits } from "@/lib/rate-limit";
import { checkEventLimit } from "@/lib/plan-limits";

export const runtime = "nodejs";

// CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}

export async function POST(req: NextRequest) {
  // ── 1. Authenticate ───────────────────────────────────────────────────────
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ error: "Missing API key" }, { status: 401 });
  }

  const keyHash = hashApiKey(token);
  const apiKey = await db.apiKey.findUnique({
    where: { keyHash },
    select: {
      id: true,
      revokedAt: true,
      workspaceId: true,
      workspace: { select: { plan: true } },
    },
  });

  if (!apiKey || apiKey.revokedAt) {
    return NextResponse.json({ error: "Invalid or revoked API key" }, { status: 401 });
  }

  // ── 2. Rate limit ─────────────────────────────────────────────────────────
  const limits = getPlanLimits(apiKey.workspace.plan);
  const rl = await rateLimit(keyHash, limits);

  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", retryAfter: rl.resetIn },
      {
        status: 429,
        headers: {
          "Retry-After": String(rl.resetIn),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  // Update lastUsedAt fire-and-forget
  db.apiKey
    .update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {});

  // ── 3. Validate body ──────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = IngestPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 422 }
    );
  }

  const { agentId, sessionId, events } = parsed.data;

  // ── 4. Plan limits ────────────────────────────────────────────────────────
  const limitCheck = await checkEventLimit(
    apiKey.workspaceId,
    apiKey.workspace.plan,
    events.length
  );
  if (!limitCheck.allowed) {
    return NextResponse.json({ error: limitCheck.reason }, { status: 402 });
  }

  // ── 5. Verify agent belongs to workspace ──────────────────────────────────
  const agent = await db.agent.findFirst({
    where: { id: agentId, workspaceId: apiKey.workspaceId },
    select: { id: true },
  });

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  // ── 6. Enqueue for async processing ──────────────────────────────────────
  await ingestQueue.add(
    "process-events",
    { workspaceId: apiKey.workspaceId, agentId, sessionId, events },
    { jobId: `${sessionId}-${Date.now()}` }
  );

  return NextResponse.json(
    { ok: true, queued: events.length },
    {
      status: 202,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "X-RateLimit-Remaining": String(rl.remaining),
      },
    }
  );
}
