import { Worker } from "bullmq";
import { redisConnection, QUEUES } from "@/lib/queue";
import { db } from "@/lib/db";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Alert worker — triggered every 5 minutes by a repeatable job.
 * For each enabled alert rule, checks the metric over the rolling window
 * and fires the configured channel if the threshold is breached.
 *
 * Start alongside the event worker:
 *   npx tsx src/workers/alert-worker.ts
 */

export const alertWorker = new Worker(
  QUEUES.ALERTS,
  async (job) => {
    const { workspaceId } = job.data as { workspaceId: string };

    const rules = await db.alertRule.findMany({
      where: { workspaceId, enabled: true },
      include: { workspace: true },
    });

    for (const rule of rules) {
      const windowStart = new Date(Date.now() - rule.windowMin * 60_000);

      const value = await computeMetric(rule.metric, workspaceId, windowStart);

      const breached = evaluate(value, rule.operator, rule.threshold);
      if (!breached) continue;

      // Cooldown: don't re-fire within the same window period
      if (rule.lastFiredAt && rule.lastFiredAt > windowStart) continue;

      await fireAlert(rule, value);

      await db.alertRule.update({
        where: { id: rule.id },
        data: { lastFiredAt: new Date() },
      });

      console.log(`[alerts] Fired: "${rule.name}" — ${rule.metric} = ${value} (threshold: ${rule.operator} ${rule.threshold})`);
    }
  },
  { connection: redisConnection, concurrency: 5 }
);

// ─── Metric computation ───────────────────────────────────────────────────────

async function computeMetric(
  metric: string,
  workspaceId: string,
  since: Date
): Promise<number> {
  switch (metric) {
    case "COST_USD": {
      const result = await db.event.aggregate({
        where: { workspaceId, occurredAt: { gte: since } },
        _sum: { costUsd: true },
      });
      return result._sum.costUsd ?? 0;
    }

    case "ERROR_RATE": {
      const [total, errors] = await Promise.all([
        db.agentSession.count({ where: { workspaceId, startedAt: { gte: since } } }),
        db.agentSession.count({ where: { workspaceId, startedAt: { gte: since }, status: "FAILED" } }),
      ]);
      return total > 0 ? errors / total : 0;
    }

    case "TOKEN_COUNT": {
      const result = await db.event.aggregate({
        where: { workspaceId, occurredAt: { gte: since } },
        _sum: { tokensIn: true, tokensOut: true },
      });
      return (result._sum.tokensIn ?? 0) + (result._sum.tokensOut ?? 0);
    }

    case "LATENCY_P95": {
      // Raw SQL for percentile — Prisma doesn't support this natively
      const rows = await db.$queryRaw<{ p95: number }[]>`
        SELECT PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY "latencyMs") AS p95
        FROM "Event"
        WHERE "workspaceId" = ${workspaceId}
          AND "occurredAt" >= ${since}
          AND "latencyMs" IS NOT NULL
      `;
      return rows[0]?.p95 ?? 0;
    }

    default:
      return 0;
  }
}

function evaluate(value: number, operator: string, threshold: number): boolean {
  switch (operator) {
    case "gt": return value > threshold;
    case "gte": return value >= threshold;
    case "lt": return value < threshold;
    case "lte": return value <= threshold;
    default: return false;
  }
}

// ─── Notification channels ────────────────────────────────────────────────────

async function fireAlert(rule: any, value: number) {
  const metricLabel = formatMetric(rule.metric, value);
  const title = `[AgentWatch] Alert: ${rule.name}`;
  const body = `Your metric "${rule.metric}" hit ${metricLabel} (threshold: ${rule.operator} ${rule.threshold}).`;

  switch (rule.channel) {
    case "email":
      await fireEmail(rule.workspace, title, body);
      break;
    case "slack":
      await fireSlack(rule.channelConfig?.slackWebhookUrl, title, body);
      break;
    case "webhook":
      await fireWebhook(rule.channelConfig?.url, { rule, value, firedAt: new Date() });
      break;
  }
}

async function fireEmail(workspace: any, subject: string, text: string) {
  // Get workspace owner email
  const owner = await db.membership.findFirst({
    where: { workspaceId: workspace.id, role: "OWNER" },
    include: { user: true },
  });
  if (!owner) return;

  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "alerts@agentwatch.dev",
    to: owner.user.email,
    subject,
    text,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #7c3aed; margin: 0 0 8px;">⚠️ Alert triggered</h2>
        <p style="color: #374151; margin: 0 0 16px;">${text}</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
           style="background:#7c3aed;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;">
          View dashboard →
        </a>
      </div>
    `,
  });
}

async function fireSlack(webhookUrl: string | undefined, title: string, body: string) {
  if (!webhookUrl) return;
  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: `*${title}*\n${body}`,
    }),
  });
}

async function fireWebhook(url: string | undefined, payload: object) {
  if (!url) return;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

function formatMetric(metric: string, value: number): string {
  switch (metric) {
    case "COST_USD": return `$${value.toFixed(4)}`;
    case "ERROR_RATE": return `${(value * 100).toFixed(1)}%`;
    case "TOKEN_COUNT": return `${value.toLocaleString()} tokens`;
    case "LATENCY_P95": return `${value}ms`;
    default: return String(value);
  }
}

// ─── Schedule recurring checks every 5 minutes ───────────────────────────────

import { alertsQueue } from "@/lib/queue";
import { db as dbClient } from "@/lib/db";

async function scheduleAlertChecks() {
  const workspaces = await dbClient.workspace.findMany({
    where: { alertRules: { some: { enabled: true } } },
    select: { id: true },
  });

  for (const ws of workspaces) {
    await alertsQueue.add(
      "check-alerts",
      { workspaceId: ws.id },
      {
        repeat: { every: 5 * 60_000 }, // every 5 minutes
        jobId: `alerts-${ws.id}`,
      }
    );
  }
}

scheduleAlertChecks().catch(console.error);

alertWorker.on("completed", (job) => console.log(`[alerts] Job ${job.id} done`));
alertWorker.on("failed", (job, err) => console.error(`[alerts] Job ${job?.id} failed:`, err.message));

process.on("SIGTERM", async () => {
  await alertWorker.close();
  process.exit(0);
});

console.log("[alerts] Alert worker started");
