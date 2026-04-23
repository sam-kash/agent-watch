import { db } from "@/lib/db";

const PLAN_LIMITS = {
  FREE: { eventsPerMonth: 10_000, agents: 1 },
  TEAM: { eventsPerMonth: 500_000, agents: 5 },
  SCALE: { eventsPerMonth: Infinity, agents: Infinity },
} as const;

type Plan = keyof typeof PLAN_LIMITS;

export async function checkEventLimit(
  workspaceId: string,
  plan: string,
  incomingCount: number
): Promise<{ allowed: boolean; reason?: string }> {
  const limits = PLAN_LIMITS[plan as Plan] ?? PLAN_LIMITS.FREE;

  if (limits.eventsPerMonth === Infinity) return { allowed: true };

  // Count events this calendar month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const monthlyCount = await db.event.count({
    where: {
      workspaceId,
      occurredAt: { gte: startOfMonth },
    },
  });

  if (monthlyCount + incomingCount > limits.eventsPerMonth) {
    return {
      allowed: false,
      reason: `Monthly event limit reached (${limits.eventsPerMonth.toLocaleString()} on ${plan} plan). Upgrade to continue tracking.`,
    };
  }

  return { allowed: true };
}

export async function checkAgentLimit(
  workspaceId: string,
  plan: string
): Promise<{ allowed: boolean; reason?: string }> {
  const limits = PLAN_LIMITS[plan as Plan] ?? PLAN_LIMITS.FREE;

  if (limits.agents === Infinity) return { allowed: true };

  const agentCount = await db.agent.count({ where: { workspaceId } });

  if (agentCount >= limits.agents) {
    return {
      allowed: false,
      reason: `Agent limit reached (${limits.agents} on ${plan} plan). Upgrade to add more agents.`,
    };
  }

  return { allowed: true };
}
