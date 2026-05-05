import AgentWatch from "./sdk/src/index";
import { randomInt } from "crypto";

// === Configuration ===
// 1. Go to your dashboard and create an Agent. Paste its ID here:
const AGENT_ID = process.env.AGENT_ID || "cmoofdhph0000nkbhk3mwim0r";

// 2. Go to your dashboard settings and create an API Key. Paste it here:
const API_KEY = process.env.AW_API_KEY || "aw_live_80d8905a0c92b065479635938c284f77";

// 3. Ensure your AgentWatch server is running (npm run dev & npm run workers)
const BASE_URL = "http://localhost:3000";

const aw = new AgentWatch({
  apiKey: API_KEY,
  baseUrl: BASE_URL,
});

async function simulateAgentSession() {
  const session = aw.session({
    agentId: AGENT_ID,
    metadata: {
      user: `user_${randomInt(1000)}`,
      environment: "simulation",
    },
    tags: ["demo", "simulation"],
  });

  console.log(`[+] Started session ${session.sessionId}`);

  try {
    // 1. Simulate an initial LLM call (e.g., routing)
    console.log(`    -> Simulating LLM call (routing)...`);
    const routeLatency = randomInt(400, 1200);
    await new Promise(r => setTimeout(r, routeLatency));
    await session.llmCall({
      model: "gpt-4o-mini",
      tokensIn: randomInt(100, 300),
      tokensOut: randomInt(20, 50),
      latencyMs: routeLatency,
    });

    // Random chance of using a tool
    if (Math.random() > 0.3) {
      console.log(`    -> Simulating tool call (search_db)...`);
      const toolLatency = randomInt(800, 2500);
      await new Promise(r => setTimeout(r, toolLatency));
      await session.toolCall({
        toolName: "search_db",
        input: { query: "customer recent orders" },
        output: { results: 3, status: "success" },
        latencyMs: toolLatency,
      });

      // 2. Simulate second LLM call (e.g., synthesis)
      console.log(`    -> Simulating LLM call (synthesis)...`);
      const synthLatency = randomInt(1000, 4000);
      await new Promise(r => setTimeout(r, synthLatency));
      await session.llmCall({
        model: "gpt-4o",
        tokensIn: randomInt(800, 2000),
        tokensOut: randomInt(200, 800),
        latencyMs: synthLatency,
      });
    }

    // Random chance of failure
    if (Math.random() > 0.8) {
      console.log(`    -> Simulating random failure...`);
      throw new Error("Rate limit exceeded from external API provider");
    }

    await session.end();
    console.log(`[-] Session completed successfully.\n`);
  } catch (err: any) {
    await session.error({
      message: err.message,
      stack: err.stack,
      fatal: true,
    });
    await session.end();
    console.log(`[!] Session failed with error: ${err.message}\n`);
  }
}

async function run() {
  if (AGENT_ID.includes("PASTE") || API_KEY.includes("PASTE")) {
    console.error(" Please paste your AGENT_ID and API_KEY at the top of this script first.");
    process.exit(1);
  }

  console.log("🚀 Starting AgentWatch simulation...");
  console.log("Press Ctrl+C to stop.\n");

  // Run a session every few seconds
  while (true) {
    await simulateAgentSession();
    const waitMs = randomInt(2000, 5000);
    await new Promise(r => setTimeout(r, waitMs));
  }
}

run();
