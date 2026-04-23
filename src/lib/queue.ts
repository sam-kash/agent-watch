import { Queue, Worker, QueueEvents } from "bullmq";
import IORedis from "ioredis";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

// Shared Redis connection (BullMQ requires a dedicated connection per role)
export const redisConnection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null, // Required by BullMQ
});

// ─── Queue names ──────────────────────────────────────────────────────────────
export const QUEUES = {
  INGEST: "ingest-events",
  ALERTS: "check-alerts",
} as const;

// ─── Ingest queue (write path) ────────────────────────────────────────────────
export const ingestQueue = new Queue(QUEUES.INGEST, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
});

// ─── Alerts queue ─────────────────────────────────────────────────────────────
export const alertsQueue = new Queue(QUEUES.ALERTS, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "fixed", delay: 5000 },
    removeOnComplete: { count: 500 },
  },
});

export type IngestJobData = {
  workspaceId: string;
  agentId: string;
  sessionId: string;
  events: RawEvent[];
};

export type RawEvent = {
  type: string;
  occurredAt?: string;
  payload: Record<string, unknown>;
};
