# AgentWatch — AI Agent Observability

Track cost, traces, failures, and token usage across every agent run.

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in your credentials
npx prisma generate
npx prisma migrate dev
npm run db:seed
npm run dev                  # :3000
npm run workers              # event + alert workers
```

## Deploy to Railway

```bash
railway login && railway init
railway add --database postgresql
railway add --database redis
railway variables set ...    # set all env vars from .env.example
railway up                   # deploys web + event-worker + alert-worker
```

## SDK

```ts
import AgentWatch from "@agentwatch/sdk";
const aw = new AgentWatch({ apiKey: "aw_live_...", baseUrl: "https://your-app.com" });

const session = aw.session({ agentId: "agt_..." });
await session.llmCall({ model: "gpt-4o", tokensIn: 1200, tokensOut: 340, latencyMs: 820 });
await session.end();
```

## Stack

Next.js 14 · TypeScript · Prisma · PostgreSQL · Redis · BullMQ · Supabase Auth · Stripe · Resend · Tailwind · Recharts
