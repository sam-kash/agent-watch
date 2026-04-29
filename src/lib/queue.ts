import { Queue } from "bullmq";
import IORedis from "ioredis";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

export const QUEUES = {
  INGEST: "ingest-events",
  ALERTS: "check-alerts",
} as const;

let redisConnection: IORedis | null = null;
let ingestQueue: Queue<IngestJobData> | null = null;
let alertsQueue: Queue | null = null;

export function getRedisConnection() {
  if (!redisConnection) {
    redisConnection = new IORedis(REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: null, // Required by BullMQ
    });
  }

  return redisConnection;
}

export function getIngestQueue() {
  if (!ingestQueue) {
    ingestQueue = new Queue<IngestJobData>(QUEUES.INGEST, {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
      },
    });
  }

  return ingestQueue;
}

export function getAlertsQueue() {
  if (!alertsQueue) {
    alertsQueue = new Queue(QUEUES.ALERTS, {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: "fixed", delay: 5000 },
        removeOnComplete: { count: 500 },
      },
    });
  }

  return alertsQueue;
}

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
