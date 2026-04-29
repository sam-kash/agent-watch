import { Worker } from "bullmq";
import { getRedisConnection, QUEUES, type IngestJobData } from "@/lib/queue";
import { db } from "@/lib/db";
import { calculateCostUsd } from "@/lib/cost";
import { EventType, Prisma, SessionStatus } from "@prisma/client";

/**
 * The event worker is the core of AgentWatch's write path.
 * It runs as a separate process (not inside Next.js) in production.
 *
 * Start it with: npx tsx src/workers/event-worker.ts
 */

export const eventWorker = new Worker<IngestJobData>(
  QUEUES.INGEST,
  async (job) => {
    const { workspaceId, agentId, sessionId, events } = job.data;

    // ── 1. Upsert the session ────────────────────────────────────────────────
    let session = await db.agentSession.findFirst({
      where: { id: sessionId, workspaceId },
    });

    if (!session) {
      session = await db.agentSession.create({
        data: {
          id: sessionId,
          agentId,
          workspaceId,
          status: SessionStatus.RUNNING,
        },
      });
    }

    // ── 2. Process each event ────────────────────────────────────────────────
    let sessionCostDelta = 0;
    let sessionTokensInDelta = 0;
    let sessionTokensOutDelta = 0;
    let sessionErrorDelta = 0;
    let lastErrorMsg: string | undefined;
    let sessionEnded = false;
    let sessionFailed = false;

    const eventCreateInputs: Prisma.EventCreateManyInput[] = events.map((raw) => {
      const type = raw.type as EventType;
      const payload = raw.payload as Record<string, unknown>;
      const occurredAt = raw.occurredAt ? new Date(raw.occurredAt) : new Date();

      // Extract structured fields from payload
      const model = payload.model as string | undefined;
      const provider = payload.provider as string | undefined;
      const tokensIn = (payload.tokens_in ?? payload.tokensIn ?? payload.prompt_tokens) as number | undefined;
      const tokensOut = (payload.tokens_out ?? payload.tokensOut ?? payload.completion_tokens) as number | undefined;
      const latencyMs = (payload.latency_ms ?? payload.latencyMs) as number | undefined;
      const toolName = payload.tool_name as string | undefined;
      const errorMsg = (payload.error ?? payload.message ?? payload.error_message) as string | undefined;
      const errorCode = payload.error_code as string | undefined;
      const errorStack = payload.stack as string | undefined;

      // Calculate cost
      let costUsd: number | undefined;
      if (type === EventType.LLM_CALL && model && tokensIn != null && tokensOut != null) {
        costUsd = calculateCostUsd(model, tokensIn, tokensOut);
        sessionCostDelta += costUsd;
        sessionTokensInDelta += tokensIn;
        sessionTokensOutDelta += tokensOut;
      }

      if (type === EventType.ERROR) {
        sessionErrorDelta++;
        lastErrorMsg = errorMsg;
      }

      if (type === EventType.AGENT_END) sessionEnded = true;
      if (type === EventType.ERROR && payload.fatal) sessionFailed = true;

      return {
        type,
        occurredAt,
        payload: payload as Prisma.InputJsonValue,
        model,
        provider,
        tokensIn,
        tokensOut,
        costUsd,
        latencyMs,
        toolName,
        toolInput: payload.tool_input as Prisma.InputJsonValue | undefined,
        toolOutput: payload.tool_output as Prisma.InputJsonValue | undefined,
        errorCode,
        errorMsg,
        errorStack,
        sessionId: session!.id,
        agentId,
        workspaceId,
      };
    });

    // ── 3. Bulk insert events ────────────────────────────────────────────────
    await db.event.createMany({ data: eventCreateInputs });

    // ── 4. Update session rollup atomically ──────────────────────────────────
    const newStatus = sessionFailed
      ? SessionStatus.FAILED
      : sessionEnded
      ? SessionStatus.COMPLETED
      : SessionStatus.RUNNING;

    await db.agentSession.update({
      where: { id: session.id },
      data: {
        totalCostUsd: { increment: sessionCostDelta },
        totalTokensIn: { increment: sessionTokensInDelta },
        totalTokensOut: { increment: sessionTokensOutDelta },
        errorCount: { increment: sessionErrorDelta },
        eventCount: { increment: events.length },
        status: newStatus,
        endedAt: sessionEnded ? new Date() : undefined,
        lastErrorMsg: lastErrorMsg ?? undefined,
      },
    });

    job.log(`Processed ${events.length} events for session ${sessionId}. Cost delta: $${sessionCostDelta.toFixed(6)}`);
  },
  {
    connection: getRedisConnection(),
    concurrency: 10, // Process 10 jobs in parallel
  }
);

eventWorker.on("completed", (job) => {
  console.log(`[worker] Job ${job.id} completed`);
});

eventWorker.on("failed", (job, err) => {
  console.error(`[worker] Job ${job?.id} failed:`, err.message);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  await eventWorker.close();
  process.exit(0);
});

console.log("[worker] Event worker started, waiting for jobs...");
