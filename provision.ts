import { db } from "./src/lib/db.js";
import { randomBytes } from "crypto";
import fs from "fs";

async function run() {
  const email = "sankalpanhce@gmail.com";

  // 1. Find user
  const user = await db.user.findUnique({
    where: { email },
    include: { memberships: { include: { workspace: true } } },
  });

  if (!user || user.memberships.length === 0) {
    console.error("No user or workspace found for this email. Please sign up in the UI first.");
    process.exit(1);
  }

  const workspace = user.memberships[0].workspace;
  console.log("Found workspace:", workspace.name);

  // 2. Create Agent
  const agent = await db.agent.create({
    data: {
      name: "Simulation Agent",
      framework: "custom",
      workspaceId: workspace.id,
    },
  });
  console.log("Created Agent:", agent.id);

  // 3. Create API Key
  const rawKey = `aw_live_${randomBytes(16).toString("hex")}`;
  const { hashApiKey } = await import("./src/lib/api-keys.js");
  const keyHash = hashApiKey(rawKey);

  const apiKey = await db.apiKey.create({
    data: {
      name: "Simulation Key",
      keyHash,
      keyPrefix: rawKey.slice(0, 12),
      userId: user.id,
      workspaceId: workspace.id,
    },
  });
  console.log("Created API Key. Starts with:", apiKey.keyPrefix);

  // 4. Update simulate-traffic.ts
  const filePath = "simulate-traffic.ts";
  let content = fs.readFileSync(filePath, "utf8");
  
  content = content.replace(
    /const AGENT_ID = process\.env\.AGENT_ID \|\| ".*";/,
    `const AGENT_ID = process.env.AGENT_ID || "${agent.id}";`
  );
  
  content = content.replace(
    /const API_KEY = process\.env\.AW_API_KEY \|\| ".*";/,
    `const API_KEY = process.env.AW_API_KEY || "${rawKey}";`
  );

  fs.writeFileSync(filePath, content);
  console.log("✅ Updated simulate-traffic.ts with the new Agent ID and API Key!");

  process.exit(0);
}

run().catch(console.error);
