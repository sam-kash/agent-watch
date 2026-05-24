# How to Use the AgentWatch SDK

Welcome! If you are building an AI agent in another project and want to track its costs, see what tools it is using, or catch errors, you can easily plug AgentWatch into it. 

This guide will show you how to do that in 3 simple steps.

---

## Step 1: Install the Package

In the terminal of your **other project** (the one where your AI agent lives), run this command to install the AgentWatch library:

```bash
npm install agentwatch-telemetry
```

## Step 2: Keep Your Keys Safe

AgentWatch needs to know who is sending the data, which means you need an **API Key**. 
You should *never* type this key directly into your code files. Instead, put it in a `.env` file so it stays secret.

In your other project, open your `.env` file and add:

```env
AGENTWATCH_API_KEY="aw_live_your_secret_key_here"
AGENTWATCH_URL="http://localhost:3000" # Change this to your live URL when deployed
```
*(You can generate your API Key from the Settings page in your AgentWatch dashboard!)*

## Step 3: Write the Code

To keep things organized, it is best to set up AgentWatch once in a "helper" file, and then use it wherever your agent runs.

### A. Create a helper file
Create a new file in your project, for example `src/agentwatch.ts`, and add this code:

```typescript
import AgentWatch from "agentwatch-telemetry";

// This sets up AgentWatch using the secret keys from your .env file
export const aw = new AgentWatch({
  apiKey: process.env.AGENTWATCH_API_KEY as string,
  baseUrl: process.env.AGENTWATCH_URL as string,
});
```

### B. Track your Agent!
Now, whenever your AI agent does something (like making a call to OpenAI or using a search tool), you can track it. 

Every time your agent runs a task, it is called a **Session**. Here is how you use it:

```typescript
// Import the helper we just made
import { aw } from "./agentwatch";

async function runMyAgent() {
  // 1. Start a Session (You get the agentId from your AgentWatch Dashboard)
  const session = aw.session({ agentId: "agt_your_agent_id_here" });

  try {
    // 2. Log what the agent is doing!
    
    // Example: The agent used a tool
    await session.toolCall({ 
      toolName: "google_search", 
      latencyMs: 300 
    });
    
    // Example: The agent talked to ChatGPT
    await session.llmCall({
      model: "gpt-4o",
      tokensIn: 100,  // How many words you sent
      tokensOut: 50,  // How many words it replied
      latencyMs: 1200 // How long it took
    });

  } catch (error) {
    // 3. Log any errors if the agent crashes
    await session.error({ message: error.message, fatal: true });
  } finally {
    // 4. IMPORTANT: Always close the session when the agent is done!
    await session.end();
  }
}
```

---

### Summary
That's it! By adding those few lines of code, your agent will automatically send all its stats (costs, tokens, errors, and tool usage) back to your AgentWatch dashboard for you to monitor.
