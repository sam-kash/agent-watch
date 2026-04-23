/**
 * Example: Wrapping an OpenAI agent with AgentWatch tracking
 *
 * Before AgentWatch — your agent has zero visibility:
 *   const res = await openai.chat.completions.create({ ... });
 *
 * After AgentWatch — full cost + trace tracking with 4 extra lines:
 */

import AgentWatch from "./index";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 1. Initialize once (e.g. in your app startup)
const aw = new AgentWatch({
  apiKey: process.env.AGENTWATCH_API_KEY!,
  baseUrl: "https://your-agentwatch.vercel.app",
});

// 2. Wrap each agent run in a session
export async function runSupportAgent(userMessage: string) {
  // Start a session (one per user request / agent run)
  const session = aw.session({
    agentId: "agt_support_main",
    metadata: { user: "demo", channel: "web" },
  });

  try {
    const start = Date.now();

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful support agent." },
        { role: "user", content: userMessage },
      ],
    });

    // 3. Track the LLM call
    await session.llmCall({
      model: "gpt-4o",
      tokensIn: response.usage?.prompt_tokens ?? 0,
      tokensOut: response.usage?.completion_tokens ?? 0,
      latencyMs: Date.now() - start,
    });

    const reply = response.choices[0].message.content ?? "";

    // Example: agent decides to call a tool
    if (reply.includes("lookup order")) {
      const toolStart = Date.now();
      const orderData = await fakeOrderLookup("ORD-123");

      // 4. Track the tool call
      await session.toolCall({
        toolName: "lookup_order",
        input: { orderId: "ORD-123" },
        output: orderData,
        latencyMs: Date.now() - toolStart,
      });
    }

    // 5. End the session — flushes everything
    await session.end();
    return reply;

  } catch (err: any) {
    // Track errors too
    await session.error({
      message: err.message,
      stack: err.stack,
      fatal: true,
    });
    await session.end();
    throw err;
  }
}

async function fakeOrderLookup(orderId: string) {
  return { orderId, status: "shipped", eta: "2 days" };
}
