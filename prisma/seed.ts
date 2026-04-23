import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const db = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding demo data...");

  // Create workspace
  const workspace = await db.workspace.upsert({
    where: { slug: "demo" },
    update: {},
    create: {
      id: "demo",
      name: "Demo Workspace",
      slug: "demo",
      plan: "FREE",
    },
  });

  // Create demo user
  const user = await db.user.upsert({
    where: { email: "demo@agentwatch.dev" },
    update: {},
    create: {
      id: "user_demo",
      email: "demo@agentwatch.dev",
      name: "Demo User",
    },
  });

  // Create membership
  await db.membership.upsert({
    where: { userId_workspaceId: { userId: user.id, workspaceId: workspace.id } },
    update: {},
    create: {
      userId: user.id,
      workspaceId: workspace.id,
      role: "OWNER",
    },
  });

  // Create demo agents
  const agents = await Promise.all([
    db.agent.upsert({
      where: { id: "agt_support" },
      update: {},
      create: {
        id: "agt_support",
        name: "Support Agent",
        description: "Handles customer support tickets",
        framework: "openai",
        workspaceId: workspace.id,
      },
    }),
    db.agent.upsert({
      where: { id: "agt_research" },
      update: {},
      create: {
        id: "agt_research",
        name: "Research Agent",
        description: "Web search + summarization pipeline",
        framework: "langchain",
        workspaceId: workspace.id,
      },
    }),
  ]);

  // Seed some fake sessions + events for the chart to show data
  for (let i = 0; i < 20; i++) {
    const agent = agents[i % 2];
    const startedAt = new Date(Date.now() - Math.random() * 86400_000);
    const failed = Math.random() < 0.15;

    const session = await db.agentSession.create({
      data: {
        agentId: agent.id,
        workspaceId: workspace.id,
        status: failed ? "FAILED" : "COMPLETED",
        startedAt,
        endedAt: new Date(startedAt.getTime() + Math.random() * 30_000),
        totalTokensIn: Math.floor(Math.random() * 5000 + 500),
        totalTokensOut: Math.floor(Math.random() * 2000 + 100),
        totalCostUsd: Math.random() * 0.05,
        eventCount: Math.floor(Math.random() * 10 + 2),
        errorCount: failed ? 1 : 0,
      },
    });

    // Add LLM call event
    await db.event.create({
      data: {
        type: "LLM_CALL",
        occurredAt: startedAt,
        model: i % 3 === 0 ? "claude-sonnet-4-6" : "gpt-4o",
        provider: i % 3 === 0 ? "anthropic" : "openai",
        tokensIn: Math.floor(Math.random() * 3000 + 300),
        tokensOut: Math.floor(Math.random() * 1000 + 100),
        costUsd: Math.random() * 0.04,
        latencyMs: Math.floor(Math.random() * 2000 + 400),
        payload: {},
        sessionId: session.id,
        agentId: agent.id,
        workspaceId: workspace.id,
      },
    });
  }

  console.log("✅ Seed complete. Workspace ID: demo");
  console.log("   Add SEED_WORKSPACE_ID=demo to your .env.local");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
